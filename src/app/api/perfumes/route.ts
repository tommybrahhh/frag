import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Get ALL filters
    const price = searchParams.get('price');
    const gender = searchParams.get('gender');
    const longevity = searchParams.get('longevity');
    const season = searchParams.get('season');
    
    // New Filters
    const concentration = searchParams.get('concentration');
    const tier = searchParams.get('tier');
    const moment = searchParams.get('moment');   // Maps to 'best_time'
    const occasion = searchParams.get('occasion');

    const supabase = createClient();

    // 2. Base Query - Added new columns to SELECT
    // IMPORTANT: We join 'brands' and filter by its 'tier' column
    let query = supabase
      .from('perfumes')
      .select(`
        id,
        name,
        image_url,
        rating,
        vibe_tags,
        price_tier,
        best_season,
        longevity_rating,
        gender,
        concentration,  
        best_time,      
        occasions,      
        brand_id,
        brand:brands!perfumes_brand_id_fkey(name, tier) 
      `);

    // 3. Apply Filters

    // --- Existing Filters ---
    if (price) query = query.in('price_tier', price.split(','));
    if (gender) query = query.in('gender', gender.split(','));
    
    if (longevity) {
      const ranges = longevity.split(',');
      const conditions: string[] = [];
      ranges.forEach(r => {
        if (r === '1-2 hours') conditions.push('longevity_rating.eq.1');
        if (r === '3-4 hours') conditions.push('longevity_rating.eq.2');
        if (r === '5-6 hours') conditions.push('longevity_rating.eq.3');
        if (r === '7-8 hours') conditions.push('longevity_rating.eq.4');
        if (r === '8+ hours') conditions.push('longevity_rating.eq.5');
      });
      if (conditions.length > 0) query = query.or(conditions.join(','));
    }

    if (season) {
      // 'best_season' is an array, so we use overlaps logic or contains
      // If passing multiple seasons, we usually want perfumes that match ANY of them
      // PostgreSQL array overlap operator is useful here, but simple .contains loop works for strict matching
      // For broad matching (OR logic), Supabase uses .overlaps
      query = query.overlaps('best_season', season.split(','));
    }

    // --- New Filters ---

    // Concentration (Exact match)
    if (concentration) {
      query = query.in('concentration', concentration.split(','));
    }

    // Market Tier (Filter on the joined table 'brands')
    if (tier) {
      // This syntax filters the parent 'perfumes' based on the child 'brand'
      // Note: This requires !inner join in the select if strictly filtering, 
      // but Supabase syntax usually handles 'brand.tier' in a separate filter block nicely
      // or we use the !inner join syntax in select: brand:brands!inner(...)
      // Let's try the direct filter first:
      query = query.in('brand.tier', tier.split(','));
    }

    // Moment (Time of Day)
    if (moment) {
      query = query.in('best_time', moment.split(','));
    }

    // Occasion (Array contains)
    if (occasion) {
      // If user selects 'Date', find perfumes where occasions array includes 'Date'
      query = query.overlaps('occasions', occasion.split(','));
    }

    // 4. Sort and Execute
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Query Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}