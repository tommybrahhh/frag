import { createClient } from '@/utils/supabase/server';
import { longevityMappings } from '@/lib/longevity-utils';

export interface PerfumeFilterParams {
  page?: number;
  limit?: number;
  q?: string | null;
  price?: string | null;
  gender?: string | null;
  longevity?: string | null;
  season?: string | null;
  concentration?: string | null;
  tier?: string | null;
  moment?: string | null;
  occasion?: string | null;
  year?: string | null;
  family?: string | null;
  vibe?: string | null;
  brand?: string | null;
  sort?: string | null;
  noteIds?: string[] | null;
}

export async function getPerfumes(params: PerfumeFilterParams) {
  const {
    page = 1,
    limit = 20,
    q,
    price,
    gender,
    longevity,
    season,
    concentration,
    tier,
    moment,
    occasion,
    year,
    family,
    vibe,
    brand,
    sort,
    noteIds,
  } = params;

  const offset = (page - 1) * limit;
  const supabase = await createClient();

  // If we have a search query, we want to include brand matches.
  // To avoid complex PostgREST OR filters on joined tables, we fetch brand IDs first.
  let brandIdsFromQuery: string[] = [];
  if (q) {
    const { data: brandMatches } = await supabase
      .from('brands')
      .select('id')
      .ilike('name', `%${q}%`);
    
    if (brandMatches && brandMatches.length > 0) {
      brandIdsFromQuery = brandMatches.map(b => b.id);
    }
  }

  let query = supabase
    .from('perfumes')
    .select(`
      id,
      name,
      slug,
      image_url,
      rating,
      vibe_tags,
      scent_profile,
      price_tier,
      best_season,
      longevity_rating,
      gender,
      concentration,  
      best_time,      
      occasions,
      olfactory_family,
      release_year,
      brand_id,
      brand:brands!perfumes_brand_id_fkey${(tier || brand) ? '!inner' : ''}(name, tier) 
    `, { count: 'exact' });

  // Apply Filters
  if (q) {
    if (brandIdsFromQuery.length > 0) {
      // Use parenthesized OR for clarity: (name matches OR brand_id matches)
      query = query.or(`name.ilike.%${q}%, brand_id.in.(${brandIdsFromQuery.map(id => `"${id}"`).join(',')})`);
    } else {
      query = query.ilike('name', `%${q}%`);
    }
  }

  if (brand) {
    // For brand name filtering, we can use the relationship filtering
    // or if we want to be safe, filter by brand names via brands table
    query = query.in('brands.name', brand.split(','));
  }
  if (price) query = query.in('price_tier', price.split(','));
  if (gender) query = query.in('gender', gender.split(','));
  
  if (longevity) {
    const selectedRanges = longevity.split(',');
    const conditions: string[] = [];

    selectedRanges.forEach(r => {
      const ratingsForRange = longevityMappings
        .filter(mapping => mapping.hourRange === r)
        .map(mapping => mapping.rating);
      
      if (ratingsForRange.length > 0) {
        conditions.push(`longevity_rating.in.(${ratingsForRange.join(',')})`);
      }
    });
    
    if (conditions.length > 0) {
      query = query.or(conditions.join(','));
    }
  }

  if (season) {
    query = query.overlaps('best_season', season.split(','));
  }

  if (concentration) {
    query = query.in('concentration', concentration.split(','));
  }

  if (tier) {
    query = query.in('brands.tier', tier.split(','));
  }

  if (moment) {
    query = query.in('best_time', moment.split(','));
  }

  if (occasion) {
    query = query.overlaps('occasions', occasion.split(','));
  }

  if (year) {
    query = query.in('release_year', year.split(','));
  }

  if (family) {
    query = query.overlaps('olfactory_family', family.split(','));
  }

  if (vibe) {
    query = query.overlaps('vibe_tags', vibe.split(','));
  }

  // Handle Note IDs - This is complex for standard PostgREST
  // If noteIds are provided, we filter the query to only include perfumes that have ALL these notes
  if (noteIds && noteIds.length > 0) {
    // We use a subquery/RPC approach or fetch IDs first
    // For simplicity in PostgREST, we can use the 'in' filter with a list of IDs matching the notes
    // However, it's better to use the RPC logic if possible.
    // For now, let's use a simpler approach: fetch perfume IDs that match all notes
    
    const { data: perfumeIdsData } = await supabase
      .from('perfume_notes')
      .select('perfume_id')
      .in('note_id', noteIds);
    
    if (perfumeIdsData) {
      // Find perfume_ids that appear noteIds.length times
      const counts: Record<string, number> = {};
      perfumeIdsData.forEach((row: any) => {
        counts[row.perfume_id] = (counts[row.perfume_id] || 0) + 1;
      });
      
      const validIds = Object.entries(counts)
        .filter(([_, count]) => count === noteIds.length)
        .map(([id]) => id);
      
      if (validIds.length > 0) {
        query = query.in('id', validIds);
      } else {
        // Force no results if notes specified but no perfume matches
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }
  }

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false }).order('release_year', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  return { data, error, count };
}
