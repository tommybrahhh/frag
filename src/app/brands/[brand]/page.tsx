import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import PageTransition from '@/components/layout/PageTransition'; // Added PageTransition
import FragranceCard from '@/components/features/perfume/FragranceCard'; // Added FragranceCard
import { Perfume } from '@/types';

async function getBrandData(slug: string) {
  const brandName = decodeURIComponent(slug);
  const supabase = await createClient();

  // 1. Find the Brand ID first (Exact or Case-insensitive match)
  const { data: brandData, error: brandError } = await supabase
    .from('brands')
    .select('id, name')
    .ilike('name', brandName)
    .limit(1)
    .maybeSingle();

  if (brandError || !brandData) {
    return null;
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
    .order('name');

  if (perfumeError) {
    console.error('Perfume Fetch Error:', perfumeError);
    return null;
  }

  return {
    brand: brandData.name,
    perfumes: (perfumes as any[]) || []
  };
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand } = await params;
  const data = await getBrandData(brand);

  if (!data) {
    return {
      title: 'Brand Not Found | Scentia',
      description: 'The requested perfume brand could not be found.'
    };
  }

  return {
    title: `${data.brand} Perfumes & Reviews | Scentia`,
    description: `Explore fragrances from ${data.brand}. Discover scent profiles, ratings, and reviews for top ${data.brand} perfumes.`
  };
}

export default async function BrandPage(props: { params: Promise<{ brand: string }> }) {
  const params = await props.params;
  const data = await getBrandData(params.brand);

  if (!data) {
    notFound();
  }

  const { brand, perfumes } = data;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FDFBF7] text-gray-800 pb-20 font-sans">
        {/* Nav */}
        <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-16 z-20">
          <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
          <span className="font-serif text-xl italic">Brand Library</span>
          <div className="w-8"></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-12">
          
          {/* HERO: Brand Details */}
          <div className="bg-white rounded-3xl p-10 border border-stone-100 shadow-sm mb-16 text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div 
                className="w-16 h-16 rounded-full shadow-inner border-4 border-stone-50 bg-stone-200 flex items-center justify-center"
              >
                <span className="text-stone-600 text-2xl font-serif font-medium">
                  {brand.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <h1 className="font-serif text-5xl text-stone-900 mb-6">
              {brand}
            </h1>
            <p className="text-lg text-stone-600 font-serif leading-relaxed italic">
              Perfume House & Brand
            </p>
          </div>

          {/* PERFUME GRID */}
          <div className="border-t border-stone-200 pt-10">
            <h3 className="font-serif text-2xl text-stone-900 mb-8">{perfumes.length} Fragrances</h3>
            
            {perfumes.length === 0 ? (
              <div className="text-stone-400 italic">No perfumes found from this brand yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {perfumes.map((p) => (
                  <FragranceCard
                    key={p.id}
                    perfume={{
                      ...p,
                      brand: (p.brand as { name: string }).name,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </PageTransition>
  );
}