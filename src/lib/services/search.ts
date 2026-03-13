import { SupabaseClient } from '@supabase/supabase-js';

export interface SearchResult {
  id: string;
  name: string;
  image_url: string | null;
  brand: { name: string } | null;
}

/**
 * Robust search function that handles the database query details.
 * DIRECT DATABASE CONNECTION (Fastest)
 */
export async function searchPerfumesService(
  client: SupabaseClient,
  query: string, 
  signal?: AbortSignal
): Promise<SearchResult[]> {
  
  if (!query || query.length < 2) return [];

  const { data, error } = await (client
    .rpc('search_perfumes', { keyword: query })
    .abortSignal(signal as any) as any); // Type cast if necessary for older definitions

  if (error) {
    if (signal?.aborted) return [];
    console.error("RPC Search Error:", error);
    throw new Error(error.message);
  }

  // Transform result if necessary (rpc returns flat structure, UI expects nested brand object)
  // The RPC returns: id, name, slug, image_url, brand_name, similarity_score
  return (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    image_url: item.image_url,
    brand: { name: item.brand_name }
  }));
}

/**
 * Fallback/Initial suggestions loader
 */
export async function getPopularPerfumesService(client: SupabaseClient): Promise<SearchResult[]> {
  const { data } = await client
    .from('perfumes')
    .select('id, name, image_url, brand:brands(name)')
    .order('rating', { ascending: false }) 
    .order('id', { ascending: true })
    .limit(5);
  
  return (data as any[]) || [];
}