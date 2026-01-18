import { SupabaseClient } from '@supabase/supabase-js';

export interface SearchResult {
  id: string;
  name: string;
  image_url: string | null;
  brand: { name: string } | null;
}

/**
 * Robust search function that handles the database query details.
 * Currently optimized for Name search to prevent locking, but easily extensible.
 */
export async function searchPerfumesService(
  client: SupabaseClient, 
  query: string, 
  signal?: AbortSignal
): Promise<SearchResult[]> {
  
  if (!query || query.length < 2) return [];

  // 1. Sanitize query
  const cleanQuery = query.trim();

  // 2. Perform Query
  // We strictly select only what's needed for the UI to be lightweight.
  const { data, error } = await client
    .from('perfumes')
    .select('id, name, image_url, brand:brands(name)')
    .ilike('name', `%${cleanQuery}%`)
    .limit(10)
    .abortSignal(signal || new AbortController().signal);

  if (error) {
    // We allow AbortError to bubble up so the hook can handle it, 
    // but we log real DB errors.
    if (!error.message.includes('AbortError')) {
      console.error('Search Service Error:', error);
    }
    throw error;
  }

  return (data as any[]) || [];
}

/**
 * Fallback/Initial suggestions loader
 */
export async function getPopularPerfumesService(client: SupabaseClient): Promise<SearchResult[]> {
  const { data } = await client
    .from('perfumes')
    .select('id, name, image_url, brand:brands(name)')
    .order('rating', { ascending: false }) // or order by popularity if you have a view
    .limit(5);
  
  return (data as any[]) || [];
}
