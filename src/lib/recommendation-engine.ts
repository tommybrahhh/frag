import { createClient } from '@/lib/supabase';
import { mixPerfumes } from '@/lib/alchemy';

export interface Recommendation {
  perfume: any;
  type: 'similar' | 'complementary' | 'same-brand' | 'seasonal' | 'price-alternative' | 'discovery';
  score: number;
  reason: string;
  sharedNotes?: string[];
  sharedVibes?: string[];
  sharedFamilies?: string[];
  priceComparison?: 'cheaper' | 'similar' | 'premium';
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
  private static async getAllPerfumes() {
    const supabase = createClient();
    const { data: perfumes } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url, rating, vibe_tags, price_tier, best_season,
        longevity_rating, sillage_rating, molecular_structure,
        brand:brands!perfumes_brand_id_fkey(name),
        perfume_notes(type, note:notes(name, color_hex))
      `);

    return perfumes || [];
  }

  // Enhanced note analysis with volatility scoring
  private static analyzeScentProfile(perfume: any) {
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

    // Get dominant families with weighted scores
    const dominantFamilies = Object.entries(familyScores)
      .filter(([_, score]) => score >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([family]) => family);

    // Analyze olfactory composition
    const composition = {
      topNotes: notes.filter(n => NOTE_VOLATILITY[n] >= 2.5),
      heartNotes: notes.filter(n => NOTE_VOLATILITY[n] >= 1.5 && NOTE_VOLATILITY[n] < 2.5),
      baseNotes: notes.filter(n => NOTE_VOLATILITY[n] < 1.5),
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
  private static getSimilarRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 6): Recommendation[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    
    // Calculate maximum possible score for normalization
    const maxNotesScore = mainProfile.notes.length * 15;
    const maxVibesScore = mainProfile.vibes.length * 10;
    const maxFamiliesScore = mainProfile.dominantFamilies.length * 25;
    const maxBrandScore = 20; // Brand bonus
    const maxSeasonsScore = mainPerfume.best_season?.length * 8 || 0;
    
    const maxPossibleScore = maxNotesScore + maxVibesScore + maxFamiliesScore + maxBrandScore + maxSeasonsScore;
    
    return allPerfumes
      .filter(p => p.id !== mainPerfume.id)
      .filter(candidate => { // New filter for minimum shared notes
        const candidateProfile = RecommendationEngine.analyzeScentProfile(candidate);
        const sharedNotes = mainProfile.notes.filter((note: string) => candidateProfile.notes.includes(note));
        return sharedNotes.length >= 3;
      })
      .map(candidate => {
        const candidateProfile = RecommendationEngine.analyzeScentProfile(candidate);
        
        // Calculate raw similarity score
        let rawScore = 0;
        const sharedNotes = mainProfile.notes.filter((note: string) => candidateProfile.notes.includes(note));
        const sharedVibes = mainProfile.vibes.filter((vibe: string) => candidateProfile.vibes.includes(vibe));
        const sharedFamilies = mainProfile.dominantFamilies.filter(family =>
          candidateProfile.dominantFamilies.includes(family)
        );



        rawScore += sharedNotes.length * 15;
        rawScore += sharedVibes.length * 10;
        rawScore += sharedFamilies.length * 25;

        // Brand bonus
        if (mainPerfume.brand?.name === candidate.brand?.name) {
          rawScore += 20;
        }

        // Season compatibility
        const sharedSeasons = mainPerfume.best_season?.filter((s: string) =>
          candidate.best_season?.includes(s)
        ) || [];
        rawScore += sharedSeasons.length * 8;

        // Add molecular similarity score if structures are available
        const molecularScore = mainPerfume.molecular_structure && candidate.molecular_structure ?
          this.calculateMolecularSimilarity(mainPerfume.molecular_structure, candidate.molecular_structure) * 0.3 : 0;

        // Composition similarity scoring
        const compositionScore = this.calculateCompositionSimilarity(mainProfile.composition, candidateProfile.composition);
        
        // Normalize score to 0-100 scale
        const normalizedScore = Math.min(100, Math.round(
          (rawScore / maxPossibleScore) * 60 + molecularScore + compositionScore * 0.4
        ));

        return {
          perfume: candidate,
          type: 'similar' as const,
          score: Math.max(0, normalizedScore),
          reason: sharedFamilies.length > 0
            ? `Shares ${sharedFamilies.join(', ')} scent family`
            : sharedNotes.length > 0
              ? `Shares ${sharedNotes.slice(0, 3).join(', ')} notes`
              : 'Similar vibe profile',
          sharedNotes: sharedNotes.slice(0, 5),
          sharedVibes: sharedVibes.slice(0, 3)
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count) as Recommendation[];
  }

  // Enhanced complementary recommendations with volatility-based pairing
  private static getComplementaryRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 4): Recommendation[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    
    // Scent combination descriptions with volatility considerations
    const combinationDescriptions: Record<string, string> = {
      'Fresh+Oriental': 'creates a sparkling oriental with bright top notes',
      'Citrus+Woody': 'balances zesty freshness with warm, earthy depth',
      'Floral+Spicy': 'adds warmth and complexity to delicate florals',
      'Gourmand+Fresh': 'counters sweetness with refreshing volatility',
      'Woody+Citrus': 'grounds volatile citrus with woody stability',
      'Oriental+Fresh': 'adds airy freshness to rich oriental bases',
      'Floral+Woody': 'creates a sophisticated floral-woody harmony',
      'Spicy+Sweet': 'tempers sweetness with spicy complexity',
      'Aquatic+Amber': 'combines marine freshness with warm amber glow',
      'Fruity+Woody': 'balances fruity volatility with woody depth',
      'Green+Floral': 'creates a fresh, natural floral bouquet',
      'Leather+Floral': 'adds intriguing contrast to delicate florals'
    };

    // Volatility balance scoring
    const getVolatilityBalance = (mainVol: number, candidateVol: number): number => {
      const diff = Math.abs(mainVol - candidateVol);
      if (diff < 0.5) return 50; // Neutral score for similar volatility
      if (diff > 1.5) return 80; // High score for complementary volatility
      return 65; // Moderate score for mild difference
    };
    
    return allPerfumes
      .filter(p => p.id !== mainPerfume.id)
      .map(candidate => {
        const candidateProfile = this.analyzeScentProfile(candidate);
        const mixResult = mixPerfumes(mainPerfume, candidate, 0.5);
        
        // Enhanced layering scoring with volatility balance
        let layeringScore = 50; // Start with neutral base
        
        // 1. Volatility balance (weighted heavily)
        const volatilityBalance = getVolatilityBalance(mainProfile.overallVolatility, candidateProfile.overallVolatility);
        layeringScore += volatilityBalance - 50; // Adjust based on volatility balance
        
        // 2. Complementary scent families and composition
        const complementaryFamilyPairs = [
          ['Fresh', 'Oriental'], ['Citrus', 'Woody'], ['Floral', 'Spicy'],
          ['Gourmand', 'Fresh'], ['Woody', 'Citrus'], ['Oriental', 'Fresh'],
          ['Floral', 'Woody'], ['Spicy', 'Sweet'], ['Aquatic', 'Amber'],
          ['Fruity', 'Woody'], ['Green', 'Floral'], ['Leather', 'Floral']
        ];
        
        // Composition complementarity scoring
        const compositionScore = this.calculateCompositionComplementarity(
          mainProfile.composition,
          candidateProfile.composition
        );
        
        let familyScore = 0;
        let combinationKey = '';
        
        mainProfile.dominantFamilies.forEach(mainFamily => {
          candidateProfile.dominantFamilies.forEach(candidateFamily => {
            const pairKey = `${mainFamily}+${candidateFamily}`;
            const reverseKey = `${candidateFamily}+${mainFamily}`;
            
            if (complementaryFamilyPairs.some(pair =>
              (pair[0] === mainFamily && pair[1] === candidateFamily) ||
              (pair[1] === mainFamily && pair[0] === candidateFamily)
            )) {
              familyScore += 20;
              combinationKey = combinationDescriptions[pairKey] || combinationDescriptions[reverseKey] || '';
            } else if (mainFamily === candidateFamily) {
              familyScore -= 10; // Penalty for same family
            }
          });
        });
        
        // 3. Note diversity and volatility harmony
        const uniqueNotes = new Set([...mainProfile.notes, ...candidateProfile.notes]);
        const noteDiversityScore = Math.min(25, (uniqueNotes.size - Math.min(mainProfile.notes.length, candidateProfile.notes.length)) * 5);
        
        // 4. Volatility-based safety adjustment
        const volatilityDiff = Math.abs(mainProfile.overallVolatility - candidateProfile.overallVolatility);
        const safetyAdjustment = volatilityDiff > 1.5 ? 15 : volatilityDiff > 0.5 ? 5 : -5;
        
        // 5. Season compatibility with volatility considerations
        const sharedSeasons = mainPerfume.best_season?.filter((s: string) =>
          candidate.best_season?.includes(s)
        ) || [];
        const seasonScore = Math.min(10, sharedSeasons.length * 3);
        
        // 6. Volatility balance in common notes
        const commonNotes = mainProfile.notes.filter((note: string) => candidateProfile.notes.includes(note));
        const sharedVolatilityScore = commonNotes.length > 0 ?
          Math.min(10, commonNotes.reduce((sum: number, note: string) => sum + (NOTE_VOLATILITY[note] || 1), 0) / commonNotes.length) :
          0;
        
        // Calculate final layering score with volatility balance
        const finalScore = Math.min(95, Math.max(40,
          layeringScore + familyScore + noteDiversityScore + safetyAdjustment +
          seasonScore + sharedVolatilityScore + compositionScore * 0.3
        ));
        
        // Generate scent description with volatility insights
        let scentDescription = '';
        let layeringGuidance = '';
        
        if (finalScore >= 85) {
          scentDescription = `Perfect pairing - ${combinationKey || 'exceptional harmony'}`;
          if (volatilityDiff > 1.5) {
            scentDescription += ' with complementary volatility';
            layeringGuidance = 'Apply volatile scent first, then layer the more stable one';
          } else {
            layeringGuidance = 'Apply base first, wait 2 minutes, then layer complement';
          }
        } else if (finalScore >= 70) {
          scentDescription = `Great combination - ${combinationKey || 'harmonious blend'}`;
          if (volatilityDiff > 1.5) {
            scentDescription += ' with balanced intensity';
            layeringGuidance = 'Apply 50/50 ratio for balanced volatility';
          } else {
            layeringGuidance = '70% base + 30% complement creates balanced depth';
          }
        } else if (finalScore >= 55) {
          scentDescription = `Interesting mix - ${combinationKey || 'intriguing contrast'}`;
          if (volatilityDiff > 1.5) {
            scentDescription += ' with contrasting volatility';
            layeringGuidance = 'Test on skin first, start with small amounts';
          } else {
            layeringGuidance = 'Test on skin first, apply lightly to pulse points';
          }
        } else {
          scentDescription = `Experimental pairing - ${combinationKey || 'bold combination'}`;
          if (volatilityDiff > 1.5) {
            scentDescription += ' with extreme volatility contrast';
            layeringGuidance = 'Use sparingly, focus on single application points';
          } else {
            layeringGuidance = 'Use sparingly, focus on single application points';
          }
        }
        
        // Add specific note combinations if available
        const sharedNotes = mainProfile.notes.filter((note: string) => candidateProfile.notes.includes(note));
        if (sharedNotes.length > 0) {
          scentDescription += ` with shared ${sharedNotes.slice(0, 2).join(', ')} notes`;
        }
        
        return {
          perfume: candidate,
          type: 'complementary' as const,
          score: Math.round(finalScore),
          reason: `${scentDescription}. ${layeringGuidance}`,
          sharedVibes: mixResult.combinedVibes.slice(0, 3)
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  // Enhanced Price alternatives with scent and volatility scoring
        
        // Calculate scent similarity score (0-100)
        const sharedNotes = mainProfile.notes.filter((note: string) =>
          candidateProfile.notes.includes(note)
        );
        const sharedVibes = mainProfile.vibes.filter((vibe: string) =>
          candidateProfile.vibes.includes(vibe)
        );
        const sharedFamilies = mainProfile.dominantFamilies.filter(family =>
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
        if (candidatePriceValue < mainPriceValue) priceComparison = 'cheaper';
        else if (candidatePriceValue > mainPriceValue) priceComparison = 'premium';

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

  // Enhanced Price alternatives with scent similarity scoring
        
        // Calculate scent similarity score (0-100)
        const sharedNotes = mainProfile.notes.filter((note: string) =>
          candidateProfile.notes.includes(note)
        );
        const sharedVibes = mainProfile.vibes.filter((vibe: string) =>
          candidateProfile.vibes.includes(vibe)
        );
        const sharedFamilies = mainProfile.dominantFamilies.filter(family =>
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


  // Discovery recommendations (similar but different)
  private static getDiscoveryRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 4): Recommendation[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    
    return allPerfumes
      .filter(p => p.id !== mainPerfume.id)
      .map(candidate => {
        const candidateProfile = this.analyzeScentProfile(candidate);
        
        // Look for perfumes that share some characteristics but introduce new elements
        const sharedVibes = mainProfile.vibes.filter((vibe: string) => candidateProfile.vibes.includes(vibe));
        const newFamilies = candidateProfile.dominantFamilies.filter(family => 
          !mainProfile.dominantFamilies.includes(family)
        );

        const score = 50 + (sharedVibes.length * 5) + (newFamilies.length * 15);

        return {
          perfume: candidate,
          type: 'discovery' as const,
          score,
          reason: newFamilies.length > 0 
            ? `Introduces ${newFamilies.join(', ')} notes to familiar vibe`
            : sharedVibes.length > 0
              ? 'Similar vibe with new character'
              : 'Completely different exploration',
          sharedVibes: sharedVibes.slice(0, 2)
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  // Molecular structure similarity scoring
  private static calculateMolecularSimilarity(mainStructure: string, candidateStructure: string): number {
    if (!mainStructure || !candidateStructure) return 0;
    
    // Basic similarity scoring based on molecular fingerprints
    const mainFingerprint = this.getMolecularFingerprint(mainStructure);
    const candidateFingerprint = this.getMolecularFingerprint(candidateStructure);
    
    const intersection = mainFingerprint.filter(value => candidateFingerprint.includes(value)).length;
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
    
    // Weighted average favoring heart and base notes
    return Math.round((
      (topNoteSimilarity * 0.3) +
      (heartNoteSimilarity * 0.4) +
      (baseNoteSimilarity * 0.3)
    ) * 100);
  }

  // User preference weighting system
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

  public static async getEnhancedRecommendations(mainPerfume: any, preferences?: any): Promise<RecommendationCategory[]> {
    const allPerfumes = await this.getAllPerfumes();
    
    const categories: RecommendationCategory[] = [
      {
        type: 'similar',
        title: 'Similar Scents',
        description: 'Perfumes with comparable olfactory profiles and notes',
        recommendations: this.getSimilarRecommendations(mainPerfume, allPerfumes, 8)
      },
      {
        type: 'complementary',
        title: 'Perfect Pairings',
        description: 'Scents that blend beautifully for layering',
        recommendations: this.getComplementaryRecommendations(mainPerfume, allPerfumes, 6)
      },
      {
        type: 'same-brand',
        title: 'From the Same House',
        description: 'Other creations from this perfumer or brand',
        recommendations: this.getSameBrandRecommendations(mainPerfume, allPerfumes, 6)
      },
      {
        type: 'seasonal',
        title: 'Seasonal Alternatives',
        description: 'Scents perfect for the same occasions',
        recommendations: this.getSeasonalRecommendations(mainPerfume, allPerfumes, 6)
      },
      {
        type: 'price',
        title: 'Price Alternatives',
        description: 'Options at different price points',
        recommendations: this.getPriceAlternatives(mainPerfume, allPerfumes, 6)
      },
      {
        type: 'discovery',
        title: 'For Exploration',
        description: 'Scents that expand your olfactory horizons',
        recommendations: this.getDiscoveryRecommendations(mainPerfume, allPerfumes, 6)
      }
    ];

    // Filter out empty categories
    return categories.filter(category => category.recommendations.length > 0);
  }
}