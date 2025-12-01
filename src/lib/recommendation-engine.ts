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
    
    return allPerfumes
      .filter(p => p.id !== mainPerfume.id)
      .map(candidate => {
        const candidateProfile = this.analyzeScentProfile(candidate);
        
        // Calculate similarity score
        let score = 0;
        const sharedNotes = mainProfile.notes.filter((note: string) => candidateProfile.notes.includes(note));
        const sharedVibes = mainProfile.vibes.filter((vibe: string) => candidateProfile.vibes.includes(vibe));
        const sharedFamilies = mainProfile.dominantFamilies.filter(family => 
          candidateProfile.dominantFamilies.includes(family)
        );

        score += sharedNotes.length * 15;
        score += sharedVibes.length * 10;
        score += sharedFamilies.length * 25;

        // Brand bonus
        if (mainPerfume.brand?.name === candidate.brand?.name) {
          score += 20;
        }

        // Season compatibility
        const sharedSeasons = mainPerfume.best_season?.filter((s: string) => 
          candidate.best_season?.includes(s)
        ) || [];
        score += sharedSeasons.length * 8;

        return {
          perfume: candidate,
          type: 'similar' as const,
          score,
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

  // Complementary recommendations using alchemy rules
  private static getComplementaryRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 4): Recommendation[] {
    return allPerfumes
      .filter(p => p.id !== mainPerfume.id)
      .map(candidate => {
        const mixResult = mixPerfumes(mainPerfume, candidate);
        
        return {
          perfume: candidate,
          type: 'complementary' as const,
          score: mixResult.safety,
          reason: mixResult.safety >= 70 
            ? `Creates harmonious blend (${mixResult.safety}% compatibility)`
            : `Experimental combination (${mixResult.safety}% compatibility)`,
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
        score: 80, // Base score for same brand
        reason: `From the same house: ${mainBrand}`,
        sharedVibes: mainPerfume.vibe_tags?.filter((v: string) => 
          candidate.vibe_tags?.includes(v)
        )?.slice(0, 3) || []
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  // Seasonal alternatives
  private static getSeasonalRecommendations(mainPerfume: any, allPerfumes: any[], count: number = 4): Recommendation[] {
    const mainSeasons = mainPerfume.best_season || [];
    if (mainSeasons.length === 0) return [];

    return allPerfumes
      .filter(p => p.id !== mainPerfume.id)
      .map(candidate => {
        const sharedSeasons = mainSeasons.filter((s: string) => 
          candidate.best_season?.includes(s)
        );
        
        return {
          perfume: candidate,
          type: 'seasonal' as const,
          score: sharedSeasons.length * 25,
          reason: sharedSeasons.length > 0 
            ? `Perfect for ${sharedSeasons.join(', ')} seasons`
            : 'Seasonally versatile',
          sharedVibes: mainPerfume.vibe_tags?.filter((v: string) => 
            candidate.vibe_tags?.includes(v)
          )?.slice(0, 2) || []
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
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