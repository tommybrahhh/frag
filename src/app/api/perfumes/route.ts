import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// --- ADD THIS LINE ---
export const dynamic = 'force-dynamic';
// ---------------------

export async function GET() {
  try {
    const supabase = createClient();

    // Query the database
    const { data, error } = await supabase
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
        brand_id,
        brand:brands!perfumes_brand_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Query Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error('Server Crash Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error - Check terminal for details' },
      { status: 500 }
    );
  }
}