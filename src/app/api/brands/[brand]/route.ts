import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  props: { params: Promise<{ brand: string }> }
) {
  const params = await props.params;
  const brandName = decodeURIComponent(params.brand);
  const supabase = createClient();

  try {
    // 1. Find the Brand ID first (Exact or Case-insensitive match)
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('id, name')
      .ilike('name', brandName)
      .maybeSingle();

    if (brandError) throw brandError;
    
    if (!brandData) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // 2. Fetch Perfumes for this Brand ID
    const { data: perfumes, error: perfumeError } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url,
        rating, price_tier, best_season, vibe_tags,
        brand:brands!perfumes_brand_id_fkey(name),
        perfumer
      `)
      .eq('brand_id', brandData.id)
      .order('name');

    if (perfumeError) throw perfumeError;

    return NextResponse.json({
      brand: brandData.name, // Return the canonical name from DB
      perfumes: perfumes || []
    });

  } catch (error: any) {
    console.error('Brand API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}