import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClientView from '@/components/ProfileClientView';
import { Database } from '@/types/database';
import { analyzeWardrobe } from '@/lib/analytics';

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
        best_season
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
            recommendations={[]}
        />
    );
  }
  
  // Flatten and type-assert the collection for easier rendering in the client component
  // Ensure the brand is also typed correctly
  // We need to cast it to match the Perfume type used in analytics which expects olfactory_family etc.
  const initialCollection = (rawCollection?.map((item) => ({
    ...item.perfume, // Spread perfume data
    collection_id: item.id // Add the collection item ID
  }))
    .filter((perfume): perfume is Perfumes & { brand: Brands | null, collection_id: string } => perfume !== null) || []) as (Perfumes & { brand: Brands | null, collection_id: string })[];

  // --- NEW: ANALYTICS & RECOMMENDATIONS ---
  const insights = analyzeWardrobe(initialCollection);
  
  let recommendations: (Perfumes & { brand: Brands | null })[] = [];

  // Only fetch recommendations if we have some data preferences
  if (insights.topFamilies.length > 0) {
    const topFamilies = insights.topFamilies.slice(0, 2).map(f => f.name); // Top 2 families
    const ownedIds = initialCollection.map(p => p.id);

    // Fetch recommendations
    // Note: overlaps requires the column to be an array type in DB.
    // If olfactory_family is text[], this works.
    const { data: recs } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url,
        brand:brands (name)
      `)
      .overlaps('olfactory_family', topFamilies) // Match top families
      .not('id', 'in', `(${ownedIds.join(',')})`) // Exclude owned items
      .limit(6);
    
    // @ts-ignore - Supabase types inference can be tricky with complex filters
    recommendations = recs || [];
  }

  // Render the Client Component with pre-fetched data
  return (
    <ProfileClientView 
      userEmail={user.email || 'Member'}
      displayName={displayName}
      bio={bio}
      initialCollection={initialCollection}
      insights={insights}
      recommendations={recommendations}
    />
  );
}