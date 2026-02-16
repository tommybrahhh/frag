import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClientView from '@/components/features/profile/ProfileClientView';
import { Database } from '@/types/database';
import { analyzeWardrobe } from '@/lib/analytics';
import { RecommendationEngine, Recommendation } from '@/lib/recommendation-engine';

// Type definitions for clarity
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type Profiles = Tables<'profiles'>;
type Perfumes = Tables<'perfumes'>;
type Brands = Tables<'brands'> & { tier: Database["public"]["Enums"]["brand_tier_type"] | null };
type UserCollections = Tables<'user_collections'>;


export default async function ProfilePage() {
  const supabase = await createClient(); // Await the client creation

  // 1. Fetch User Session (server-side)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login'); // Redirect to login if not authenticated
  }

  // 2. Fetch User's Profile (server-side)
  let profile = null;
  try {
    const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio, signature_scent_id, avatar_url, is_verified')
        .eq('id', user.id)
        .single() as any;
    
    if (error) {
        // If error is PGRST116 (no rows), we just use defaults.
        // If other error (e.g. column missing), we log and proceed.
        console.error('Error fetching profile:', error);
    } else {
        profile = data;
    }
  } catch (err) {
      console.error('Unexpected error fetching profile:', err);
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || null;
  const bio = profile?.bio || null;
  const signatureScentId = profile?.signature_scent_id || null;
  const avatarUrl = profile?.avatar_url || null;
  const isVerified = profile?.is_verified || false;

  // 3. Fetch User's Collection (server-side)
  // Attempt to fetch with list_type. If it fails (migration not run), fallback to legacy query.
  let rawCollection: any[] | null = null;
  
  const { data: colData, error: colError } = await supabase
    .from('user_collections')
    .select(`
      id,
      list_type,
      perfume:perfumes (
        id,
        name,
        slug,
        image_url,
        brand:brands (name),
        olfactory_family,
        best_season,
        vibe_tags,
        rating,
        perfume_notes(type, note:notes(name))
      )
    `)
    .eq('user_id', user.id) as any;

  if (colError) {
    // Check if error is due to missing column (Postgres error 42703: undefined_column)
    // Note: Supabase/Postgrest might return different codes/messages, so we try fallback for most errors or log
    console.warn('Primary collection fetch failed (likely missing list_type), trying fallback:', colError.message);
    
    const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_collections')
        .select(`
          id,
          perfume:perfumes (
            id,
            name,
            slug,
            image_url,
            brand:brands (name),
            olfactory_family,
            best_season,
            vibe_tags,
            rating,
            perfume_notes(type, note:notes(name))
          )
        `)
        .eq('user_id', user.id) as any;
        
    if (fallbackError) {
        console.error('Fallback collection fetch failed:', fallbackError);
        // Return empty view only if both fail
        return (
            <ProfileClientView 
                userEmail={user.email || 'Guest'} 
                displayName={displayName} 
                bio={bio}
                isVerified={isVerified}
                initialCollection={[]} 
                initialComments={[]}
                insights={{ 
                    totalCount: 0, 
                    topFamilies: [], 
                    topBrands: [], 
                    seasonPreference: [],
                    scentDNA: { warmth: 0, freshness: 0, floral: 0, woody: 0, spicy: 0, depth: 0 }
                }}
                topMatches={[]}
                discoverySelections={[]}
            />
        );
    }
    rawCollection = fallbackData;
  } else {
    rawCollection = colData;
  }
  
  // Flatten and type-assert the collection
  // Note: We fetched more data (notes, vibes) to help with the engine
  const initialCollection = (rawCollection?.map((item: any) => {
    const perfumeData = Array.isArray(item.perfume) ? item.perfume[0] : item.perfume;
    if (!perfumeData) return null;
    return {
      ...perfumeData,
      collection_id: item.id,
      list_type: item.list_type || 'owned' // Default to owned for legacy data
    };
  })
    .filter((p): p is any => p !== null) || []) as (Perfumes & { brand: Brands | null, collection_id: string, list_type: "owned" | "wishlist" | "tested" })[];

  // --- NEW: ANALYTICS & RECOMMENDATIONS ---
  // Only analyze "owned" items for the user's wardrobe stats
  const ownedCollection = initialCollection.filter(p => p.list_type === 'owned');
  const insights = analyzeWardrobe(ownedCollection);
  
  let topMatches: Recommendation[] = [];
  let discoverySelections: Recommendation[] = [];

  // Use owned items for profile, but fallback to ALL items (wishlist) if wardrobe is empty
  // This ensures new users who just bookmarked items still get recommendations
  const profileSourceCollection = ownedCollection.length > 0 ? ownedCollection : initialCollection;

  // Only fetch recommendations if we have some data preferences
  if (profileSourceCollection.length > 0) {
    // 1. Fetch all perfumes for analysis (cached/optimized in real world, direct here)
    // Pass the server-side supabase client to ensure it works in this server component
    const allPerfumes = await RecommendationEngine.getAllPerfumes(supabase);

    // 2. Create Composite User Profile (from OWNED items, or fallback)
    const userProfile = RecommendationEngine.createCompositeProfile(profileSourceCollection);

    if (userProfile) {
        // 3. Generate Recommendations
        // Filter out owned AND wishlist items (don't recommend what they already bookmarked)
        const ownedIds = new Set(initialCollection.map(p => p.id));
        
        // A. Perfect Matches (Fixed, Sorted by Score)
        const rawTopMatches = RecommendationEngine.getSimilarRecommendations(userProfile, allPerfumes, 30);
        topMatches = rawTopMatches
            .filter(rec => !ownedIds.has(rec.perfume.id))
            .slice(0, 12);

        // B. Discovery (Shuffled, Intriguing)
        const rawDiscovery = RecommendationEngine.getDiscoveryRecommendations(userProfile, allPerfumes, 20);
        const filteredDiscovery = rawDiscovery.filter(rec => !ownedIds.has(rec.perfume.id));
        
        // Shuffle the discovery list to keep it fresh
        discoverySelections = shuffleArray(filteredDiscovery).slice(0, 6);
    }
  }

  // --- NEW: Fetch User Comments ---
  const { data: userComments } = await supabase
    .rpc('get_user_comments' as any, { p_user_id: user.id } as any);

  // Render the Client Component with pre-fetched data
  return (
    <ProfileClientView 
      userEmail={user.email || 'Member'}
      displayName={displayName}
      bio={bio}
      initialSignatureScentId={signatureScentId}
      initialAvatarUrl={avatarUrl}
      isVerified={isVerified}
      initialCollection={initialCollection}
      initialComments={userComments || []}
      insights={insights}
      topMatches={topMatches}
      discoverySelections={discoverySelections}
    />
  );
}

// Helper to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}