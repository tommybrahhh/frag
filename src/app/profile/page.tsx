import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClientView from '@/components/ProfileClientView';
import { Database } from '@/types/database';
import { analyzeWardrobe } from '@/lib/analytics';
import { RecommendationEngine, Recommendation } from '@/lib/recommendation-engine';

// Type definitions for clarity
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type Profiles = Tables<'profiles'>;
type Perfumes = Tables<'perfumes'>;
type Brands = Tables<'brands'>;
type UserCollections = Tables<'user_collections'>;


export default async function ProfilePage() {
  const supabase = await createClient(); // Await the client creation

  // 1. Fetch User Session (server-side)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login'); // Redirect to login if not authenticated
  }

  // 2. Fetch User's Profile (server-side)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name, bio')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || null;
  const bio = profile?.bio || null;

  // 3. Fetch User's Collection (server-side)
  const { data: rawCollection, error: collectionError } = await supabase
    .from('user_collections')
    .select(`
      id,
      perfume:perfumes (
        id,
        name,
        image_url,
        brand:brands (name),
        olfactory_family,
        best_season,
        vibe_tags,
        perfume_notes(type, note:notes(name))
      )
    `)
    .eq('user_id', user.id);

  if (collectionError) {
    console.error('Error fetching collection:', collectionError);
    // For now, return empty collection on error. 
    // We pass empty insights/recs in this case.
    return (
        <ProfileClientView 
            userEmail={user.email || 'Guest'} 
            displayName={displayName} 
            bio={bio} 
            initialCollection={[]} 
            insights={{ totalCount: 0, topFamilies: [], topBrands: [], seasonPreference: [] }}
            topMatches={[]}
            discoverySelections={[]}
        />
    );
  }
  
  // Flatten and type-assert the collection
  // Note: We fetched more data (notes, vibes) to help with the engine
  const initialCollection = (rawCollection?.map((item) => ({
    ...item.perfume, // Spread perfume data
    collection_id: item.id // Add the collection item ID
  }))
    .filter((perfume): perfume is Perfumes & { brand: Brands | null, collection_id: string } => perfume !== null) || []) as (Perfumes & { brand: Brands | null, collection_id: string })[];

  // --- NEW: ANALYTICS & RECOMMENDATIONS ---
  const insights = analyzeWardrobe(initialCollection);
  
  let topMatches: Recommendation[] = [];
  let discoverySelections: Recommendation[] = [];

  // Only fetch recommendations if we have some data preferences
  if (initialCollection.length > 0) {
    // 1. Fetch all perfumes for analysis (cached/optimized in real world, direct here)
    // Pass the server-side supabase client to ensure it works in this server component
    const allPerfumes = await RecommendationEngine.getAllPerfumes(supabase);
    console.log('DEBUG: initialCollection count:', initialCollection.length);
    console.log('DEBUG: allPerfumes count:', allPerfumes.length);

    // 2. Create Composite User Profile
    const userProfile = RecommendationEngine.createCompositeProfile(initialCollection);

    if (userProfile) {
        // 3. Generate Recommendations
        // Filter out owned perfumes
        const ownedIds = new Set(initialCollection.map(p => p.id));
        
        // A. Perfect Matches (Fixed, Sorted by Score)
        const rawTopMatches = RecommendationEngine.getSimilarRecommendations(userProfile, allPerfumes, 20);
        topMatches = rawTopMatches
            .filter(rec => !ownedIds.has(rec.perfume.id))
            .slice(0, 6);
        console.log('DEBUG: topMatches count:', topMatches.length);

        // B. Discovery (Shuffled, Intriguing)
        const rawDiscovery = RecommendationEngine.getDiscoveryRecommendations(userProfile, allPerfumes, 20);
        const filteredDiscovery = rawDiscovery.filter(rec => !ownedIds.has(rec.perfume.id));
        
        // Shuffle the discovery list to keep it fresh
        discoverySelections = shuffleArray(filteredDiscovery).slice(0, 6);
        console.log('DEBUG: discoverySelections count:', discoverySelections.length);
    }
  }

  // Render the Client Component with pre-fetched data
  return (
    <ProfileClientView 
      userEmail={user.email || 'Member'}
      displayName={displayName}
      bio={bio}
      initialCollection={initialCollection}
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