'use server';

import { createClient } from '@/utils/supabase/server';
import { findLayeringMatches } from '@/lib/alchemy';
import { generateProfileFromVibes } from '@/lib/perfume-utils'; // Import the new util

export async function getLayeringSuggestions(basePerfumeId: string) {
  if (!basePerfumeId) return [];

  const supabase = await createClient();

  // 1. Fetch full details for the base perfume
  const { data: basePerfume } = await supabase
    .from('perfumes')
    .select(`
        id, name, image_url, vibe_tags, price_tier,
        scent_profile, brand_id, longevity_rating, sillage_rating,
        brand:brands(name),
        perfume_notes(type, note:notes(name, color_hex))
    `)
    .eq('id', basePerfumeId)
    .single();

  if (!basePerfume) return [];

  // Normalize brand_name for alchemy logic
  // @ts-ignore
  basePerfume.brand_name = basePerfume.brand?.name;
  if (!basePerfume.scent_profile) {
    basePerfume.scent_profile = generateProfileFromVibes(basePerfume.vibe_tags);
  }

  // 2. Fetch a pool of potential candidates (limit to top rated or similar families to save resources)
  // Ideally, we'd use vector search or more targeted filters here.
  // For now, fetching a broad set of 50 decent perfumes to run the JS logic on.
  const { data: candidatePool } = await supabase
    .from('perfumes')
    .select(`
        id, name, image_url, vibe_tags, price_tier,
        scent_profile, brand_id, rating, longevity_rating, sillage_rating,
        brand:brands(name),
        perfume_notes(type, note:notes(name, color_hex))
    `)
    .neq('id', basePerfumeId)
    .order('rating', { ascending: false })
    .limit(50);

  if (!candidatePool) return [];

  // FIX: Ensure ALL candidates have profiles before mixing
  const normalizedCandidates = candidatePool.map((p: any) => ({
    ...p,
    brand_name: p.brand?.name,
    scent_profile: p.scent_profile || generateProfileFromVibes(p.vibe_tags)
  }));

  // 3. Run the alchemy logic
  const matches = findLayeringMatches(basePerfume, normalizedCandidates);

  return matches;
}
