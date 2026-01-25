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
  query: string, 
  signal?: AbortSignal
): Promise<SearchResult[]> {
  
  if (!query || query.length < 2) return [];

  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
  
  if (!res.ok) {
    throw new Error(`Search failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data;
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
