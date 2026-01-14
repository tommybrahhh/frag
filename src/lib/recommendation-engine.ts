import { createClient } from '@/lib/supabase';
import { mixPerfumes } from '@/lib/alchemy';
import { Database } from '@/types/database'; // Import Database type

// Define a type for Perfume with Brand and its Tier
type PerfumeWithBrandAndTier = Database['public']['Tables']['perfumes']['Row'] & {
  brand: (Database['public']['Tables']['brands']['Row'] & { tier: Database["public"]["Enums"]["brand_tier_type"] | null }) | null;
};

export interface Recommendation {
  perfume: PerfumeWithBrandAndTier;
  type: 'similar' | 'complementary' | 'same-brand' | 'seasonal' | 'price-alternative' | 'discovery' | 'dupe' | 'layer_amplify' | 'layer_add_dimension';
  score: number;
  reason: string;
  sharedNotes?: string[];
  sharedVibes?: string[];
  sharedFamilies?: string[];
  priceComparison?: 'cheaper' | 'similar' | 'premium';
  guidance?: string; // Field for structured layering instructions
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

// Enhanced scent family categorization with more detailed analysis
// Note volatility levels (1 = low, 3 = high)
const NOTE_VOLATILITY: Record<string, number> = {
  citrus: 3,
  bergamot: 3,
  lemon: 3,
  orange: 3,
  grapefruit: 3,
  mandarin: 3,
  lime: 3,
  rose: 2,
  jasmine: 2,
  lily: 2,
  orchid: 2,
  tuberose: 2,
  violet: 2,
  ylang: 2,
  peony: 2,
  lilac: 2,
  sandalwood: 1,
  cedar: 1,
  oak: 1,
  patchouli: 1,
  vetiver: 1,
  amber: 1,
  oud: 1,
  guaiac: 1,
  birch: 1,
  pepper: 3,
  cinnamon: 2,
  clove: 2,
  nutmeg: 2,
  cardamom: 2,
  ginger: 2,
  saffron: 2,
  cumin: 2,
  vanilla: 1,
  chocolate: 1,
  caramel: 1,
  coffee: 1,
  honey: 1,
  tonka: 1,
  praline: 1,
  almond: 1,
  mint: 3,
  green: 2,
  aquatic: 2,
  ozonic: 2,
  marine: 2,
  herbal: 2,
  grass: 2,
  tea: 2,
  resin: 1,
  benzoin: 1,
  labdanum: 1,
  myrrh: 1,
  berry: 3,
  apple: 3,
  pear: 3,
  peach: 3,
  plum: 3,
  mango: 3,
  pineapple: 3,
  leather: 1,
  suede: 1,
  'birch tar': 1,
  smoke: 1,
  musk: 1,
  civet: 1,
  castoreum: 1,
  ambergris: 1
};

const SCENT_FAMILIES = {
  citrus: ['lemon', 'bergamot', 'orange', 'grapefruit', 'mandarin', 'citrus', 'lime'],
  floral: ['rose', 'jasmine', 'lily', 'orchid', 'tuberose', 'violet', 'ylang', 'peony', 'lilac'],
  woody: ['sandalwood', 'cedar', 'oak', 'patchouli', 'vetiver', 'amber', 'oud', 'guaiac', 'birch'],
  spicy: ['pepper', 'cinnamon', 'clove', 'nutmeg', 'cardamom', 'ginger', 'saffron', 'cumin'],
  gourmand: ['vanilla', 'chocolate', 'caramel', 'coffee', 'honey', 'tonka', 'praline', 'almond'],
  fresh: ['mint', 'green', 'aquatic', 'ozonic', 'marine', 'herbal', 'grass', 'tea'],
  oriental: ['amber', 'resin', 'incense', 'benzoin', 'labdanum', 'myrrh'],
  fruity: ['berry', 'apple', 'pear', 'peach', 'plum', 'mango', 'pineapple'],
  leather: ['leather', 'suede', 'birch tar', 'smoke'],
  animalic: ['musk', 'civet', 'castoreum', 'ambergris']
};

export class RecommendationEngine {
  // Molecular structure similarity scoring
  private static calculateMolecularSimilarity(mainStructure: string, candidateStructure: string): number {
    if (!mainStructure || !candidateStructure) return 0;
    
    // Basic similarity scoring based on molecular fingerprints
    const mainFingerprint = this.getMolecularFingerprint(mainStructure);
    const candidateFingerprint = this.getMolecularFingerprint(candidateStructure);
    
    const intersection = mainFingerprint.filter((value: string) => candidateFingerprint.includes(value)).length;
    const union = new Set([...mainFingerprint, ...candidateFingerprint]).size;
    
    return union > 0 ? Math.round((intersection / union) * 100) : 0;
  }

  // Helper method to generate molecular fingerprints
  private static getMolecularFingerprint(structure: string): string[] {
    // Basic implementation - should be enhanced with actual molecular analysis
    return structure.split('-').filter(part => part.length > 0);
  }

  // Calculate composition similarity based on top/heart/base notes
  private static calculateCompositionSimilarity(
    main: { topNotes: string[], heartNotes: string[], baseNotes: string[] },
    candidate: { topNotes: string[], heartNotes: string[], baseNotes: string[] }
  ): number {
    const topNoteSimilarity = main.topNotes.filter((n: string) => candidate.topNotes.includes(n)).length / Math.max(1, main.topNotes.length);
    const heartNoteSimilarity = main.heartNotes.filter((n: string) => candidate.heartNotes.includes(n)).length / Math.max(1, main.heartNotes.length);
    const baseNoteSimilarity = main.baseNotes.filter((n: string) => candidate.baseNotes.includes(n)).length / Math.max(1, main.baseNotes.length);
    
    // Weighted average favoring heart and base notes
    return Math.round((
      (topNoteSimilarity * 0.3) +
      (heartNoteSimilarity * 0.4) +
      (baseNoteSimilarity * 0.3)
    ) * 100);
  }

  // Calculate composition complementarity based on note volatility
  private static calculateCompositionComplementarity(
    main: { topNotes: string[], heartNotes: string[], baseNotes: string[] },
    candidate: { topNotes: string[], heartNotes: string[], baseNotes: string[] }
  ): number {
    // Score based on complementary note volatility
    const topNoteComplementarity = main.topNotes.filter((n: string) =>
      !candidate.topNotes.includes(n) &&
      NOTE_VOLATILITY[n] >= 2.5
    ).length * 3;
    
    const heartNoteComplementarity = main.heartNotes.filter((n: string) =>
      !candidate.heartNotes.includes(n) &&
      NOTE_VOLATILITY[n] >= 1.5 && NOTE_VOLATILITY[n] < 2.5
    ).length * 5;
    
    const baseNoteComplementarity = main.baseNotes.filter((n: string) =>
      !candidate.baseNotes.includes(n) &&
      NOTE_VOLATILITY[n] < 1.5
    ).length * 7;
    
    return Math.min(100,
      topNoteComplementarity +
      heartNoteComplementarity +
      baseNoteComplementarity
    );
  }

  public static async getAllPerfumes(supabaseClient?: any, limit: number = 10000) {
    const supabase = supabaseClient || createClient();
    const { data: perfumes, error } = await supabase
      .from('perfumes')
      .select(`
        id, name, slug, image_url, rating, vibe_tags, price_tier, best_season,
        longevity_rating, sillage_rating, olfactory_family,
        brand:brands(name, tier),
        perfume_notes(type, note:notes(name, color_hex))
      `)
      .limit(limit);

    if (error) {
        console.error('Error fetching all perfumes:', error);
    }

    return perfumes || [];
  }

  // Helper to convert price_tier string to numerical value
  private static getPriceLevel(perfume: PerfumeWithBrandAndTier): number {
    if (typeof perfume.price_tier === 'number') return perfume.price_tier;
    if (typeof perfume.price_tier === 'string') return perfume.price_tier.length; // "$$$" -> 3
    return 3; // Default
  }

  // Helper to create a "virtual" perfume representing the user's collection
  public static createCompositeProfile(collection: any[]) {
    if (!collection || collection.length === 0) return null;

    const familyCounts: Record<string, number> = {};
    const vibeCounts: Record<string, number> = {};
    const noteCounts: Record<string, number> = {};
    const seasonCounts: Record<string, number> = {};

    collection.forEach(p => {
        // Families
        p.olfactory_family?.forEach((f: string) => {
            familyCounts[f] = (familyCounts[f] || 0) + 1;
        });
        // Vibes
        p.vibe_tags?.forEach((v: string) => {
            vibeCounts[v] = (vibeCounts[v] || 0) + 1;
        });
        // Notes (handling the nested structure)
        p.perfume_notes?.forEach((pn: any) => {
            const nName = pn.note?.name;
            if (nName) noteCounts[nName] = (noteCounts[nName] || 0) + 1;
        });
        // Seasons
        p.best_season?.forEach((s: string) => {
            seasonCounts[s] = (seasonCounts[s] || 0) + 1;
        });
    });

    const getTop = (counts: Record<string, number>, limit: number) => 
        Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(e => e[0]);

    const topFamilies = getTop(familyCounts, 3);
    const topVibes = getTop(vibeCounts, 5);
    const topNotes = getTop(noteCounts, 15);
    const topSeasons = getTop(seasonCounts, 2);

    // Return a structure matching the 'perfume' expected by analyzeScentProfile
    return {
        id: 'user-profile',
        name: 'User Taste Profile',
        olfactory_family: topFamilies,
        vibe_tags: topVibes,
        best_season: topSeasons,
        perfume_notes: topNotes.map(nName => ({
            note: { name: nName }
        })),
        brand: { name: 'Composite' }
    };
  }

  // Enhanced note analysis with volatility scoring
  public static analyzeScentProfile(perfume: any) {
    const notes = perfume.perfume_notes?.map((n: any) => n.note?.name?.toLowerCase()) || [];
    const vibes = perfume.vibe_tags || [];

    const familyScores: Record<string, number> = {};
    const noteVolatility: Record<string, number> = {};

    // Score based on notes with volatility weighting
    notes.forEach((note: string) => {
      // Get volatility score for this note (default to 1 if not found)
      const volatility = NOTE_VOLATILITY[note] || 1;
      noteVolatility[note] = volatility;

      // Score families based on note volatility
      for (const [family, keywords] of Object.entries(SCENT_FAMILIES)) {
        if (keywords.some(keyword => note.includes(keyword))) {
          familyScores[family] = (familyScores[family] || 0) + (2 * volatility);
        }
      }
    });

    // Score based on vibe tags
    vibes.forEach((vibe: string) => {
      const vibeLower = vibe.toLowerCase();
      for (const [family, keywords] of Object.entries(SCENT_FAMILIES)) {
        if (keywords.some(keyword => vibeLower.includes(keyword))) {
          familyScores[family] = (familyScores[family] || 0) + 1;
        }
      }
    });

    // Get dominant families: Prioritize explicit DB column, fallback to calculated scores
    let dominantFamilies: string[] = [];
    
    if (perfume.olfactory_family && Array.isArray(perfume.olfactory_family) && perfume.olfactory_family.length > 0) {
      dominantFamilies = perfume.olfactory_family;
    } else {
      dominantFamilies = Object.entries(familyScores)
        .filter(([_, score]) => score >= 2)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([family]) => family);
    }

    // Analyze olfactory composition
    const composition = {
      topNotes: notes.filter((n: string) => NOTE_VOLATILITY[n] >= 2.5),
      heartNotes: notes.filter((n: string) => NOTE_VOLATILITY[n] >= 1.5 && NOTE_VOLATILITY[n] < 2.5),
      baseNotes: notes.filter((n: string) => NOTE_VOLATILITY[n] < 1.5),
      intensity: Math.round(Object.values(noteVolatility).reduce((a, b) => a + b, 0) / notes.length * 10) / 10 || 1,
      longevity: Math.round((1 - (Object.values(noteVolatility).reduce((a, b) => a + b, 0) / notes.length / 3)) * 10) / 10 || 1
    };

    return {
      dominantFamilies,
      notes,
      vibes,
      noteVolatility,
      overallVolatility: Object.values(noteVolatility).reduce((a, b) => a + b, 0) / notes.length || 1,
      composition
    };
  }

  // Similar scent profile recommendations
  public static getSimilarRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 6): Recommendation[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    
    // Calculate maximum possible score for normalization
    const maxNotesScore = mainProfile.notes.length * 15;
    const maxVibesScore = mainProfile.vibes.length * 10;
    const maxFamiliesScore = mainProfile.dominantFamilies.length * 25;
    const maxSeasonsScore = mainPerfume.best_season?.length * 8 || 0;
    const maxPriceBonus = 30; // Max possible bonus for being significantly cheaper
    const maxBrandTierBonus = 20; // Max possible bonus for a good tier match

    const maxPossibleScore = maxNotesScore + maxVibesScore + maxFamiliesScore + maxSeasonsScore + maxPriceBonus + maxBrandTierBonus;

    const sortedCandidates = allPerfumes
        .filter(p => p.id !== mainPerfume.id)
        // REMOVED: Strict pre-filter that caused empty recommendation lists.
        // All perfumes will now be scored, and those with low scores will naturally rank lower.
        .map(candidate => {
            const candidateProfile = RecommendationEngine.analyzeScentProfile(candidate);

            // Calculate raw similarity score
            let rawScore = 0;
            const sharedNotes = mainProfile.notes.filter((note: string) => candidateProfile.notes.includes(note));
            const sharedVibes = mainProfile.vibes.filter((vibe: string) => candidateProfile.vibes.includes(vibe));
            const sharedFamilies = mainProfile.dominantFamilies.filter(family =>
                candidateProfile.dominantFamilies.includes(family)
            );

            // Give a minimum score for having at least one shared note or family, to avoid zero scores for everything.
            if (sharedNotes.length === 0 && sharedFamilies.length === 0) {
              return {
                perfume: candidate,
                type: 'similar' as const,
                score: 0,
                reason: 'A different profile to explore.',
                sharedNotes: [],
                sharedVibes: []
              };
            }

            rawScore += sharedNotes.length * 15;
            rawScore += sharedVibes.length * 10;
            rawScore += sharedFamilies.length * 25;

            // Season compatibility
            const sharedSeasons = mainPerfume.best_season?.filter((s: string) =>
                candidate.best_season?.includes(s)
            ) || [];
            rawScore += sharedSeasons.length * 8;

            // Price and Brand Tier Scoring
            const mainPriceValue = RecommendationEngine.getPriceLevel(mainPerfume);
            const candidatePriceValue = RecommendationEngine.getPriceLevel(candidate);
            let priceScoreModifier = 0;

            if (candidatePriceValue < mainPriceValue) {
                priceScoreModifier += (mainPriceValue - candidatePriceValue) * 10;
            } else if (candidatePriceValue > mainPriceValue) {
                priceScoreModifier -= (candidatePriceValue - mainPriceValue) * 5;
            }
            rawScore += priceScoreModifier;

            let brandTierScoreModifier = 0;
            const mainBrandTier = mainPerfume.brand?.tier;
            const candidateBrandTier = candidate.brand?.tier;

            if (mainBrandTier && candidateBrandTier) {
                if (mainBrandTier === candidateBrandTier) {
                    brandTierScoreModifier += 5;
                } else if (mainBrandTier === 'Niche' && candidateBrandTier === 'Designer' && candidatePriceValue < mainPriceValue) {
                    brandTierScoreModifier += 15;
                } else if (mainBrandTier === 'Designer' && candidateBrandTier === 'Niche' && candidatePriceValue > mainPriceValue) {
                    brandTierScoreModifier -= 10;
                } else if (candidateBrandTier === 'Celebrity') {
                    brandTierScoreModifier -= 5;
                }
            }
            rawScore += brandTierScoreModifier;

            // Normalize score to 0-100 scale
            // The normalization is now safer because maxPossibleScore is less likely to be zero.
            const normalizedScore = maxPossibleScore > 0 
                ? Math.min(100, Math.round((rawScore / maxPossibleScore) * 100))
                : 0;

            // NEW: Create a more descriptive reason for the recommendation.
            const reasonParts = [];
            if (sharedFamilies.length > 0) {
                // Capitalize the family name for better display
                const familyName = sharedFamilies[0].charAt(0).toUpperCase() + sharedFamilies[0].slice(1);
                reasonParts.push(`the ${familyName} family`);
            }
            if (sharedNotes.length > 1) { // Only add notes if there's more than one to show
                reasonParts.push(`notes like ${sharedNotes.slice(0, 2).join(', ')}`);
            }

            let reason = 'It has a similar vibe profile.';
            if (reasonParts.length > 0) {
                reason = `You might like this as it shares ${reasonParts.join(' and ')}.`;
            }

            return {
                perfume: candidate,
                type: 'similar' as const,
                score: Math.max(0, normalizedScore),
                reason: reason,
                sharedNotes: sharedNotes.slice(0, 5),
                sharedVibes: sharedVibes.slice(0, 3)
            };
        })
        .sort((a, b) => b.score - a.score);

    const finalRecommendations: Recommendation[] = [];
    const mainPerfumeBrandName = mainPerfume.brand?.name;
    let sameBrandCount = 0;
    const sameBrandLimit = 2;

    for (const rec of sortedCandidates) {
        if (finalRecommendations.length >= count) {
            break;
        }

        if (rec.perfume.brand?.name === mainPerfumeBrandName) {
            if (sameBrandCount < sameBrandLimit) {
                finalRecommendations.push(rec);
                sameBrandCount++;
            }
        } else {
            finalRecommendations.push(rec);
        }
    }

    return finalRecommendations.slice(0, count);
  }
  private static getLayeringRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 3): Recommendation[] {
    const amplifyRecs = this.getAmplifyNoteRecommendations(mainPerfume, allPerfumes, 2);
    const dimensionRecs = this.getAddDimensionRecommendations(mainPerfume, allPerfumes, 2);

    // Combine and return a diverse set of recommendations
    // Prioritize having at least one of each if possible
    const finalRecs: Recommendation[] = [];
    if (amplifyRecs.length > 0) finalRecs.push(amplifyRecs[0]);
    if (dimensionRecs.length > 0) finalRecs.push(dimensionRecs[0]);
    if (amplifyRecs.length > 1) finalRecs.push(amplifyRecs[1]);
    
    return finalRecs.slice(0, count);
  }

  private static _createLayeringRecommendation(mainPerfume: any, candidate: any, goal: 'amplify' | 'dimension'): Recommendation {
    const mix = mixPerfumes(mainPerfume, candidate);

    // 1. Determine Resulting Family
    const profileEntries = Object.entries(mix.newProfile);
    const dominantTrait = profileEntries.sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
    const resultingFamily = dominantTrait.charAt(0).toUpperCase() + dominantTrait.slice(1);

    // 2. Estimate Performance
    const avgLongevity = ((mainPerfume.longevity_rating || 5) + (candidate.longevity_rating || 5)) / 2;
    const avgSillage = ((mainPerfume.sillage_rating || 5) + (candidate.sillage_rating || 5)) / 2;
    // Layering often enhances performance slightly
    const resultingLongevity = Math.min(10, avgLongevity + 1);
    const resultingSillage = Math.min(10, avgSillage + 1);

    // 3. Suggest Occasion
    let occasion = 'Anytime, Anywhere';
    if (mix.newProfile.spicy > 6 || mix.newProfile.depth > 6) {
      occasion = 'Evening Wear';
    } else if (mix.newProfile.fresh > 6 || mix.newProfile.floral > 6) {
      occasion = 'Daytime Casual';
    } else if (mix.newProfile.woody > 6) {
      occasion = 'Office & Formal';
    }

    // 4. Create Name
    const mainFamily = mainPerfume.olfactory_family?.[0] || 'Scent';
    const candidateFamily = candidate.olfactory_family?.[0] || 'Aroma';
    const creativeName = goal === 'amplify'
      ? `${mainFamily} Intense`
      : `${mainFamily} & ${candidateFamily}`;

    return {
      perfume: candidate,
      type: goal === 'amplify' ? 'layer_amplify' : 'layer_add_dimension',
      score: mix.safety,
      reason: mix.description,
      guidance: mix.mixingTips.join(' | '),
      resultingScent: {
        name: creativeName,
        family: resultingFamily,
        longevity: resultingLongevity,
        sillage: resultingSillage,
        occasion: occasion,
        profile: mix.newProfile,
      }
    };
  }

  private static getAmplifyNoteRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 2): Recommendation[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    const keyNotes = mainProfile.notes.slice(0, 5); // Focus on the top 5 most prominent notes

    return allPerfumes
      .filter(p => p.id !== mainPerfume.id)
      .map(candidate => {
        const candidateProfile = this.analyzeScentProfile(candidate);
        const sharedNotes = keyNotes.filter((note: string) => candidateProfile.notes.includes(note));
        
        // Score based on shared notes and overall similarity
        let score = 0;
        if (sharedNotes.length > 0) {
          score = 60 + (sharedNotes.length * 20); // High base score for sharing a key note
        } else {
          return null; // Must share at least one key note
        }
        
        const sharedVibes = mainProfile.vibes.filter((vibe: string) => candidateProfile.vibes.includes(vibe));
        score += sharedVibes.length * 5;

        return { perfume: candidate, score };
      })
      .filter(rec => rec !== null)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, count)
      .map(rec => this._createLayeringRecommendation(mainPerfume, rec!.perfume, 'amplify'));
  }

  private static getAddDimensionRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 2): Recommendation[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    const mainFamilies = mainProfile.dominantFamilies;
    
    // Families known to add interesting dimensions
    const dimensionFamilies = ['Smoky', 'Leather', 'Spicy', 'Aquatic', 'Green', 'Gourmand'];

    return allPerfumes
      .filter(p => {
        if (p.id === mainPerfume.id) return false;
        const candidateProfile = this.analyzeScentProfile(p);
        const candidateFamilies = candidateProfile.dominantFamilies;
        
        // Must not share dominant families
        if (mainFamilies.some(mf => candidateFamilies.includes(mf))) return false;
        
        // Must belong to one of the "dimension" families
        return candidateFamilies.some(cf => dimensionFamilies.includes(cf));
      })
      .map(candidate => {
         const mix = mixPerfumes(mainPerfume, candidate);
         // Score is based on the harmony score from the mix
         return { perfume: candidate, score: mix.safety };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(rec => this._createLayeringRecommendation(mainPerfume, rec.perfume, 'dimension'));
  }

  // Price tier alternatives with scent similarity matching
  private static getPriceAlternatives(mainPerfume: any, allPerfumes: any[], count: number = 6): Recommendation[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    
    const getPriceLevel = (p: any) => {
        if (typeof p.price_tier === 'number') return p.price_tier;
        if (typeof p.price_tier === 'string') return p.price_tier.length; // "$$$" -> 3
        return 3;
    };

    const mainPriceValue = getPriceLevel(mainPerfume);
    
    return allPerfumes
      .filter(p => p.id !== mainPerfume.id)
      .map(candidate => {
        const candidateProfile = this.analyzeScentProfile(candidate);
        const candidatePriceValue = getPriceLevel(candidate);

        // Calculate scent similarity score (0-100)
        const sharedNotes = mainProfile.notes.filter((note: string) =>
          candidateProfile.notes.includes(note)
        );
        const sharedVibes = mainProfile.vibes.filter((vibe: string) =>
          candidateProfile.vibes.includes(vibe)
        );
        const sharedFamilies = mainProfile.dominantFamilies.filter((family: string) =>
          candidateProfile.dominantFamilies.includes(family)
        );

        // Base similarity score (0-100)
        let similarityScore = 0;
        similarityScore += sharedNotes.length * 10; // Up to 50 points for notes
        similarityScore += sharedVibes.length * 15; // Up to 45 points for vibes
        similarityScore += sharedFamilies.length * 25; // Up to 75 points for families
        similarityScore = Math.min(100, similarityScore);

        // Determine price comparison
        let priceComparison: 'cheaper' | 'similar' | 'premium' = 'similar';
        if (candidatePriceValue < mainPriceValue - 1) priceComparison = 'cheaper';
        else if (candidatePriceValue > mainPriceValue + 1) priceComparison = 'premium';

        // Enhanced scoring: combine price advantage with scent similarity
        let finalScore = 0;
        let reason = '';

        if (priceComparison === 'cheaper') {
          // For cheaper alternatives: prioritize good scent matches (min 30% similarity)
          if (similarityScore >= 30) {
            finalScore = Math.min(95, 70 + Math.round(similarityScore * 0.5));
            reason = `Excellent affordable alternative (${finalScore}% match)`;
          } else {
            // Skip perfumes with very low similarity
            return null;
          }
        } else if (priceComparison === 'premium') {
          // For premium alternatives: require higher scent similarity (min 40%)
          if (similarityScore >= 40) {
            finalScore = Math.min(90, 60 + Math.round(similarityScore * 0.6));
            reason = `Premium upgrade (${finalScore}% match)`;
          } else {
            return null;
          }
        } else {
          // Similar price: require good scent similarity (min 35%)
          if (similarityScore >= 35) {
            finalScore = Math.min(85, 50 + Math.round(similarityScore * 0.7));
            reason = `Similar price (${finalScore}% match)`;
          } else {
            return null;
          }
        }

        return {
          perfume: candidate,
          type: 'price-alternative' as const,
          score: finalScore,
          reason,
          priceComparison,
          sharedNotes: sharedNotes.slice(0, 3),
          sharedVibes: sharedVibes.slice(0, 2)
        };
      })
      .filter(rec => rec !== null)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, count) as Recommendation[];
  }



  // Same brand alternatives
  // Same brand alternatives
  private static getSameBrandRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 4): Recommendation[] {
    const mainBrand = mainPerfume.brand?.name;
    if (!mainBrand) return [];

    return allPerfumes
      .filter(p => p.id !== mainPerfume.id && p.brand?.name === mainBrand)
      .map(candidate => ({
        perfume: candidate,
        type: 'same-brand' as const,
        score: 0, // No percentage score needed
        reason: '',
        sharedVibes: mainPerfume.vibe_tags?.filter((v: string) =>
          candidate.vibe_tags?.includes(v)
        )?.slice(0, 3) || []
      }))
      .slice(0, count);
  }

  // Seasonal alternatives grouped by season
  private static getSeasonalRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 6): Recommendation[] {
    const mainSeasons: string[] = mainPerfume.best_season || [];
    if (mainSeasons.length === 0) return [];

    // Group perfumes by season
    const seasonalGroups: Record<string, any[]> = {};
    
    mainSeasons.forEach((season: string) => {
      seasonalGroups[season] = allPerfumes
        .filter((p: any) => p.id !== mainPerfume.id && p.best_season?.includes(season))
        .slice(0, 3); // Limit to 3 perfumes per season
    });

    // Flatten and format recommendations
    const recommendations: Recommendation[] = [];
    
    Object.entries(seasonalGroups).forEach(([season, perfumes]) => {
      perfumes.forEach((perfume: any) => {
        recommendations.push({
          perfume,
          type: 'seasonal' as const,
          score: 0, // No percentage score
          reason: season, // Use season as reason for grouping
          sharedVibes: mainPerfume.vibe_tags?.filter((v: string) =>
            perfume.vibe_tags?.includes(v)
          )?.slice(0, 2) || []
        });
      });
    });

    return recommendations.slice(0, count);
  }



  private static readonly SCENT_PATHWAYS: Record<string, string[]> = {
    'Citrus': ['Woody', 'Aromatic', 'Fresh'],
    'Floral': ['Spicy', 'Fruity', 'Oriental', 'Woody'],
    'Woody': ['Leather', 'Oriental', 'Spicy', 'Aromatic'],
    'Spicy': ['Oriental', 'Woody', 'Gourmand', 'Amber'],
    'Gourmand': ['Oriental', 'Spicy', 'Fruity', 'Woody'],
    'Fresh': ['Citrus', 'Aquatic', 'Green', 'Aromatic'],
    'Oriental': ['Gourmand', 'Woody', 'Floral', 'Amber'],
    'Fruity': ['Floral', 'Gourmand', 'Citrus'],
    'Aromatic': ['Woody', 'Fresh', 'Citrus'],
    'Leather': ['Woody', 'Smoky', 'Spicy'],
    'Amber': ['Oriental', 'Spicy', 'Gourmand'],
    'Aquatic': ['Fresh', 'Citrus', 'Green'],
    'Green': ['Fresh', 'Woody', 'Aromatic'],
  };

  public static getDiscoveryRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 1): Recommendation[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    const mainFamily = mainProfile.dominantFamilies[0];

    let discoveryRecs: Recommendation[] = [];

    // --- Primary Logic: Scent Pathways ---
    if (mainFamily && this.SCENT_PATHWAYS[mainFamily]) {
      const pathwayFamilies = this.SCENT_PATHWAYS[mainFamily];
      
      const candidates = allPerfumes
        .filter(p => {
          if (p.id === mainPerfume.id) return false;
          const candidateProfile = this.analyzeScentProfile(p);
          const candidateFamily = candidateProfile.dominantFamilies[0];
          
          return pathwayFamilies.includes(candidateFamily) && candidateFamily !== mainFamily;
        })
        .map(candidate => {
          const sharedVibes = mainProfile.vibes.filter((v: string) => candidate.vibe_tags?.includes(v));
          const score = 40 + ((candidate.rating || 3.5) * 10) + (sharedVibes.length * 15);
          return { perfume: candidate, score, sharedVibes };
        })
        .sort((a, b) => b.score - a.score);

      if (candidates.length > 0) {
        const bestCandidate = candidates[0];
        const candidatePerfume = bestCandidate.perfume;
        const candidateProfile = this.analyzeScentProfile(candidatePerfume);
        const candidateFamily = candidateProfile.dominantFamilies[0] || 'new';
        const bridge = bestCandidate.sharedVibes.length > 0 
          ? `the '${bestCandidate.sharedVibes[0]}' character you enjoy` 
          : `a similar sensibility`;

        const reason = `Because you love the ${mainFamily.toLowerCase()} nature of ${mainPerfume.name}, you're perfectly positioned to explore its ${candidateFamily.toLowerCase()} counterpart. ${candidatePerfume.name} takes ${bridge} and introduces a fascinating new dimension.`;
        
        discoveryRecs.push({
            perfume: candidatePerfume,
            type: 'discovery',
            score: Math.min(99, Math.round(bestCandidate.score)),
            reason: reason,
            sharedVibes: bestCandidate.sharedVibes
        });
      }
    }

    // --- Fallback Logic ---
    if (discoveryRecs.length === 0) {
      const fallbackCandidates = allPerfumes
        .filter(p => p.id !== mainPerfume.id)
        .map(candidate => {
          const candidateProfile = this.analyzeScentProfile(candidate);
          const newFamilies = candidateProfile.dominantFamilies.filter(f => !mainProfile.dominantFamilies.includes(f));
          if (newFamilies.length === 0) return null;

          const sharedVibes = mainProfile.vibes.filter((v: string) => candidate.vibe_tags?.includes(v));
          const score = 50 + (newFamilies.length * 10) + (sharedVibes.length * 5);
          return { perfume: candidate, score, sharedVibes, newFamilies };
        })
        .filter(c => c !== null)
        .sort((a, b) => b!.score - a!.score);

      if (fallbackCandidates.length > 0) {
        const bestFallback = fallbackCandidates[0]!;
        const reason = `For a completely new experience, try exploring the world of ${bestFallback.newFamilies[0]} fragrances. It's a step in a new direction that might surprise you.`;
        
        discoveryRecs.push({
            perfume: bestFallback.perfume,
            type: 'discovery',
            score: Math.min(99, Math.round(bestFallback.score)),
            reason: reason,
            sharedVibes: bestFallback.sharedVibes
        });
      }
    }

    return discoveryRecs.slice(0, count);
  }


  // Add inside RecommendationEngine class
  private static getDupeRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 4): Recommendation[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    
    const getPriceLevel = (p: any) => {
        if (typeof p.price_tier === 'number') return p.price_tier;
        if (typeof p.price_tier === 'string') return p.price_tier.length; // "$$$" -> 3
        return 3;
    };

    const mainPrice = getPriceLevel(mainPerfume);

    return allPerfumes
      .filter(p => {
        // 1. Must be significantly cheaper (at least 1 tier lower)
        const candidatePrice = getPriceLevel(p);
        return candidatePrice < mainPrice && p.id !== mainPerfume.id;
      })
      .map(candidate => {
        const candidateProfile = this.analyzeScentProfile(candidate);
        
        // 2. Calculate Similarity
        const sharedNotes = mainProfile.notes.filter((n: string) => candidateProfile.notes.includes(n));
        const sharedVibes = mainProfile.vibes.filter((v: string) => candidateProfile.vibes.includes(v));
        const sharedFamilies = mainProfile.dominantFamilies.filter(f => candidateProfile.dominantFamilies.includes(f));
        
        // Calculate Score
        let score = 0;
        score += sharedNotes.length * 15;
        score += sharedVibes.length * 10;
        score += sharedFamilies.length * 25;
        const maxScore = (mainProfile.notes.length * 15) + (mainProfile.vibes.length * 10) + 75; // Approx max
        const percentMatch = Math.min(100, Math.round((score / maxScore) * 100));

        // 3. Looser Filter: Must be at least a 60% match to be considered a "Smart Buy"
        if (percentMatch < 60) return null;

        // 4. Calculate Trade-offs (The Educational Part)
        const mainLong = mainPerfume.longevity_rating || mainProfile.composition.longevity;
        const candLong = candidate.longevity_rating || candidateProfile.composition.longevity;
        const longDiff = mainLong - candLong;
        let longevityText = "Similar longevity";
        if (longDiff > 1.5) longevityText = "Fades faster (expect frequent re-application)";
        else if (longDiff > 0.5) longevityText = "Moderate longevity compared to original";

        const missingNotes = mainProfile.notes.filter((n: string) => !candidateProfile.notes.includes(n));
        const complexityDiff = mainProfile.notes.length - candidateProfile.notes.length;
        const complexity = complexityDiff > 2 ? 'lower' : 'similar';

        return {
          perfume: candidate,
          type: 'dupe' as const,
          score: percentMatch,
          reason: `High similarity (${percentMatch}%) alternative`,
          priceComparison: 'cheaper',
          sharedNotes: sharedNotes.slice(0, 5),
          tradeOffs: {
            longevityDiff: longevityText,
            missingNotes: missingNotes.slice(0, 3), // Show top 3 missing notes
            complexity: complexity,
            savings: mainPrice - getPriceLevel(candidate) // Tier difference
          }
        };
      })
      .filter(rec => rec !== null) // Remove failed matches
      .sort((a, b) => b!.score - a!.score) // Best matches first
      .slice(0, count) as Recommendation[];
  }


  private static applyUserPreferences(recommendations: Recommendation[], preferences: any): Recommendation[] {
    if (!preferences) return recommendations;

    return recommendations.map(rec => {
      let weight = 1.0;

      // Apply weight based on scent families
      if (preferences.preferredFamilies && rec.sharedFamilies) {
        const familyMatches = rec.sharedFamilies.filter(family =>
          preferences.preferredFamilies.includes(family)
        ).length;
        weight *= 1 + (familyMatches * 0.2);
      }

      // Apply weight based on preferred notes
      if (preferences.preferredNotes && rec.sharedNotes) {
        const noteMatches = rec.sharedNotes.filter(note =>
          preferences.preferredNotes.includes(note)
        ).length;
        weight *= 1 + (noteMatches * 0.15);
      }

      // Apply weight based on preferred price tiers
      if (preferences.preferredPriceTier && rec.priceComparison) {
        if (preferences.preferredPriceTier === 'cheaper' && rec.priceComparison === 'cheaper') {
          weight *= 1.3;
        } else if (preferences.preferredPriceTier === 'premium' && rec.priceComparison === 'premium') {
          weight *= 1.4;
        } else if (preferences.preferredPriceTier === 'similar' && rec.priceComparison === 'similar') {
          weight *= 1.2;
        }
      }

      return {
        ...rec,
        score: Math.min(100, Math.round(rec.score * weight))
      };
    });
  }

  public static getEnhancedRecommendations(mainPerfume: any, allPerfumes: any[], preferences?: any): RecommendationCategory[] {
    const baseRecs = this.getSimilarRecommendations(mainPerfume, allPerfumes, 80);
    
    // 1. Signature Match: Merges DNA (Family) and Story (Vibe)
    const signatureCategory = this.getSignatureCategory(mainPerfume, baseRecs);

    // 2. Moment: Occasion & Time
    const momentCategory = this.getMomentCategory(mainPerfume, baseRecs);

    const categories: RecommendationCategory[] = [];

    if (signatureCategory) categories.push(signatureCategory);
    if (momentCategory) categories.push(momentCategory);

    // 3. Special Categories
    categories.push({
      type: 'layering',
      title: 'Layering Combinations',
      description: 'Create a unique signature by mixing these scents.',
      recommendations: this.getLayeringRecommendations(mainPerfume, allPerfumes, 3)
    });

    categories.push({
        type: 'discovery',
        title: 'Wildcard',
        description: 'Something different, yet familiar.',
        recommendations: this.getDiscoveryRecommendations(mainPerfume, allPerfumes, 1) 
    });

    return categories;
  }

  private static getSignatureCategory(mainPerfume: any, recommendations: Recommendation[]): RecommendationCategory | null {
    const mainFamily = mainPerfume.olfactory_family?.[0];
    const mainVibe = mainPerfume.vibe_tags?.[0];

    if (!mainFamily && !mainVibe) return null;

    // Filter for perfumes that capture BOTH the DNA and the Vibe where possible
    const matches = recommendations.filter(rec => {
        const hasFamily = mainFamily ? rec.perfume.olfactory_family?.includes(mainFamily) : false;
        const hasVibe = mainVibe ? rec.sharedVibes?.includes(mainVibe) : false;
        
        // Include if it matches either, but we sort by intersection below
        return hasFamily || hasVibe;
    });

    // Sort priority:
    // 1. Matches BOTH Family & Vibe
    // 2. Matches Family
    // 3. Matches Vibe
    const sorted = matches.sort((a, b) => {
        const aFamily = mainFamily ? a.perfume.olfactory_family?.includes(mainFamily) : false;
        const aVibe = mainVibe ? a.sharedVibes?.includes(mainVibe) : false;
        const bFamily = mainFamily ? b.perfume.olfactory_family?.includes(mainFamily) : false;
        const bVibe = mainVibe ? b.sharedVibes?.includes(mainVibe) : false;

        const aScore = (aFamily ? 2 : 0) + (aVibe ? 1 : 0);
        const bScore = (bFamily ? 2 : 0) + (bVibe ? 1 : 0);

        return bScore - aScore || b.score - a.score;
    }).slice(0, 18);

    if (sorted.length === 0) return null;

    let title = "Perfect Match";
    if (mainFamily && mainVibe) {
        title = `The ${mainVibe} ${mainFamily} Edit`;
    } else if (mainFamily) {
        title = `Best of ${mainFamily}`;
    } else if (mainVibe) {
        title = `The ${mainVibe} Collection`;
    }

    return {
        type: 'signature',
        title: title,
        description: `Fragrances that capture the ${mainVibe?.toLowerCase() || ''} soul and ${mainFamily?.toLowerCase() || ''} DNA you love.`,
        recommendations: sorted
    };
  }

  private static getMomentCategory(mainPerfume: any, recommendations: Recommendation[]): RecommendationCategory | null {
    const bestTime = mainPerfume.best_time; // e.g., "Day", "Night"
    const occasions = mainPerfume.occasions || []; // e.g., ["Date", "Office"]

    if (!bestTime && occasions.length === 0) return null;

    const momentRecs = recommendations
        .filter(rec => {
            const p = rec.perfume;
            const timeMatch = bestTime ? p.best_time === bestTime : false;
            const occasionMatch = occasions.some((o: string) => p.occasions?.includes(o));
            return timeMatch || occasionMatch;
        })
        .slice(0, 18);

    if (momentRecs.length === 0) return null;

    // Dynamic Title
    if (occasions.length > 0) {
        title = `Perfect for ${occasions[0]} & More`;
    } else if (bestTime) {
        title = `Best for ${bestTime} Wear`;
    }

    return {
        type: 'moment',
        title: title,
        description: 'Scents that fit the same lifestyle and occasions.',
        recommendations: momentRecs
    };
  }
}
