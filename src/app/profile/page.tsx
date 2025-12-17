import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClientView from '@/components/ProfileClientView';
import { Database } from '@/types/database';

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

  // 2. Fetch User's Profile (server-side, if needed for display_name)
  // Although user.email is used in ClientView, a full profile fetch might be useful
  // for display_name or other profile-specific data if the UI expands.
  // For now, we'll just pass user.email.

  // 3. Fetch User's Collection (server-side)
  const { data: rawCollection, error: collectionError } = await supabase
    .from('user_collections')
    .select(`
      perfume:perfumes (
        id,
        name,
        image_url,
        brand:brands (name)
      )
    `)
    .eq('user_id', user.id);

  if (collectionError) {
    console.error('Error fetching collection:', collectionError);
    // Optionally, handle error gracefully or throw
    // For now, return empty collection on error
    return <ProfileClientView userEmail={user.email || 'Guest'} initialCollection={[]} />;
  }
  
  // Flatten and type-assert the collection for easier rendering in the client component
  // Ensure the brand is also typed correctly
  const initialCollection = (rawCollection?.map((item: { perfume: Perfumes & { brand: Brands | null } | null }) => item.perfume)
    .filter((perfume): perfume is Perfumes & { brand: Brands | null } => perfume !== null) || []) as (Perfumes & { brand: Brands | null })[];


  // Render the Client Component with pre-fetched data
  return (
    <ProfileClientView 
      userEmail={user.email || 'Member'} 
      initialCollection={initialCollection} 
    />
  );
}
