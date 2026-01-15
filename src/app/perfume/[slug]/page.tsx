import { createClient } from '@/utils/supabase/server';
import PerfumeClientView from '@/components/features/perfume/PerfumeClientView';
import { Database } from '@/types/database';
import { notFound } from 'next/navigation';
import { RecommendationEngine } from '@/lib/recommendation-engine';
import { Metadata } from 'next';
import { generateProfileFromVibes } from '@/lib/perfume-utils';

// --- Types ---

type Note = {
  name: string;
  color_hex?: string;
  description?: string;
  url?: string;
};

type PerfumeNote = {
  type: string;
  note: Note;
};

type Brand = {
  name: string;
};

type Perfume = Database['public']['Tables']['perfumes']['Row'] & {
  slug?: string;
  brand?: Brand;
  perfume_notes?: PerfumeNote[];
  scent_profile?: Record<string, number>;
  perfumer?: string;
  scenario?: string;
  olfactory_family?: string[];
  longevity_rating?: number;
  sillage_rating?: number;
  sharedNotes?: string[];
  matchScore?: number;
  matchReason?: string;
};

// --- Helper Functions (Server-Side) ---



// --- SEO: Dynamic Metadata Generator ---
export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  const supabase = await createClient();

  const { data: perfume } = await supabase
    .from('perfumes')
    .select(`
      name, 
      image_url, 
      vibe_tags, 
      rating,
      brand:brands(name)
    `)
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  if (!perfume) {
    return { title: 'Perfume Not Found | Scentia' };
  }

  // @ts-ignore
  const brandName = perfume.brand?.name || 'Unknown Brand';
  const vibes = perfume.vibe_tags?.slice(0, 3).join(', ') || 'Fragrance';
  
  return {
    title: `${perfume.name} by ${brandName} - Reviews & Matches`,
    description: `Discover ${perfume.name} by ${brandName}. A ${vibes} scent rated ${perfume.rating || 'N/A'}/5. See notes, longevity, and layering combinations.`,
    openGraph: {
      title: `${perfume.name} by ${brandName}`,
      description: `Read reviews and find matches for ${perfume.name}.`,
      images: perfume.image_url ? [perfume.image_url] : [],
    },
  };
}

// --- Main Page Component ---

export default async function PerfumePage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  const supabase = await createClient();

  // 1. Fetch Main Perfume
  let mainPerfume = null;
  
  // Try finding by slug first
  const { data: slugMatches } = await supabase
    .from('perfumes')
    .select(`
      id, name, slug, image_url, rating, vibe_tags,
      perfumer, price_tier, best_season, gender,
      longevity_rating, sillage_rating,
      scenario, scent_profile,
      olfactory_family,
      release_year,
      brand:brands(name, tier),
      perfume_notes(type, note:notes(name, color_hex, description, url))
    `)
    .eq('slug', slug)
    .limit(1);

  if (slugMatches && slugMatches.length > 0) {
    mainPerfume = slugMatches[0];
  }

  // Fallback to ID if not found by slug
  if (!mainPerfume) {
    const { data: fallbackPerfume } = await supabase
      .from('perfumes')
      .select(`
        id, name, slug, image_url, rating, vibe_tags,
        perfumer, price_tier, best_season, gender,
        longevity_rating, sillage_rating,
        scenario, scent_profile,
        olfactory_family,
        release_year,
        brand:brands(name, tier),
        perfume_notes(type, note:notes(name, color_hex, description, url))
      `)
      .eq('id', slug)
      .maybeSingle();
    
    if (fallbackPerfume) mainPerfume = fallbackPerfume;
  }

  if (!mainPerfume) {
    notFound(); 
  }

  // Cast and format profile
  const perfumeData: Perfume = {
    ...mainPerfume,
    scent_profile: mainPerfume.scent_profile || generateProfileFromVibes(mainPerfume.vibe_tags || [])
  } as unknown as Perfume;

  // 2. Fetch Recommendations
  const allPerfumes = await RecommendationEngine.getAllPerfumes(supabase);
  // FIX: Cast arguments to 'any' to bypass strict Type mismatch between local 'Perfume' type and Engine's expected type
  const recommendationCategories = RecommendationEngine.getEnhancedRecommendations(
    perfumeData as any, 
    (allPerfumes || []) as any
  );

  // --- SEO: JSON-LD Structure ---
  const priceMap: Record<string, string> = { '$': '50.00', '$$': '100.00', '$$$': '200.00', '$$$$': '350.00' };
  const estimatedPrice = perfumeData.price_tier ? priceMap[perfumeData.price_tier] || '120.00' : '100.00';
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: perfumeData.name,
    image: perfumeData.image_url ? [perfumeData.image_url] : [],
    description: `Discover ${perfumeData.name} by ${perfumeData.brand?.name}. Profile: ${perfumeData.vibe_tags?.slice(0,3).join(', ')}.`,
    brand: {
      '@type': 'Brand',
      name: perfumeData.brand?.name || 'Unknown'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: perfumeData.rating || 4.5,
      reviewCount: 24, // Static fallback since we aren't fetching count yet
      bestRating: "5",
      worstRating: "1"
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: estimatedPrice,
      availability: 'https://schema.org/InStock'
    }
  };

  // 3. Render
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PerfumeClientView 
        perfume={perfumeData} 
        recommendationCategories={recommendationCategories}
      />
    </>
  );
}