import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// --- ADD THIS LINE ---
export const dynamic = 'force-dynamic';
// ---------------------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const price = searchParams.get('price');
    const gender = searchParams.get('gender');
    const longevity = searchParams.get('longevity');
    const season = searchParams.get('season');

    const supabase = createClient();

    // Start with base query
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
        brand_id,
        brand:brands!perfumes_brand_id_fkey(name)
      `);

    // Apply filters
    if (price) {
      const priceTiers = price.split(',');
      query = query.in('price_tier', priceTiers);
    }

    if (gender) {
      const genders = gender.split(',');
      query = query.in('gender', genders);
    }

    if (longevity) {
      const longevityRanges = longevity.split(',');
      
      // Convert hour ranges to 1-5 rating ranges for database query
      const ratingConditions: string[] = [];
      
      longevityRanges.forEach(hourRange => {
        // Map hour ranges to appropriate rating ranges
        if (hourRange === '1-2 hours') {
          ratingConditions.push('longevity_rating.eq.1');
        } else if (hourRange === '3-4 hours') {
          ratingConditions.push('longevity_rating.eq.2');
        } else if (hourRange === '5-6 hours') {
          ratingConditions.push('longevity_rating.eq.3');
        } else if (hourRange === '7-8 hours') {
          ratingConditions.push('longevity_rating.eq.4');
        } else if (hourRange === '8+ hours') {
          ratingConditions.push('longevity_rating.eq.5');
        }
      });
      
      if (ratingConditions.length > 0) {
        query = query.or(ratingConditions.join(','));
      }
    }

    if (season) {
      const seasons = season.split(',');
      // Use contains filter for each season (OR condition)
      seasons.forEach(seasonItem => {
        query = query.contains('best_season', [seasonItem]);
      });
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase Query Error Details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    console.log('Query successful, returned', data?.length, 'items');
    return NextResponse.json(data);

  } catch (err) {
    console.error('Server Crash Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error - Check terminal for details' },
      { status: 500 }
    );
  }
}