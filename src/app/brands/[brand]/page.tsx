import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import BrandPageClient from '@/components/features/search/BrandPageClient';

async function getBrandData(slug: string) {
  const brandName = decodeURIComponent(slug);
  const supabase = await createClient();

  // 1. Find the Brand ID first
  const { data: brandData, error: brandError } = await supabase
    .from('brands')
    .select('id, name, tier, website_url, brand_color')
    .ilike('name', brandName)
    .limit(1)
    .maybeSingle() as any;

  if (brandError || !brandData) {
    return null;
  }

  // 2. Fetch Initial Perfumes (Server Side)
  const { data: perfumes, error: perfumeError } = await supabase
    .from('perfumes')
    .select(`
      id, name, slug, image_url,
      rating, price_tier, best_season, vibe_tags,
      brand:brands(name),
      perfumer,
      scent_profile
    `)
    .eq('brand_id', brandData.id)
    .order('name')
    .range(0, 19) as any;

  if (perfumeError) {
    console.error('Perfume Fetch Error:', perfumeError);
    return null;
  }

  return {
    brand: brandData.name,
    tier: brandData.tier,
    website_url: brandData.website_url,
    brand_color: brandData.brand_color,
    perfumes: (perfumes as any[]) || []
  };
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand } = await params;
  const data = await getBrandData(brand);

  if (!data) {
    return {
      title: 'Brand Not Found | Scentia'
    };
  }

  return {
    title: `${data.brand} Perfumes & Reviews | Scentia`,
    description: `Explore fragrances from ${data.brand}. Discover scent profiles, ratings, and reviews.`
  };
}

export default async function BrandPage(props: { params: Promise<{ brand: string }> }) {
  const params = await props.params;
  const data = await getBrandData(params.brand);

  if (!data) {
    notFound();
  }

  return (
    <BrandPageClient 
      brand={data.brand}
      initialPerfumes={data.perfumes}
      tier={data.tier}
      website_url={data.website_url}
      brand_color={data.brand_color}
    />
  );
}
