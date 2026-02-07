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
  // CORE ANALYSIS & SIMILARITY ALGORITHMS
  // ------------------------------------------------------------------

  public static analyzeScentProfile(perfume: PerfumeWithRelations) {
    const notesRaw = perfume.perfume_notes || [];
    
    // Extract notes by position
    const uniqueNotes = (notes: typeof notesRaw) => Array.from(new Set(notes.map(n => n.note?.name || '').filter(Boolean)));
    
    const topNotes = uniqueNotes(notesRaw.filter(n => n.type === 'Top'));
    const heartNotes = uniqueNotes(notesRaw.filter(n => n.type === 'Heart'));
    const baseNotes = uniqueNotes(notesRaw.filter(n => n.type === 'Base'));
    const allNoteNames = uniqueNotes(notesRaw);

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

  /**
   * Calculates a holistic "Scent DNA" similarity score (0-100).
   * Considers Accords (Vibe), Ingredients (Notes), and Family structure.
   */
  private static calculateSimilarity(p1: PerfumeWithRelations, p2: PerfumeWithRelations): number {
    // 1. Accord Similarity (Cosine Similarity of Scent Profiles) - Weight: 50%
    let accordScore = 0;
    const prof1 = p1.scent_profile as Record<string, number> | null;
    const prof2 = p2.scent_profile as Record<string, number> | null;
    
    if (prof1 && prof2) {
      const keys = Array.from(new Set([...Object.keys(prof1), ...Object.keys(prof2)]));
      let dotProduct = 0;
      let mag1 = 0;
      let mag2 = 0;
      
      keys.forEach(k => {
        const v1 = prof1[k] || 0;
        const v2 = prof2[k] || 0;
        dotProduct += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
      });

      if (mag1 > 0 && mag2 > 0) {
        accordScore = dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
      }
    } else {
        // Fallback: Vibe Tag Overlap
        // PENALTY: Simple tag matching is imprecise. We cap the score.
        const vibes1 = p1.vibe_tags || [];
        const vibes2 = p2.vibe_tags || [];
        const sharedVibes = vibes1.filter(v => vibes2.includes(v));
        let rawScore = sharedVibes.length / Math.max(1, Math.max(vibes1.length, vibes2.length));
        
        // If we only matched on 1 or 2 generic tags, that's not a strong signal.
        if (sharedVibes.length < 3) rawScore *= 0.7; 
        
        accordScore = rawScore;
    }

    // 2. Ingredient Similarity (Jaccard Index of Notes) - Weight: 30%
    const notes1 = new Set((p1.perfume_notes || []).map(n => n.note?.name).filter(Boolean));
    const notes2 = new Set((p2.perfume_notes || []).map(n => n.note?.name).filter(Boolean));
    const intersection = new Set([...notes1].filter(x => notes2.has(x)));
    const union = new Set([...notes1, ...notes2]);
    const noteScore = union.size > 0 ? intersection.size / union.size : 0;

    // 3. Family Similarity - Weight: 20%
    const fam1 = p1.olfactory_family || [];
    const fam2 = p2.olfactory_family || [];
    const sharedFam = fam1.filter(f => fam2.includes(f));
    const familyScore = sharedFam.length > 0 ? 1 : 0;

    // Weighted Total
    return (accordScore * 60) + (noteScore * 20) + (familyScore * 20);
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
    let matches = candidates
      .filter(p => p.id !== mainPerfume.id)
      .map(candidate => {
        const cProfile = this.analyzeScentProfile(candidate);
        const result = scorer(candidate, cProfile);
        return result ? { ...result, perfume: candidate } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.score - a.score);

    // 2. Brand Diversity Filter (Max 1 per Brand)
    const seenBrands = new Set<string>();
    matches = matches.filter(match => {
        const brandName = match.perfume.brand?.name;
        if (!brandName) return true; // Keep if no brand (rare)
        if (seenBrands.has(brandName)) return false; // Skip if brand already seen (lower score)
        seenBrands.add(brandName);
        return true;
    });

    // 3. Map with Template Rotation
    return matches.slice(0, limit).map((match, index) => 
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
        // ABSOLUTE REQUIREMENT: Must be a true "Beast" (Rated 8+ out of 10)
        // If the rating is missing, we assume 5 (Moderate), so it fails this check.
        if ((candidate.longevity_rating || 5) < 8) return null;

        // Use Holistic Similarity as baseline (must be > 40 to be comparable)
        const similarity = this.calculateSimilarity(main, candidate);
        if (similarity < 40) return null;

        const longevityBoost = (candidate.longevity_rating || 5) - profile.longevity;
        const sillageBoost = (candidate.sillage_rating || 5) - profile.sillage;
        if ((longevityBoost + sillageBoost) < 1.5) return null;

        const sharedNotes = profile.allNoteNames.filter(n => cProfile.allNoteNames.includes(n));
        return { score: 80 + (similarity / 5), longevityBoost, sharedNotes };
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
        // Must have high Accord Similarity (share the "Vibe")
        const similarity = this.calculateSimilarity(main, candidate);
        // We want candidates that feel similar (accords) but have different notes or slightly different family focus
        if (similarity < 50) return null; 

        // Ensure distinct vibes to justify "Evolution"
        if (cProfile.dominantVibe === profile.dominantVibe) return null;

        // Find a hook (shared note)
        const hookNote = profile.allNoteNames.find(n => cProfile.allNoteNames.includes(n)) || 'the DNA';

        return { score: 75 + (similarity / 4), newVibe: cProfile.dominantVibe, hookNote };
      },
      // Mapper
      (match, template) => ({
        perfume: match.perfume, type: 'vibe_evolution', score: match.score,
        reason: template.replace('{note}', match.hookNote).replace('{vibe}', match.newVibe.toLowerCase()),
        sharedNotes: [match.hookNote], sharedVibes: [match.newVibe]
      }),
      // Templates
      [
        `Takes {note} you love, but dresses it up for a {vibe} setting.`,
        `Imagine the original, but rewritten for a {vibe} mood.`,
        `Same {note}, totally different {vibe} energy.`
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
    // New Logic: "Scent DNA" Similarity
    let candidates = all
      .filter(p => p.id !== main.id)
      .map(candidate => {
        const score = this.calculateSimilarity(main, candidate);
        return { candidate, score };
      })
      .filter(item => {
        if (item.score <= 50) return false;
        
        // STRICTER FILTER: Must have some note overlap or massive score
        const cProfile = this.analyzeScentProfile(item.candidate);
        const mainProfile = this.analyzeScentProfile(main);
        const sharedNotes = mainProfile.allNoteNames.filter(n => cProfile.allNoteNames.includes(n));
        
        // If low note overlap, require higher overall score (implies strong accord/family match)
        if (sharedNotes.length < 2 && item.score < 60) return false;
        
        return true;
      })
      .sort((a, b) => b.score - a.score);

    // Brand Diversity
    const seenBrands = new Set<string>();
    if (main.brand?.name) seenBrands.add(main.brand.name); // Optional: Exclude main brand from similars? No, let's allow it once but maybe not spam.
    // Actually user complaint was "3 from same brand". Let's just dedup the RESULTS.
    
    // Reset for filtering
    seenBrands.clear();
    candidates = candidates.filter(item => {
        const bName = item.candidate.brand?.name;
        if (!bName) return true;
        if (seenBrands.has(bName)) return false;
        seenBrands.add(bName);
        return true;
    });

    return candidates
      .slice(0, count)
      .map(item => {
         const cProfile = this.analyzeScentProfile(item.candidate);
         // Find shared aspects for the reason
         const mainProfile = this.analyzeScentProfile(main);
         const sharedNotes = mainProfile.allNoteNames.filter(n => cProfile.allNoteNames.includes(n));
         const sharedFam = mainProfile.families.filter(f => cProfile.families.includes(f));
         
         return {
          perfume: item.candidate, 
          type: 'similar' as const, 
          score: Math.min(99, Math.round(item.score)),
          reason: sharedFam.length > 0 
            ? `Matches the ${sharedFam[0]} profile with ${sharedNotes.length > 0 ? 'shared ' + sharedNotes.slice(0, 2).join(', ') : 'a similar vibe'}.`
            : `A close ${cProfile.dominantVibe} match with distinct character.`,
          sharedNotes: sharedNotes.slice(0, 3)
        };
      });
  }

  public static getDiscoveryRecommendations(main: PerfumeWithRelations, all: PerfumeWithRelations[], count = 6): Recommendation[] {
    // New Logic: "Hidden Gems" (Same Family, Lower Overlap)
    // We want things that feel right (Family/Vibe) but aren't clones.
    const mainProfile = this.analyzeScentProfile(main);

    let candidates = all
      .filter(p => p.id !== main.id)
      .map(candidate => {
        const score = this.calculateSimilarity(main, candidate);
        return { candidate, score };
      })
      .filter(item => {
        // "Discovery" Zone: Not a clone (>65), but not random (<40).
        // Plus, MUST share the family to be a valid discovery.
        const isFamily = item.candidate.olfactory_family?.some(f => mainProfile.families.includes(f));
        return item.score >= 40 && item.score <= 75 && isFamily;
      })
      .sort((a, b) => b.score - a.score);

    // Brand Diversity
    const seenBrands = new Set<string>();
    candidates = candidates.filter(item => {
        const bName = item.candidate.brand?.name;
        if (!bName) return true;
        if (seenBrands.has(bName)) return false;
        seenBrands.add(bName);
        return true;
    });

    return candidates
      .slice(0, count)
      .map(item => ({
          perfume: item.candidate, 
          type: 'discovery' as const, 
          score: Math.min(99, Math.round(item.score)),
          reason: `A unique twist on the ${mainProfile.families[0] || 'style'} you love.`,
          sharedFamilies: mainProfile.families
      }));
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

    // 4. The "Similar Vibe" (Core Recommendation)
    addCategory('similar', 'Similar Vibe', 'Fragrances that share the same DNA and character.',
      this.getSimilarRecommendations(mainPerfume, allPerfumes));

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
    // 1. Process all candidates to find the best alchemical matches
    const results = all
      .filter(p => p.id !== main.id)
      .map(candidate => {
        const mix = mixPerfumes(main, candidate);
        return {
          candidate,
          mix
        };
      })
      // 2. Filter for "Safe" & "Logical" matches only (User Preference: Safest)
      // We exclude 'CLASH' (Safety 45) and 'CONTRAST' (Safety 75) to ensure "no mess".
      // We prioritize: BRIDGE (95), BOOSTER (95), FIXER (90), BALANCE (80).
      .filter(item => ['BRIDGE', 'BOOSTER', 'FIXER', 'BALANCE'].includes(item.mix.narrative || ''))
      
      // 3. Sort by:
      //  a) Safety (Highest harmony first)
      //  b) Longevity (If harmony is equal, pick the one that boosts performance)
      .sort((a, b) => {
        const safetyDiff = b.mix.safety - a.mix.safety;
        if (safetyDiff !== 0) return safetyDiff;
        return (b.candidate.longevity_rating || 0) - (a.candidate.longevity_rating || 0);
      });

    // 4. Map to Recommendation Structure
    return results.slice(0, 10).map(item => ({
      perfume: item.candidate,
      type: 'layering',
      score: item.mix.safety,
      reason: item.mix.description,
      guidance: item.mix.mixingTips.join(' | '),
      resultingScent: {
        name: `${main.olfactory_family?.[0] || 'Base'} & ${item.candidate.olfactory_family?.[0] || 'Top'}`,
        family: 'Mixed',
        longevity: Math.max(main.longevity_rating || 5, item.candidate.longevity_rating || 5),
        sillage: Math.max(main.sillage_rating || 5, item.candidate.sillage_rating || 5),
        occasion: 'Custom',
        profile: item.mix.newProfile
      }
    }));
  }
}
