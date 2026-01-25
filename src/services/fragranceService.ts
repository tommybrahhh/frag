import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export type Perfume = Database['public']['Tables']['perfumes']['Row'] & {
  slug?: string;
  brand?: { name: string; tier?: string } | string;
  perfume_notes?: any[];
  scent_profile?: Record<string, number>;
  perfumer?: string;
  scenario?: string;
  olfactory_family?: string[];
  longevity_rating?: number;
  sillage_rating?: number;
  release_year?: number;
  best_season?: string[];
  gender?: string;
};

export class FragranceService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetches a single fragrance by its slug or ID.
   * Includes related brand and note data.
   */
  async getFragranceBySlugOrId(slugOrId: string): Promise<Perfume | null> {
    // Try finding by slug first
    const { data: slugMatches } = await this.supabase
      .from('perfumes')
      .select(`
        id, name, slug, image_url, rating, vibe_tags,
        perfumer, price_tier, best_season, gender,
        longevity_rating, sillage_rating,
        scenario, scent_profile,
        olfactory_family,
        release_year,
        brand:brands(name, tier),
        perfume_notes(type, note:notes(name, color_hex, description, url))
      `)
      .eq('slug', slugOrId)
      .limit(1);

    if (slugMatches && slugMatches.length > 0) {
      return slugMatches[0] as unknown as Perfume;
    }

    // Fallback to ID if not found by slug
    const { data: fallbackPerfume } = await this.supabase
      .from('perfumes')
      .select(`
        id, name, slug, image_url, rating, vibe_tags,
        perfumer, price_tier, best_season, gender,
        longevity_rating, sillage_rating,
        scenario, scent_profile,
        olfactory_family,
        release_year,
        brand:brands(name, tier),
        perfume_notes(type, note:notes(name, color_hex, description, url))
      `)
      .eq('id', slugOrId)
      .maybeSingle();

    return (fallbackPerfume as unknown as Perfume) || null;
  }

  /**
   * Searches for fragrances containing *all* the specified notes.
   * Paginated.
   */
  async getFragrancesByNotes(noteIds: string[], page: number = 1, limit: number = 12) {
    if (!noteIds || noteIds.length === 0) {
      return { data: [], count: 0 };
    }

    // 1. Get Perfumes containing these notes
    // We need to find perfume_ids that have ALL note_ids
    // Optimized approach: Get all pairs, then filter in memory or via SQL count
    
    // Fetch all perfume-note associations for the requested notes
    const { data: perfumeNotes, error: perfumeNotesError } = await this.supabase
      .from('perfume_notes')
      .select('perfume_id, note_id')
      .in('note_id', noteIds);

    if (perfumeNotesError) {
      throw new Error(perfumeNotesError.message);
    }

    // Group by perfume_id
    const perfumeIdToNotes = (perfumeNotes || []).reduce((acc, { perfume_id, note_id }) => {
      if (perfume_id) {
        if (!acc[perfume_id]) {
          acc[perfume_id] = new Set();
        }
        acc[perfume_id].add(note_id);
      }
      return acc;
    }, {} as Record<string, Set<string>>);

    // Filter for exact match of all notes (intersection)
    const matchingPerfumeIds = Object.entries(perfumeIdToNotes)
      .filter(([_, notes]) => notes.size === noteIds.length)
      .map(([perfume_id]) => perfume_id);
    
    const count = matchingPerfumeIds.length;

    // 2. Pagination
    const from = (page - 1) * limit;
    const pagedIds = matchingPerfumeIds.slice(from, from + limit);

    if (pagedIds.length === 0) {
       return { data: [], count };
    }

    // 3. Fetch details for the page
    const { data, error } = await this.supabase
      .from('perfumes')
      .select(`
        id, 
        name,
        slug,
        image_url,
        brand:brands(name)
      `)
      .in('id', pagedIds);

    if (error) {
      throw new Error(error.message);
    }

    // Transform brand to string if needed, or keep consistent
    const formattedData = data.map((p: any) => ({
      ...p,
      brand: p.brand?.name || 'Unknown Brand'
    }));

    return { data: formattedData, count };
  }

  /**
   * General keyword search using RPC or text search.
   */
  async searchFragrances(query: string, limit: number = 6) {
    if (!query || query.length < 2) return [];

    const { data, error } = await this.supabase
      .rpc('search_perfumes', { keyword: query })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    // Map RPC result to standard shape
    return data.map((item: any) => ({
      ...item,
      brand: { name: item.brand_name } 
    }));
  }

  /**
   * Get all fragrances (limited or paginated default)
   */
  async getAllFragrances(limit: number = 50) {
    const { data, error } = await this.supabase
      .from('perfumes')
      .select('*')
      .limit(limit);
      
    if (error) throw new Error(error.message);
    return data;
  }
}
