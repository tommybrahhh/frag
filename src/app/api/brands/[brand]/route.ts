import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  props: { params: Promise<{ brand: string }> }
) {
  // Await the params object (Next.js 15 requirement)
  const params = await props.params;
  
  // Decode the URL (e.g. "Chanel%20Paris" -> "Chanel Paris")
  const brandName = decodeURIComponent(params.brand);

  const supabase = createClient();

  try {
    // Fetch perfumes by brand name
    const { data: perfumes, error: perfumeError } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url, brand:brands!perfumes_brand_id_fkey(name),
        perfumer, rating, vibe_tags, best_season, price_tier
      `)
      .ilike('brands.name', brandName) // Case-insensitive match
      .order('name');

    if (perfumeError) throw perfumeError;

    return NextResponse.json({
      brand: brandName,
      perfumes: perfumes || []
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}