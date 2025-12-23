import { createClient } from '@/utils/supabase/server';
import CompareClientView from '@/components/CompareClientView';

export default async function ComparePage(props: { searchParams: Promise<{ a?: string, b?: string, ids?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // 1. Gather IDs
  let ids: string[] = [];
  
  if (searchParams.ids) {
    ids = searchParams.ids.split(',').filter(Boolean);
  } else if (searchParams.a || searchParams.b) {
    // Legacy support
    if (searchParams.a) ids.push(searchParams.a);
    if (searchParams.b) ids.push(searchParams.b);
  }

  // Deduplicate
  ids = Array.from(new Set(ids));

  let perfumes: any[] = [];

  // 2. Fetch Data if IDs exist
  if (ids.length > 0) {
    const { data } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url, price_tier, 
        longevity_rating, sillage_rating, gender,
        best_season, vibe_tags, perfumer, release_year,
        scenario, scent_profile, occasions,
        brand:brands(name),
        perfume_notes(
          type,
          note:notes(name, color_hex)
        )
      `)
      .in('id', ids);
    
    // Sort to match order of IDs in URL?
    // Not strictly necessary but nice.
    if (data) {
        perfumes = ids.map(id => data.find(p => p.id === id)).filter(Boolean);
    }
  }

  // 3. Render Client View
  return <CompareClientView initialPerfumes={perfumes} />;
}