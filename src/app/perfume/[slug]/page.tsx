import { createClient } from '@/utils/supabase/server';
import PerfumeClientView from '@/components/features/perfume/PerfumeClientView';
import { Database } from '@/types/database';
import { notFound } from 'next/navigation';
import { RecommendationEngine } from '@/lib/recommendation-engine';

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
  matchScore?: number; // Added matchScore
  matchReason?: string; // Added matchReason
};

// --- Helper Functions (Server-Side) ---

const SCENT_FAMILIES: Record<string, string[]> = {
  citrus: ['lemon', 'bergamot', 'orange', 'grapefruit', 'mandarin', 'lime', 'yuzu'],
  floral: ['rose', 'jasmine', 'lily', 'orchid', 'peony', 'lavender', 'tuberose'],
  woody: ['sandalwood', 'cedar', 'oak', 'patchouli', 'vetiver', 'oud', 'guaiac', 'pine'],
  spicy: ['pepper', 'cinnamon', 'clove', 'nutmeg', 'cardamom', 'ginger', 'saffron'],
  gourmand: ['vanilla', 'chocolate', 'caramel', 'coffee', 'honey', 'tonka', 'praline'],
  fresh: ['mint', 'green', 'aquatic', 'ozonic', 'marine', 'herbal', 'tea', 'sage'],
  oriental: ['amber', 'resin', 'incense', 'myrrh', 'labdanum', 'benzoin'],
  leather: ['leather', 'suede', 'tobacco', 'smoke', 'birch']
};

const categorizeScentFamily = (notes: string[], vibes: string[]): string | null => {
  if (notes.includes('oud') || vibes.includes('oriental')) return 'oriental';
  if (notes.includes('rose') || notes.includes('jasmine') || vibes.includes('floral')) return 'floral';
  if (notes.some(n => ['citrus', 'bergamot', 'lemon'].includes(n)) || vibes.includes('fresh')) return 'fresh';
  if (notes.some(n => ['vanilla', 'amber'].includes(n)) || vibes.includes('gourmand')) return 'gourmand';
  if (notes.some(n => ['cedar', 'sandalwood', 'oakmoss'].includes(n)) || vibes.includes('woody')) return 'woody';
  return null;
};

const generateProfileFromVibes = (vibes: string[]) => {
  const profile = { fresh: 3, sweet: 3, spicy: 3, woody: 3, floral: 3 };
  if (!vibes || vibes.length === 0) return profile;

  const lowerVibes = vibes.map(v => v.toLowerCase());

  if (lowerVibes.some(v => v.includes('citrus') || v.includes('fresh') || v.includes('aquatic') || v.includes('blue'))) profile.fresh += 6;
  if (lowerVibes.some(v => v.includes('gourmand') || v.includes('vanilla') || v.includes('sweet') || v.includes('fruity'))) profile.sweet += 6;
  if (lowerVibes.some(v => v.includes('spicy') || v.includes('warm') || v.includes('oriental') || v.includes('amber'))) profile.spicy += 6;
  if (lowerVibes.some(v => v.includes('woody') || v.includes('earthy') || v.includes('mossy') || v.includes('leather'))) profile.woody += 6;
  if (lowerVibes.some(v => v.includes('floral') || v.includes('rose') || v.includes('white flower'))) profile.floral += 6;

  Object.keys(profile).forEach(k => {
    // @ts-ignore
    if (profile[k] > 10) profile[k] = 10;
  });

  return profile;
};



export default async function PerfumePage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  const supabase = await createClient();

  console.log(`[DEBUG] --------------------------------------------------`);
  console.log(`[DEBUG] PerfumePage loaded. Raw Slug: "${params.slug}" -> Decoded: "${slug}"`);

  // 1. Fetch Main Perfume (Try Slug First, then ID as fallback)
  let mainPerfume = null;
  
  const { data: slugMatches, error: slugError } = await supabase
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
    console.log(`[DEBUG] Found by SLUG. ID: ${mainPerfume.id}, Name: ${mainPerfume.name}`);
  } else {
     console.log(`[DEBUG] Not found by slug. Matches: ${slugMatches?.length}, Error: ${slugError?.message}`);
  }

  // Fallback to ID if not found by slug
  if (!mainPerfume && slug.length > 20) { // UUIDs are long
    console.log(`[DEBUG] Attempting fallback by ID: "${slug}"`);
    const { data: fallbackPerfume, error: fallbackError } = await supabase
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
    
    if (fallbackPerfume) {
      mainPerfume = fallbackPerfume;
      console.log(`[DEBUG] Found by ID fallback. Name: ${mainPerfume.name}`);
    } else {
      console.log(`[DEBUG] Not found by ID fallback. Error: ${fallbackError?.message}`);
    }
  }

  if (!mainPerfume) {
    console.error(`[DEBUG] FATAL: Perfume not found for slug/id: "${slug}"`);
    notFound(); 
  }

  // Cast and format profile
  const perfumeData: Perfume = {
    ...mainPerfume,
    scent_profile: mainPerfume.scent_profile || generateProfileFromVibes(mainPerfume.vibe_tags || [])
  } as unknown as Perfume;

  // 2. Fetch Related Perfumes (Candidates)
  const allPerfumes = await RecommendationEngine.getAllPerfumes(supabase);

  // 4. Process Recommendations using RecommendationEngine
  const recommendationCategories = RecommendationEngine.getEnhancedRecommendations(perfumeData, allPerfumes || []);

  // 5. Render Client View
  return (
    <PerfumeClientView 
      perfume={perfumeData} 
      recommendationCategories={recommendationCategories}
    />
  );
}
