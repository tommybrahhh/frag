import { createClient } from '@/lib/supabase';
import { mixPerfumes } from '@/lib/alchemy';

export interface Recommendation {
  perfume: any;
  type: 'similar' | 'complementary' | 'same-brand' | 'seasonal' | 'price-alternative' | 'discovery';
  score: number;
  reason: string;
  sharedNotes?: string[];
  sharedVibes?: string[];
  priceComparison?: 'cheaper' | 'similar' | 'premium';
}

export interface RecommendationCategory {
  type: string;
  title: string;
  description: string;
  recommendations: Recommendation[];
}

// Enhanced scent family categorization with more detailed analysis
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
        longevity_rating, sillage_rating, brand:brands!perfumes_brand_id_fkey(name),
        perfume_notes(type, note:notes(name, color_hex))
      `);

    return perfumes || [];
  }

  // Enhanced note analysis with family detection
  private static analyzeScentProfile(perfume: any) {
    const notes = perfume.perfume_notes?.map((n: any) => n.note?.name?.toLowerCase()) || [];
    const vibes = perfume.vibe_tags || [];

    const familyScores: Record<string, number> = {};

    // Score based on notes
    notes.forEach((note: string) => {
      for (const [family, keywords] of Object.entries(SCENT_FAMILIES)) {
        if (keywords.some(keyword => note.includes(keyword))) {
          familyScores[family] = (familyScores[family] || 0) + 2;
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

    // Get dominant families
    const dominantFamilies = Object.entries(familyScores)
      .filter(([_, score]) => score >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([family]) => family);

    return {
      dominantFamilies,
      notes,
      vibes
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
      .map(candidate => {
        const candidateProfile = this.analyzeScentProfile(candidate);
        
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

        // Normalize score to 0-100 scale
        const normalizedScore = maxPossibleScore > 0
          ? Math.min(100, Math.round((rawScore / maxPossibleScore) * 100))
          : 0;

        return {
          perfume: candidate,
          type: 'similar' as const,
          score: normalizedScore,
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
      .slice(0, count);
  }

  // Complementary recommendations with scent description for layering
  private static getComplementaryRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 4): Recommendation[] {
    const mainProfile = this.analyzeScentProfile(mainPerfume);
    
    // Scent combination descriptions
    const combinationDescriptions: Record<string, string> = {
      'Fresh+Oriental': 'creates a sparkling oriental with bright top notes',
      'Citrus+Woody': 'combines zesty freshness with warm, earthy depth',
      'Floral+Spicy': 'adds warmth and complexity to delicate florals',
      'Gourmand+Fresh': 'balances sweetness with refreshing counterpoints',
      'Woody+Citrus': 'grounds citrus notes with woody sophistication',
      'Oriental+Fresh': 'adds airy freshness to rich oriental bases',
      'Floral+Woody': 'creates a sophisticated floral-woody harmony',
      'Spicy+Sweet': 'tempers sweetness with spicy complexity',
      'Aquatic+Amber': 'combines marine freshness with warm amber glow',
      'Fruity+Woody': 'adds natural sweetness to woody compositions',
      'Green+Floral': 'creates a fresh, natural floral bouquet',
      'Leather+Floral': 'adds intriguing contrast to delicate florals'
    };
    
    return allPerfumes
      .filter(p => p.id !== mainPerfume.id)
      .map(candidate => {
        const candidateProfile = this.analyzeScentProfile(candidate);
        const mixResult = mixPerfumes(mainPerfume, candidate);
        
        // Layering-focused scoring (0-100 scale)
        let layeringScore = 50; // Start with neutral base
        
        // 1. Complementary scent families (weighted most heavily)
        const complementaryFamilyPairs = [
          ['Fresh', 'Oriental'], ['Citrus', 'Woody'], ['Floral', 'Spicy'],
          ['Gourmand', 'Fresh'], ['Woody', 'Citrus'], ['Oriental', 'Fresh'],
          ['Floral', 'Woody'], ['Spicy', 'Sweet'], ['Aquatic', 'Amber'],
          ['Fruity', 'Woody'], ['Green', 'Floral'], ['Leather', 'Floral']
        ];
        
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
        
        // 2. Note diversity and harmony
        const uniqueNotes = new Set([...mainProfile.notes, ...candidateProfile.notes]);
        const noteDiversityScore = Math.min(25, (uniqueNotes.size - Math.min(mainProfile.notes.length, candidateProfile.notes.length)) * 5);
        
        // 3. Safety adjustment from alchemy
        const safetyAdjustment = (mixResult.safety - 50) * 0.3;
        
        // 4. Season compatibility
        const sharedSeasons = mainPerfume.best_season?.filter((s: string) =>
          candidate.best_season?.includes(s)
        ) || [];
        const seasonScore = Math.min(10, sharedSeasons.length * 3);
        
        // Calculate final layering score
        const finalScore = Math.min(95, Math.max(40,
          layeringScore + familyScore + noteDiversityScore + safetyAdjustment + seasonScore
        ));
        
        // Generate scent description and layering guidance
        let scentDescription = '';
        let layeringGuidance = '';
        
        if (finalScore >= 85) {
          scentDescription = `Perfect pairing - ${combinationKey || 'exceptional harmony'}`;
          layeringGuidance = 'Apply base first, wait 2 minutes, then layer complement';
        } else if (finalScore >= 70) {
          scentDescription = `Great combination - ${combinationKey || 'harmonious blend'}`;
          layeringGuidance = '70% base + 30% complement creates balanced depth';
        } else if (finalScore >= 55) {
          scentDescription = `Interesting mix - ${combinationKey || 'intriguing contrast'}`;
          layeringGuidance = 'Test on skin first, apply lightly to pulse points';
        } else {
          scentDescription = `Experimental pairing - ${combinationKey || 'bold combination'}`;
          layeringGuidance = 'Use sparingly, focus on single application points';
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

  // Price alternatives
  private static getPriceAlternatives(mainPerfume: any, allPerfumes: any[], count: number = 4): Recommendation[] {
    const mainPriceTier = mainPerfume.price_tier;
    if (!mainPriceTier) return [];

    const priceTierValue = (tier: string) => tier?.split('$').length - 1 || 0;
    const mainPriceValue = priceTierValue(mainPriceTier);

    return allPerfumes
      .filter(p => p.id !== mainPerfume.id && p.price_tier)
      .map(candidate => {
        const candidatePriceValue = priceTierValue(candidate.price_tier);
        let priceComparison: 'cheaper' | 'similar' | 'premium' = 'similar';
        
        if (candidatePriceValue < mainPriceValue - 1) priceComparison = 'cheaper';
        else if (candidatePriceValue > mainPriceValue + 1) priceComparison = 'premium';

        const score = priceComparison === 'cheaper' ? 85 : 
                     priceComparison === 'premium' ? 75 : 60;

        return {
          perfume: candidate,
          type: 'price-alternative' as const,
          score,
          reason: priceComparison === 'cheaper' ? 'More affordable alternative' :
                 priceComparison === 'premium' ? 'Premium alternative' : 'Similar price point',
          priceComparison,
          sharedVibes: mainPerfume.vibe_tags?.filter((v: string) => 
            candidate.vibe_tags?.includes(v)
          )?.slice(0, 2) || []
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
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

  public static async getEnhancedRecommendations(mainPerfume: any): Promise<RecommendationCategory[]> {
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