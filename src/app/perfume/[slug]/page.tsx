import { createClient } from '@/utils/supabase/server';
import PerfumeClientView from '@/components/features/perfume/PerfumeClientView';
import { notFound } from 'next/navigation';
import { RecommendationEngine } from '@/lib/recommendation-engine';
import { Metadata } from 'next';
import { generateProfileFromVibes, getPerfumeImage } from '@/lib/perfume-utils';
import { FragranceService, Perfume } from '@/services/fragranceService';

// --- SEO: Dynamic Metadata Generator ---
export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  const supabase = await createClient();
  const fragranceService = new FragranceService(supabase);

  const perfume = await fragranceService.getFragranceBySlugOrId(slug);

  if (!perfume) {
    return { title: 'Perfume Not Found | Scentia' };
  }

  // @ts-ignore
  const brandName = perfume.brand?.name || 'Unknown Brand';
  const vibes = perfume.vibe_tags?.slice(0, 3).join(', ') || 'Fragrance';
  
  // Use absolute URL for metadata images
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://scentia.fit';
  const imageUrl = perfume.image_url ? getPerfumeImage(perfume.image_url) : '';
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;

  return {
    title: `${perfume.name} by ${brandName} - Reviews & Matches`,
    description: `Discover ${perfume.name} by ${brandName}. A ${vibes} scent rated ${perfume.rating || 'N/A'}/5. See notes, longevity, and layering combinations.`,
    alternates: {
      canonical: `/perfume/${slug}`,
    },
    openGraph: {
      title: `${perfume.name} by ${brandName}`,
      description: `Read reviews and find matches for ${perfume.name}.`,
      images: fullImageUrl ? [fullImageUrl] : [],
      url: `/perfume/${slug}`,
    },
  };
}

// --- Main Page Component ---
export const revalidate = 3600; // Revalidate every hour

export default async function PerfumePage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  const supabase = await createClient();
  const fragranceService = new FragranceService(supabase);

  // 1. Fetch Main Perfume using Service
  const mainPerfume = await fragranceService.getFragranceBySlugOrId(slug);

  if (!mainPerfume) {
    notFound(); 
  }

  // Cast and format profile
  const perfumeData: Perfume = {
    ...mainPerfume,
    scent_profile: mainPerfume.scent_profile || generateProfileFromVibes(mainPerfume.vibe_tags || [])
  };

  // 2. Fetch Recommendations
  // OPTIMIZATION: Pass the current perfume to pre-filter candidates in DB (Family/Vibe overlap)
  const allPerfumes = await RecommendationEngine.getAllPerfumes(supabase, 1000, perfumeData as any);
  
  // FIX: Cast arguments to 'any' to bypass strict Type mismatch between local 'Perfume' type and Engine's expected type
  const recommendationCategories = RecommendationEngine.getEnhancedRecommendations(
    perfumeData as any, 
    (allPerfumes || []) as any
  );

  // --- SEO: JSON-LD Structure ---
  const priceMap: Record<string, string> = { '$': '50.00', '$$': '100.00', '$$$': '200.00', '$$$$': '350.00' };
  const estimatedPrice = perfumeData.price_tier ? priceMap[perfumeData.price_tier] || '120.00' : '100.00';
  
  // Safe brand name access
  const brandName = typeof perfumeData.brand === 'object' && perfumeData.brand !== null && 'name' in perfumeData.brand 
    ? (perfumeData.brand as { name: string }).name 
    : String(perfumeData.brand || 'Unknown');

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://scentia.fit';
  const imageUrl = perfumeData.image_url ? getPerfumeImage(perfumeData.image_url) : '';
  const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`) : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: perfumeData.name,
    image: fullImageUrl ? [fullImageUrl] : [],
    description: `Discover ${perfumeData.name} by ${brandName}. Profile: ${perfumeData.vibe_tags?.slice(0,3).join(', ')}.`,
    url: `https://scentia.fit/perfume/${slug}`,
    brand: {
      '@type': 'Brand',
      name: brandName
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: estimatedPrice,
      availability: 'https://schema.org/InStock'
    }
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://scentia.fit'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Perfumes',
        item: 'https://scentia.fit/search'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: perfumeData.name,
        item: `https://scentia.fit/perfume/${slug}`
      }
    ]
  };

  // 3. Render
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <PerfumeClientView 
        perfume={perfumeData as any} 
        recommendationCategories={recommendationCategories}
      />
    </>
  );
}