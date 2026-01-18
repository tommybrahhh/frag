import { createClient } from '@/lib/supabase';
import { mixPerfumes } from '@/lib/alchemy';
import { generateProfileFromVibes } from '@/lib/perfume-utils';
import { Database } from '@/types/database';

// ------------------------------------------------------------------
// TYPES & INTERFACES
// ------------------------------------------------------------------

type PerfumeWithRelations = Database['public']['Tables']['perfumes']['Row'] & {
  brand: (Database['public']['Tables']['brands']['Row'] & { tier: Database["public"]["Enums"]["brand_tier_type"] | null }) | null;
  perfume_notes: (Database['public']['Tables']['perfume_notes']['Row'] & {
    note: Database['public']['Tables']['notes']['Row'] | null
  })[];
};

export interface Recommendation {
  perfume: PerfumeWithRelations;
  type: 'similar' | 'discovery' | 'note_isolator' | 'performance_upgrade' | 'structural_shift' | 'vibe_evolution' | 'layering';
  score: number;
  reason: string;
  sharedNotes?: string[];
  sharedVibes?: string[];
  sharedFamilies?: string[];
  priceComparison?: 'cheaper' | 'similar' | 'premium';
  guidance?: string;
  tradeOffs?: {
    longevityDiff: string;
    missingNotes: string[];
    complexity: string;
    savings: number;
  };
  resultingScent?: {
    name: string;
    family: string;
    longevity: number;
    sillage: number;
    occasion: string;
    profile: Record<string, number>;
  };
}

export interface RecommendationCategory {
  type: string;
  title: string;
  description: string;
  recommendations: Recommendation[];
}

type ScentProfileAnalysis = ReturnType<typeof RecommendationEngine.analyzeScentProfile>;

// ------------------------------------------------------------------
// ENGINE CLASS
// ------------------------------------------------------------------

export class RecommendationEngine {

  /**
   * DATA FETCHING
   * Optimized to select only fields necessary for analysis to reduce payload.
   */
  public static async getAllPerfumes(supabaseClient?: any, limit: number = 2000) {
    const supabase = supabaseClient || createClient();
    const { data: perfumes, error } = await supabase
      .from('perfumes')
      .select(`
        id, name, slug, image_url, rating, price_tier, 
        longevity_rating, sillage_rating, olfactory_family, vibe_tags,
        scent_profile,
        brand:brands(name, tier),
        perfume_notes(
          type, 
          prominence_score,
          note:notes(name, color_hex, family)
        )
      `)
      .limit(limit);

    if (error) console.error('Error fetching perfumes:', error);

    // FIX: Backfill missing scent_profiles on the fly
    return (perfumes || []).map((p: any) => ({
        ...p,
        scent_profile: p.scent_profile || generateProfileFromVibes(p.vibe_tags)
    }));
  }

  // ------------------------------------------------------------------
  // CORE ANALYSIS
  // ------------------------------------------------------------------

  public static analyzeScentProfile(perfume: PerfumeWithRelations) {
    const notesRaw = perfume.perfume_notes || [];
    
    // Extract notes by position
    const topNotes = notesRaw.filter(n => n.type === 'Top').map(n => n.note?.name || '');
    const heartNotes = notesRaw.filter(n => n.type === 'Heart').map(n => n.note?.name || '');
    const baseNotes = notesRaw.filter(n => n.type === 'Base').map(n => n.note?.name || '');
    const allNoteNames = notesRaw.map(n => n.note?.name || '');

    // Identify Signature Note: Highest prominence score or fallback to first note
    const signatureNoteObj = notesRaw.sort((a, b) => (b.prominence_score || 0) - (a.prominence_score || 0))[0];
    const signatureNote = signatureNoteObj?.note?.name || allNoteNames[0] || 'Fragrance';

    // Identify Dominant Vibe: Strongest accord from profile or first tag
    let dominantVibe = 'Classic';
    const profile = perfume.scent_profile as Record<string, number> | null;
    if (profile) {
      const sortedAccords = Object.entries(profile).sort((a, b) => b[1] - a[1]);
      if (sortedAccords.length > 0) dominantVibe = sortedAccords[0][0];
    } else if (perfume.vibe_tags && perfume.vibe_tags.length > 0) {
      dominantVibe = perfume.vibe_tags[0];
    }
    dominantVibe = dominantVibe.charAt(0).toUpperCase() + dominantVibe.slice(1);

    return {
      topNotes,
      heartNotes,
      baseNotes,
      allNoteNames,
      signatureNote,
      dominantVibe,
      longevity: perfume.longevity_rating || 5,
      sillage: perfume.sillage_rating || 5,
      families: perfume.olfactory_family || []
    };
  }

  // ------------------------------------------------------------------
  // COMPOSITE PROFILE (For "You" Analysis)
  // ------------------------------------------------------------------

  public static createCompositeProfile(collection: any[]): PerfumeWithRelations | null {
    if (!collection || collection.length === 0) return null;

    const counts = {
      family: {} as Record<string, number>,
      vibe: {} as Record<string, number>,
      note: {} as Record<string, number>
    };
    
    let totalLongevity = 0;
    let totalSillage = 0;
    let countWithStats = 0;

    collection.forEach(p => {
        p.olfactory_family?.forEach((f: string) => counts.family[f] = (counts.family[f] || 0) + 1);
        p.vibe_tags?.forEach((v: string) => counts.vibe[v] = (counts.vibe[v] || 0) + 1);
        p.perfume_notes?.forEach((pn: any) => {
            const nName = pn.note?.name;
            if (nName) counts.note[nName] = (counts.note[nName] || 0) + 1;
        });

        // Accumulate stats for averaging
        if (p.longevity_rating) {
            totalLongevity += p.longevity_rating;
            totalSillage += (p.sillage_rating || 5);
            countWithStats++;
        }
    });

    const getTop = (src: Record<string, number>, limit: number) => 
        Object.entries(src).sort((a, b) => b[1] - a[1]).slice(0, limit).map(e => e[0]);

    return {
        id: 'user-composite',
        name: 'Your Taste Profile',
        brand_id: null,
        olfactory_family: getTop(counts.family, 3),
        vibe_tags: getTop(counts.vibe, 1),
        perfume_notes: getTop(counts.note, 5).map(name => ({
            type: 'Heart',
            prominence_score: 10,
            note: { name, color_hex: null, family: null }
        })) as any,
        brand: { name: 'You', tier: null } as any,
        longevity_rating: countWithStats ? Math.round(totalLongevity / countWithStats) : 5,
        sillage_rating: countWithStats ? Math.round(totalSillage / countWithStats) : 5,
        // Defaults
        slug: 'user-profile', image_url: null, rating: 5, price_tier: '$$', 
        best_season: [], gender: 'Unisex', concentration: 'EDP', 
        best_time: 'Day', occasions: [], perfumer: null, 
        release_year: null, scenario: null, embedding: null, 
        scent_profile: null, created_at: new Date().toISOString()
    };
  }

  // ------------------------------------------------------------------
  // GENERIC STORY PROCESSOR (The Refactor Magic)
  // ------------------------------------------------------------------

  /**
   * Abstracted logic for filtering, scoring, sorting, and applying templates.
   */
  private static processCandidates<T>(
    mainPerfume: PerfumeWithRelations,
    candidates: PerfumeWithRelations[],
    profile: ScentProfileAnalysis,
    type: Recommendation['type'],
    // Function that returns score + metadata if match, or null if no match
    scorer: (candidate: PerfumeWithRelations, cProfile: ScentProfileAnalysis) => (T & { score: number }) | null,
    // Function to map the matched metadata to a final Recommendation object
    mapper: (match: T & { score: number, perfume: PerfumeWithRelations }, template: string) => Recommendation,
    // Templates to rotate through
    templates: string[],
    limit: number = 3
  ): Recommendation[] {
    
    // 1. Score & Filter
    const matches = candidates
      .filter(p => p.id !== mainPerfume.id)
      .map(candidate => {
        const cProfile = this.analyzeScentProfile(candidate);
        const result = scorer(candidate, cProfile);
        return result ? { ...result, perfume: candidate } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 2. Map with Template Rotation
    return matches.map((match, index) => 
      mapper(match, templates[index % templates.length])
    );
  }

  // ------------------------------------------------------------------
  // SPECIFIC STORY IMPLEMENTATIONS
  // ------------------------------------------------------------------

  private static getNoteIsolatorRecommendations(main: PerfumeWithRelations, candidates: PerfumeWithRelations[], profile: ScentProfileAnalysis) {
    const targetNote = profile.signatureNote;
    if (!targetNote) return [];

    return this.processCandidates(
      main, candidates, profile, 'note_isolator',
      // Scorer
      (candidate, cProfile) => {
        const cNotes = candidate.perfume_notes || [];
        const match = cNotes.find(n => n.note?.name === targetNote);
        const isProminent = match && (match.prominence_score ? match.prominence_score > 7 : true);
        if (!match || !isProminent) return null;

        const isCleaner = cNotes.length < (main.perfume_notes?.length || 15);
        const isInName = candidate.name.toLowerCase().includes(targetNote.toLowerCase());
        if (!isCleaner && !isInName) return null;

        return { score: 85 + (isInName ? 10 : 0), targetNote };
      },
      // Mapper
      (match, template) => ({
        perfume: match.perfume, type: 'note_isolator', score: match.score,
        reason: template.replace('{note}', match.targetNote),
        sharedNotes: [match.targetNote]
      }),
      // Templates
      [
        `If you're just chasing that {note} hit, this is the purest way to get it.`,
        `Strips away the noise and focuses entirely on the {note}.`,
        `A reference-class {note}. Minimalist, clean, and direct.`
      ]
    );
  }

  private static getPerformanceUpgradeRecommendations(main: PerfumeWithRelations, candidates: PerfumeWithRelations[], profile: ScentProfileAnalysis) {
    if (profile.longevity >= 9 && profile.sillage >= 9) return [];

    return this.processCandidates(
      main, candidates, profile, 'performance_upgrade',
      // Scorer
      (candidate, cProfile) => {
        const sharedNotes = profile.allNoteNames.filter(n => cProfile.allNoteNames.includes(n));
        if (sharedNotes.length < 2) return null;

        const longevityBoost = (candidate.longevity_rating || 5) - profile.longevity;
        const sillageBoost = (candidate.sillage_rating || 5) - profile.sillage;
        if ((longevityBoost + sillageBoost) < 1.5) return null;

        return { score: 90 + (sharedNotes.length * 2), longevityBoost, sharedNotes };
      },
      // Mapper
      (match, template) => ({
        perfume: match.perfume, type: 'performance_upgrade', score: match.score,
        reason: template,
        sharedNotes: match.sharedNotes.slice(0, 3),
        tradeOffs: { longevityDiff: `+${match.longevityBoost.toFixed(1)} Rating`, missingNotes: [], complexity: 'Similar', savings: 0 }
      }),
      // Templates
      [
        `Fixes the longevity issue. Same scent profile, but actually lasts all day.`,
        `The "Beast Mode" alternative. Expect 10+ hours of performance.`,
        `Wear this when you want to be smelled from across the room.`
      ]
    );
  }

  private static getStructuralShiftRecommendations(main: PerfumeWithRelations, candidates: PerfumeWithRelations[], profile: ScentProfileAnalysis) {
    const targetBase = profile.baseNotes;
    if (targetBase.length === 0) return [];

    return this.processCandidates(
      main, candidates, profile, 'structural_shift',
      // Scorer
      (candidate, cProfile) => {
        const shifts = targetBase.filter(n => cProfile.topNotes.includes(n) || cProfile.heartNotes.includes(n));
        if (shifts.length === 0) return null;
        return { score: 80 + (shifts.length * 5), mainNote: shifts[0], shifts };
      },
      // Mapper
      (match, template) => ({
        perfume: match.perfume, type: 'structural_shift', score: match.score,
        reason: template.replace('{note}', match.mainNote),
        sharedNotes: match.shifts
      }),
      // Templates
      [
        `Fast-forwards straight to the {note} dry-down you love.`,
        `Skip the opening—this is all about that {note} base right from the start.`,
        `If you wait for the {note} in the original, this gives it to you immediately.`
      ]
    );
  }

  private static getVibeEvolutionRecommendations(main: PerfumeWithRelations, candidates: PerfumeWithRelations[], profile: ScentProfileAnalysis) {
    return this.processCandidates(
      main, candidates, profile, 'vibe_evolution',
      // Scorer
      (candidate, cProfile) => {
        if (!cProfile.allNoteNames.includes(profile.signatureNote)) return null;
        if (cProfile.dominantVibe === profile.dominantVibe) return null;
        return { score: 75, newVibe: cProfile.dominantVibe, hookNote: profile.signatureNote };
      },
      // Mapper
      (match, template) => ({
        perfume: match.perfume, type: 'vibe_evolution', score: match.score,
        reason: template.replace('{note}', match.hookNote).replace('{vibe}', match.newVibe.toLowerCase()),
        sharedNotes: [match.hookNote], sharedVibes: [match.newVibe]
      }),
      // Templates
      [
        `Takes that {note} you love, but dresses it up for a {vibe} setting.`,
        `Imagine the original, but rewritten for a {vibe} mood.`,
        `Same {note} DNA, totally different {vibe} energy.`
      ]
    );
  }

  // ------------------------------------------------------------------
  // NEW ENTHUSIAST STORIES
  // ------------------------------------------------------------------

  /**
   * STORY 5: THE MASTERPIECE CONNECTION (Perfumer Loyalty)
   * "If you love the art, follow the artist."
   */
  private static getPerfumerPortfolioRecommendations(main: PerfumeWithRelations, candidates: PerfumeWithRelations[]) {
    // Requires 'perfumer' field in DB. 
    // If multiple perfumers are listed (e.g. "Anne Flipo, Carlos Benaim"), we check for partial matches.
    if (!main.perfumer) return [];

    const mainPerfumers = main.perfumer.split(',').map(p => p.trim());

    return this.processCandidates(
      main, candidates, {} as any, 'discovery', // Type 'discovery' fits best
      (candidate, _) => {
        if (!candidate.perfumer) return null;
        
        // Find which perfumer matches
        const match = mainPerfumers.find(mp => candidate.perfumer!.includes(mp));
        if (!match) return null;

        return { score: 85, artist: match };
      },
      (match, template) => ({
        perfume: match.perfume, type: 'discovery', score: match.score,
        reason: template.replace('{artist}', match.artist),
        sharedNotes: [] // Not about notes, about the creator
      }),
      [
        `Crafted by {artist}, the same nose behind your selection.`,
        `If you trust {artist}'s taste, you'll vibe with this.`,
        `You can feel {artist}'s signature style here.`
      ]
    );
  }

  /**
   * STORY 6: THE SEASONAL PIVOT
   * "Love this DNA? Here is how to wear it in the opposite season."
   */
  private static getSeasonalPivotRecommendations(main: PerfumeWithRelations, candidates: PerfumeWithRelations[], profile: ScentProfileAnalysis) {
    const mainSeasons = main.best_season || [];
    if (mainSeasons.length === 0) return [];

    // Define opposites
    const isWinterHeavy = mainSeasons.includes('Winter') || mainSeasons.includes('Fall');
    const targetSeason = isWinterHeavy ? 'Summer' : 'Winter';

    return this.processCandidates(
      main, candidates, profile, 'vibe_evolution',
      (candidate, cProfile) => {
        // 1. Must be appropriate for the OPPOSITE season
        if (!candidate.best_season?.includes(targetSeason)) return null;

        // 2. But must still share DNA (Notes or Family) to feel "familiar"
        const sharedNotes = profile.allNoteNames.filter(n => cProfile.allNoteNames.includes(n));
        if (sharedNotes.length < 2) return null;

        return { score: 80, targetSeason, sharedNotes };
      },
      (match, template) => ({
        perfume: match.perfume, type: 'vibe_evolution', score: match.score,
        reason: template.replace('{season}', match.targetSeason),
        sharedNotes: match.sharedNotes.slice(0, 3)
      }),
      [
        `How to wear this style in the {season} without choking everyone out.`,
        `The {season} version of this DNA. Lighter, fresher, but familiar.`,
        `Keeps the vibe alive, even in the {season} weather.`
      ]
    );
  }

  /**
   * STORY 7: THE NICHE GATEWAY
   * "Stop wearing what everyone else is wearing."
   */
  private static getNicheGatewayRecommendations(main: PerfumeWithRelations, candidates: PerfumeWithRelations[], profile: ScentProfileAnalysis) {
    // Only works if the Main perfume is "Designer" or "Celebrity"
    if (!main.brand?.tier || ['Niche', 'Indie', 'Historical'].includes(main.brand.tier)) return [];

    return this.processCandidates(
      main, candidates, profile, 'performance_upgrade', // Reusing this type for "Upgrade" visual
      (candidate, cProfile) => {
        // 1. Candidate MUST be Niche/Indie
        if (!candidate.brand?.tier || !['Niche', 'Indie'].includes(candidate.brand.tier)) return null;

        // 2. Must be highly similar (High Score) to be a safe gateway
        const sharedNotes = profile.allNoteNames.filter(n => cProfile.allNoteNames.includes(n));
        const sharedFamilies = profile.families.filter(f => cProfile.families.includes(f));
        
        let similarity = (sharedNotes.length * 10) + (sharedFamilies.length * 20);
        if (similarity < 40) return null;

        return { score: 90 + similarity, tier: candidate.brand.tier, sharedNotes };
      },
      (match, template) => ({
        perfume: match.perfume, type: 'performance_upgrade', score: match.score,
        reason: template.replace('{tier}', match.tier),
        sharedNotes: match.sharedNotes.slice(0, 3),
        priceComparison: 'premium' // Usually more expensive
      }),
      [
        `A massive step up in quality. You can actually smell the difference in ingredients.`,
        `This is the high-end, {tier} interpretation of that profile.`,
        `Deeper, richer, and more complex. A true {tier} experience.`
      ]
    );
  }

  // ------------------------------------------------------------------
  // PUBLIC ACCESSORS
  // ------------------------------------------------------------------

  public static getSimilarRecommendations(main: PerfumeWithRelations, all: PerfumeWithRelations[], count = 10): Recommendation[] {
    const profile = this.analyzeScentProfile(main);
    
    // Manual process for "Similar" as it has unique scoring logic
    return all
      .filter(p => p.id !== main.id)
      .flatMap(candidate => {
        const cProfile = this.analyzeScentProfile(candidate);
        const sharedNotes = profile.allNoteNames.filter(n => cProfile.allNoteNames.includes(n));
        const sharedFamilies = profile.families.filter(f => cProfile.families.includes(f));
        
        let score = (sharedNotes.length * 15) + (sharedFamilies.length * 20);
        if (profile.dominantVibe === cProfile.dominantVibe) score += 10;
        
        if (score < 30) return [];

        return [{
          perfume: candidate, type: 'similar' as const, score: Math.min(99, score),
          reason: `Shares that ${sharedFamilies[0] || 'vibe'} DNA, but leans harder into ${sharedNotes.slice(0, 2).join(' & ')}.`,
          sharedNotes: sharedNotes.slice(0, 3)
        }];
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  public static getDiscoveryRecommendations(main: PerfumeWithRelations, all: PerfumeWithRelations[], count = 6): Recommendation[] {
    const profile = this.analyzeScentProfile(main);
    // Reuse Vibe Evolution logic but mapped as 'discovery'
    const recs = this.getVibeEvolutionRecommendations(main, all, profile);
    return recs.map(r => ({ ...r, type: 'discovery' as const })).slice(0, count);
  }


  public static getEnhancedRecommendations(mainPerfume: PerfumeWithRelations, allPerfumes: PerfumeWithRelations[]): RecommendationCategory[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    const categories: RecommendationCategory[] = [];

    const addCategory = (type: string, title: string, desc: string, recs: Recommendation[]) => {
      if (recs.length > 0) categories.push({ type, title, description: desc, recommendations: recs });
    };

    // 1. The "Artist" (High value for enthusiasts)
    addCategory('artist_portfolio', 'The Masterpiece Connection', `Trust the nose behind the scent.`, 
      this.getPerfumerPortfolioRecommendations(mainPerfume, allPerfumes));

    // 2. The "Niche Upgrade" (High value for upsell/discovery)
    addCategory('niche_upgrade', 'The Niche Upgrade', 'Higher quality ingredients, deeper complexity.',
      this.getNicheGatewayRecommendations(mainPerfume, allPerfumes, mainProfile));

    // 3. The "Seasonal Pivot" (High utility)
    const season = mainPerfume.best_season?.[0] === 'Winter' ? 'Summer' : 'Winter';
    addCategory('seasonal_pivot', 'Seasonal Switch', `Wear this DNA year-round, even in ${season}.`,
      this.getSeasonalPivotRecommendations(mainPerfume, allPerfumes, mainProfile));

    // ... (Keep your existing categories below: Isolator, Structure, etc.) ...
    
    addCategory('isolator', `Pure ${mainProfile.signatureNote}`, `For the true ${mainProfile.signatureNote} lovers.`, 
      this.getNoteIsolatorRecommendations(mainPerfume, allPerfumes, mainProfile));

    addCategory('vibe_remix', `${mainProfile.signatureNote} Remix`, `Same key ingredient, totally different vibe.`, 
      this.getVibeEvolutionRecommendations(mainPerfume, allPerfumes, mainProfile));

    addCategory('performance_beast', 'Performance Beasts', 'For when you need it to last 12+ hours.', 
      this.getPerformanceUpgradeRecommendations(mainPerfume, allPerfumes, mainProfile));

    addCategory('structure', 'Fast Forward', 'Skip the opening and get straight to the good stuff.', 
      this.getStructuralShiftRecommendations(mainPerfume, allPerfumes, mainProfile));

    addCategory('layering', 'Layering Combos', 'Create a custom signature scent.', 
      this.getLayeringRecommendations(mainPerfume, allPerfumes));

    return categories;
  }

  private static getLayeringRecommendations(main: PerfumeWithRelations, all: PerfumeWithRelations[]): Recommendation[] {
    return all
      .filter(p => p.id !== main.id && (p.perfume_notes?.length || 0) < 5)
      .slice(0, 2)
      .map(candidate => {
        const mix = mixPerfumes(main, candidate);
        return {
          perfume: candidate, type: 'layering', score: mix.safety,
          reason: mix.description, guidance: mix.mixingTips.join(' | '),
          resultingScent: {
            name: `${main.olfactory_family?.[0]} & ${candidate.olfactory_family?.[0]}`,
            family: 'Mixed', longevity: 7, sillage: 7, occasion: 'Custom', profile: mix.newProfile
          }
        };
      });
  }
}
