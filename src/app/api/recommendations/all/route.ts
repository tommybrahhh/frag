import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Starting recommendations API call');
    const supabase = createClient();
    const { data: { session }, error: authError } = await createClient().auth.getSession();
    console.log('Session data:', session?.user?.id);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's fragrance preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('interests, favorite_notes, avoided_notes')
      .eq('user_id', session.user.id)
      .single();

    // Build recommendation query using existing API pattern
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
        brand:brands!perfumes_brand_id_fkey(name, tier)
      `, { count: 'exact' });

    // Apply interest-based filters using Supabase query methods
    if (preferences?.interests?.length) {
      query = query
        .or(`vibe_tags.cs.{${preferences.interests.join(',')}}`)
        .or(`best_season.ov.{${preferences.interests.join(',')}}`);
    }

    if (preferences?.favorite_notes?.length) {
      query = query.filter('vibe_tags', 'cs', preferences.favorite_notes);
    }

    if (preferences?.avoided_notes?.length) {
      query = query.not('vibe_tags', 'cs', preferences.avoided_notes);
    }
console.log('Constructed query filters:', {
  interests: preferences?.interests,
  favorite_notes: preferences?.favorite_notes,
  avoided_notes: preferences?.avoided_notes
});

const { data, error, count } = await query
  .order('rating', { ascending: false })
  .limit(100);

console.log('Query results count:', count);
console.log('First result:', data?.[0]);

    if (error) {
      console.error('Recommendation query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      recommendations: data,
      total: count,
      interests: preferences?.interests || []
    });

  } catch (err) {
    console.error('Recommendation API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}