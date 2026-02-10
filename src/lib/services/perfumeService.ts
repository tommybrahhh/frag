import { createClient } from '@/utils/supabase/server';
import { longevityMappings } from '@/lib/longevity-utils';

export interface PerfumeFilterParams {
  page?: number;
  limit?: number;
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
  sort?: string | null;
}

export async function getPerfumes(params: PerfumeFilterParams) {
  const {
    page = 1,
    limit = 20,
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
    sort,
  } = params;

  const offset = (page - 1) * limit;
  const supabase = await createClient();

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
      brand:brands!perfumes_brand_id_fkey${tier ? '!inner' : ''}(name, tier) 
    `, { count: 'exact' });

  // Apply Filters
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
    query = query.in('brand.tier', tier.split(','));
  }

  if (moment) {
    query = query.in('best_time', moment.split(','));
  }

  if (occasion) {
    query = query.overlaps('occasions', occasion.split(','));
  }

  if (year) {
    query = query.eq('release_year', year);
  }

  if (family) {
    query = query.overlaps('olfactory_family', family.split(','));
  }

  if (vibe) {
    query = query.overlaps('vibe_tags', vibe.split(','));
  }

  if (sort === 'newest') {
    query = query.order('release_year', { ascending: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  return { data, error, count };
}
