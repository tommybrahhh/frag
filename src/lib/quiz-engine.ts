// Engine for matching quiz answers to perfumes
import { QuizAnswers, buildPersonalityProfile, PersonalityProfile } from './quiz-data';

export interface Perfume {
  id: string;
  name: string;
  image_url: string | null;
  slug: string | null;
  brand_name: string;
  gender: string;
  sillage_rating: number;
  vibe_tags?: string[];
  occasions?: string[];
  best_season?: string[];
  scent_profile?: Record<string, number>;
  perfume_notes?: Array<{ note: { name: string } }>;
}

export interface Recommendation {
  perfume: Perfume;
  score: number;
  matchReason: string;
  matchType: 'top' | 'switch' | 'discovery';
}

// Hardcoded Niche List for heuristic detection
const NICHE_BRANDS = [
  'Nasomatto', 'Orto Parisi', 'Etat Libre d\'Orange', 'By Kilian', 'Kilian',
  'Frederic Malle', 'Le Labo', 'Maison Crivelli', 'Amouage', 'Xerjoff',
  'Mancera', 'Montale', 'BDK Parfums', 'Serge Lutens', 'Zoologist', 
  'Tauer Perfumes', 'Nishane', 'Penhaligon\'s', 'Creed', 'Parfums de Marly',
  'Maison Francis Kurkdjian', 'Diptyque', 'Byredo', 'Memo Paris'
];

const CHALLENGING_NOTES = [
  'oud', 'civet', 'castoreum', 'leather', 'tobacco', 'incense', 'smoke', 
  'birch tar', 'cumin', 'animal notes', 'soil', 'truffle', 'ink'
];

export function getRecommendations(answers: QuizAnswers, allPerfumes: Perfume[]): {
  topMatches: Recommendation[];
  possibleSwitches: Recommendation[];
  newDiscoveries: Recommendation[];
} {
  const profile = buildPersonalityProfile(answers);
  
  const allScoredPerfumes = allPerfumes
    .map((perfume) => {
      let score = 0;
      let reasons: string[] = [];

      const isNiche = NICHE_BRANDS.some(b => 
        perfume.brand_name?.toLowerCase().includes(b.toLowerCase())
      );
      
      const hasChallengingNotes = perfume.perfume_notes?.some(n => 
        n.note?.name && CHALLENGING_NOTES.some(cn => n.note.name.toLowerCase().includes(cn))
      );

      // --- 1. COMPLEXITY / NICHE FILTERING (The "Deep" Factor) ---
      if (profile.complexityPreference === 'niche') {
        if (isNiche) {
          score += 40; // Huge boost for niche brands
          reasons.push("Artistic & Niche");
        }
        if (hasChallengingNotes) {
          score += 20; // Reward complexity
          reasons.push("Complex & Unique profile");
        }
        // Penalize generic designer scents slightly if they aren't niche
        if (!isNiche) score -= 10;
        
      } else if (profile.complexityPreference === 'safe') {
        if (hasChallengingNotes) {
          score -= 30; // Avoid polarization
        }
        if (isNiche) {
          // Niche isn't bad, but safe users usually prefer designer price/availability/scent profiles
          // We don't penalize too hard, but we don't boost.
          score -= 5; 
        } else {
          score += 15; // Boost recognizable designer brands implicitly
        }
      } else {
        // 'bold'
        if (perfume.sillage_rating > 3.5) score += 20; // Reward powerhouses
        if (hasChallengingNotes) score += 10; // Bold users can handle some spice
      }


      // --- 2. VIBE MATCHING ---
      if (perfume.vibe_tags && profile.vibes.length > 0) {
        const matchingVibes = perfume.vibe_tags.filter(tag =>
          profile.vibes.some(v => tag.toLowerCase().includes(v.toLowerCase()))
        );
        if (matchingVibes.length > 0) {
          score += matchingVibes.length * 15;
          if (reasons.length === 0) reasons.push(`Matches your ${matchingVibes[0]} energy`);
        }
      }

      // --- 3. SCENT FAMILY ---
      if (perfume.vibe_tags && profile.scentFamilies.length > 0) {
        const matchingFamilies = perfume.vibe_tags.filter(tag =>
          profile.scentFamilies.some(f => tag.toLowerCase().includes(f.toLowerCase()))
        );
        if (matchingFamilies.length > 0) {
          score += matchingFamilies.length * 20;
          if (reasons.length < 2) reasons.push(`Perfect for ${matchingFamilies[0]} lovers`);
        }
      }

      // --- 4. NOTES ---
      if (perfume.perfume_notes && profile.notes.length > 0) {
        const matchingNotes = perfume.perfume_notes.filter(n =>
          n.note && profile.notes.some(pn => n.note.name.toLowerCase().includes(pn.toLowerCase()))
        );
        if (matchingNotes.length > 0) {
          score += matchingNotes.length * 10;
        }
      }

      // --- 5. GENDER NUANCE ---
      if (answers.protagonist) {
        const pGender = perfume.gender?.toLowerCase() || 'unisex';
        const userGender = answers.protagonist;

        if (userGender === 'unisex') {
           if (pGender.includes('unisex') || pGender.includes('shared')) score += 15;
           else score += 5; 
        } else {
           const target = userGender === 'feminine' ? ['female', 'women', 'feminine'] : ['male', 'men', 'masculine'];
           const isDirectMatch = target.some(t => pGender.includes(t));
           
           if (isDirectMatch) score += 25;
           else if (pGender.includes('unisex') || pGender.includes('shared')) score += 10;
           else score -= 30;
        }
      }

      return {
        perfume,
        score: Math.max(0, score),
        matchReason: reasons[0] || "Fits your vibe",
        matchType: score > 85 ? 'top' : score > 60 ? 'switch' : 'discovery'
      } as Recommendation;
    })
    .sort((a, b) => b.score - a.score);

  // Categorize
  const topMatches = allScoredPerfumes.filter(p => p.matchType === 'top').slice(0, 3);
  
  const possibleSwitches = allScoredPerfumes
    .filter(p => p.matchType === 'switch' && !topMatches.some(t => t.perfume.id === p.perfume.id))
    .slice(0, 3);
    
  const newDiscoveries = allScoredPerfumes
    .filter(p => p.matchType === 'discovery' && 
      !topMatches.some(t => t.perfume.id === p.perfume.id) && 
      !possibleSwitches.some(s => s.perfume.id === p.perfume.id))
    .slice(0, 3);
    
  if (topMatches.length < 3) {
      const usedIds = new Set(topMatches.map(m => m.perfume.id));
      const fillers = allScoredPerfumes.filter(p => !usedIds.has(p.perfume.id)).slice(0, 3 - topMatches.length);
      topMatches.push(...fillers);
  }

  return {
    topMatches,
    possibleSwitches,
    newDiscoveries
  };
}

export function getPreferenceSummary(answers: QuizAnswers): string {
    const profile = buildPersonalityProfile(answers);
    return `${profile.archetype}`;
}