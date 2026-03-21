import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  props: { params: Promise<{ brand: string }> }
) {
  const params = await props.params;
  const brandName = decodeURIComponent(params.brand);
  const supabase = await createClient();

  try {
    // 1. Find the Brand ID first (Exact or Case-insensitive match)
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('id, name')
      .ilike('name', brandName)
      .limit(1)
      .maybeSingle() as any;

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
        brand:brands(name),
        perfumer
      `)
      .eq('brand_id', brandData.id)
      .order('name') as any;

    if (perfumeError) {
      console.error('Perfume Fetch Error:', perfumeError);
      throw perfumeError;
    }

    return NextResponse.json({
      brand: brandData.name, // Return the canonical name from DB
      perfumes: perfumes || []
    });

  } catch (error: any) {
    console.error('Brand API Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
