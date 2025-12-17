import { createClient } from '@/utils/supabase/server';
import PerfumeClientView from '@/components/PerfumeClientView';
import { Database } from '@/types/database';
import { notFound } from 'next/navigation';

// --- Types ---

type Note = {
  name: string;
  color_hex?: string;
};

type PerfumeNote = {
  type: string;
  note: Note;
};

type Brand = {
  name: string;
};

type Perfume = Database['public']['Tables']['perfumes']['Row'] & {
  brand?: Brand;
  perfume_notes?: PerfumeNote[];
  scent_profile?: Record<string, number>;
  perfumer?: string;
  scenario?: string;
  olfactory_family?: string[];
  longevity_rating?: number;
  sillage_rating?: number;
  sharedNotes?: string[];
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

const getDominantFamily = (notes: string[]) => {
  const scores: Record<string, number> = {};
  notes.forEach(note => {
    for (const [family, keywords] of Object.entries(SCENT_FAMILIES)) {
      if (keywords.some(k => note.includes(k))) scores[family] = (scores[family] || 0) + 1;
    }
  });
  return Object.entries(scores).sort(([,a], [,b]) => b - a)[0]?.[0] || null;
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

const getMatchDetails = (current: any, candidate: any) => {
    let score = 10;
    const reasons: string[] = [];

    if (current.vibe_tags && candidate.vibe_tags) {
      const sharedVibes = current.vibe_tags.filter((t: string) => candidate.vibe_tags.includes(t));
      score += (sharedVibes.length * 20);
      if (sharedVibes.length > 0) reasons.push("Vibe");
    }

    const currentNoteMap = new Map();
    current.perfume_notes?.forEach((pn: any) => {
      if (pn.note?.name) currentNoteMap.set(pn.note.name.toLowerCase(), pn.type);
    });

    let sharedBaseNotes = 0;
    let sharedHeartNotes = 0;

    if (candidate.perfume_notes) {
      candidate.perfume_notes.forEach((pn: any) => {
        const name = pn.note?.name?.toLowerCase();
        const type = pn.type;
        
        if (currentNoteMap.has(name)) {
          const originalType = currentNoteMap.get(name);
          if (type === 'Base' || originalType === 'Base') {
            score += 25;
            sharedBaseNotes++;
          } else if (type === 'Heart' || originalType === 'Heart') {
            score += 15;
            sharedHeartNotes++;
          } else {
            score += 5;
          }
        }
      });
    }

    const currentNotesList = current.perfume_notes?.map((n:any) => n.note?.name?.toLowerCase()) || [];
    const candidateNotesList = candidate.perfume_notes?.map((n:any) => n.note?.name?.toLowerCase()) || [];
    const currentFam = getDominantFamily(currentNotesList);
    const candidateFam = getDominantFamily(candidateNotesList);
    
    if (currentFam && candidateFam && currentFam === candidateFam) score += 15;

    if (current.best_season?.some((s: string) => candidate.best_season?.includes(s))) score += 5;
    if (current.brand?.name === candidate.brand?.name) score += 5;

    let reasonText = 'Similar vibe';
    if (sharedBaseNotes >= 2) reasonText = 'Similar dry-down DNA';
    else if (sharedHeartNotes >= 2) reasonText = 'Similar heart profile';
    else if (currentFam && currentFam === candidateFam) reasonText = `Matches ${currentFam} style`;

    return { score: Math.min(score, 99), reason: reasonText };
};

const findDupes = (mainPerfume: any, allPerfumes: any[]) => {
    if (!mainPerfume || !allPerfumes) return [];
    const mainNotesRaw = mainPerfume.perfume_notes?.map((n: any) => n.note?.name) || [];
    const mainNotesLower = mainNotesRaw.filter((n: string) => n != null && n.trim() !== '').map((n: string) => n.toLowerCase());
    const mainVibes = mainPerfume.vibe_tags || [];
    const mainFamily = categorizeScentFamily(mainNotesLower, mainVibes);

    return allPerfumes
      .filter((perfume: any) => {
        if (perfume.id === mainPerfume.id) return false;
        const candidateNotesRaw = perfume.perfume_notes?.map((n: any) => n.note?.name) || [];
        const candidateNotesLower = candidateNotesRaw.filter((n: string) => n != null && n.trim() !== '').map((n: string) => n.toLowerCase());
        const candidateVibes = perfume.vibe_tags || [];
        const candidateFamily = categorizeScentFamily(candidateNotesLower, candidateVibes);

        if (!mainFamily || !candidateFamily || mainFamily !== candidateFamily) return false;
        const totalMainNotes = mainNotesLower.length;
        if (totalMainNotes === 0) return false;
        const sharedCount = candidateNotesLower.filter((n: string) => mainNotesLower.includes(n)).length;
        return (sharedCount / totalMainNotes) * 100 >= 70;
      })
      .map((perfume: any) => {
         const candidateNotesRaw = perfume.perfume_notes?.map((n: any) => n.note?.name) || [];
         const candidateNotesLower = candidateNotesRaw.filter((n: string) => n != null && n.trim() !== '').map((n: string) => n.toLowerCase());
         const totalMainNotes = mainNotesLower.length;
         const sharedCount = candidateNotesLower.filter((n: string) => mainNotesLower.includes(n)).length;
         const matchPercentage = (sharedCount / totalMainNotes) * 100;
         const actualSharedNotes = Array.from(new Set(
           candidateNotesRaw.filter((n: string) => n != null && n.trim() !== '').filter((n: string) => mainNotesLower.includes(n.toLowerCase()))
         ));
         const sharedVibesCount = perfume.vibe_tags?.filter((t:string) => mainVibes.includes(t)).length || 0;
         const score = Math.min(98, Math.round(matchPercentage * 0.8) + (sharedVibesCount * 5));
         const isCheaper = perfume.price_tier && mainPerfume.price_tier && perfume.price_tier.length < mainPerfume.price_tier.length;

         return {
            dupe_id: perfume.id,
            dupe_name: perfume.name,
            dupe_image_url: perfume.image_url,
            brand_name: perfume.brand?.name,
            dupe_price_tier: perfume.price_tier,
            match_type: isCheaper ? 'Smart Buy' : 'DNA Match',
            match_score: score,
            shared_notes: actualSharedNotes,
            match_percentage: `${Math.round(matchPercentage)}%`
         };
      })
      .sort((a: any, b: any) => b.match_score - a.match_score)
      .slice(0, 3);
};

export default async function PerfumePage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const id = params.id;
  const supabase = await createClient();

  // 1. Fetch Main Perfume
  const { data: mainPerfume, error } = await supabase
    .from('perfumes')
    .select(`
      id, name, image_url, rating, vibe_tags,
      perfumer, price_tier, best_season, gender,
      longevity_rating, sillage_rating,
      scenario, scent_profile,
      olfactory_family,
      brand:brands!perfumes_brand_id_fkey(name),
      perfume_notes(type, note:notes(name, color_hex))
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !mainPerfume) {
    console.error('Error fetching perfume:', error);
    notFound(); // Triggers Next.js 404 page
  }

  // Cast and format profile
  const perfumeData: Perfume = {
    ...mainPerfume,
    scent_profile: mainPerfume.scent_profile || generateProfileFromVibes(mainPerfume.vibe_tags || [])
  } as unknown as Perfume;

  // 2. Fetch Related Perfumes (Candidates)
  let query = supabase.from('perfumes').select(`
      id, name, image_url, price_tier, best_season, vibe_tags, gender,
      brand:brands!perfumes_brand_id_fkey(name),
      perfume_notes(type, note:notes(name))
    `)
    .neq('id', id)
    .limit(100);

  if (perfumeData.vibe_tags && perfumeData.vibe_tags.length > 0) {
      query = query.overlaps('vibe_tags', perfumeData.vibe_tags);
  }

  const { data: allPerfumes } = await query;

  // 3. Process Recommendations
  const mainNotesLower = perfumeData.perfume_notes?.map((n: any) => n.note?.name?.toLowerCase()) || [];
  
  const relatedPerfumes = (allPerfumes || [])
    .filter((p: any) => p.vibe_tags?.some((t: string) => perfumeData.vibe_tags?.includes(t)))
    .map((p: any) => {
      const candidateNotes = p.perfume_notes?.map((n: any) => n.note?.name?.toLowerCase()) || [];
      const sharedNotes = candidateNotes.filter((n: string) => mainNotesLower.some((mainNote: string) => mainNote === n)).slice(0, 3);
      return { ...p, sharedNotes };
    })
    .sort((a: any, b: any) => getMatchDetails(perfumeData, b).score - getMatchDetails(perfumeData, a).score)
    .filter((p: any, index: number, self: any[]) => {
      const brandCount = self.slice(0, index).filter(prev => prev.brand?.name === p.brand?.name).length;
      return brandCount < 2;
    })
    .slice(0, 9) as Perfume[];

  // 4. Process Dupes
  const dupes = findDupes(perfumeData, allPerfumes || []).map(dupe => ({
    ...dupe,
    shared_notes: dupe.shared_notes.map(note => String(note))
  }));

  // 5. Render Client View
  return (
    <PerfumeClientView 
      perfume={perfumeData} 
      relatedPerfumes={relatedPerfumes} 
      dupes={dupes} 
    />
  );
}
