import { Database } from '@/types/database';

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type Perfume = Tables<'perfumes'> & { 
  brand: Tables<'brands'> | null;
  perfume_notes?: { type: string; note: { name: string } }[];
};

export interface ScentsProfileDNA {
  warmth: number;
  freshness: number;
  floral: number;
  woody: number;
  spicy: number;
  depth: number;
}

export function calculateScentDNA(collection: Perfume[]): ScentsProfileDNA {
  const dna = { warmth: 0, freshness: 0, floral: 0, woody: 0, spicy: 0, depth: 0 };
  if (!collection.length) return dna;

  // Simple keyword matching to find the "Vibe"
  collection.forEach(p => {
    const tags = [...(p.olfactory_family || []), ...(p.vibe_tags || [])].join(' ').toLowerCase();
    
    if (tags.includes('citrus') || tags.includes('fresh') || tags.includes('blue')) dna.freshness += 2;
    if (tags.includes('floral') || tags.includes('rose') || tags.includes('jasmine')) dna.floral += 2;
    if (tags.includes('spicy') || tags.includes('pepper') || tags.includes('warm')) dna.spicy += 2;
    if (tags.includes('woody') || tags.includes('cedar') || tags.includes('vetiver')) dna.woody += 2;
    if (tags.includes('amber') || tags.includes('vanilla') || tags.includes('gourmand')) dna.warmth += 2;
    if (tags.includes('oud') || tags.includes('leather') || tags.includes('musk')) dna.depth += 2;
  });

  // Convert to proportions of the total profile (0-100)
  const totalPoints = Object.values(dna).reduce((sum, val) => sum + val, 0) || 1;
  
  Object.keys(dna).forEach(k => {
    // Calculate percentage relative to the total "weight" of the collection
    // We multiply by a factor (e.g., 5) to make the chart look fuller for small collections,
    // but relies on the proportion for large ones. 
    // Actually, for a Radar chart, showing pure proportion (0-100% of taste) is good.
    // Let's normalize so the sum is 100 (like a pie chart distribution).
    // Or, for the Radar chart specifically, we might want to normalize to a 0-10 scale?
    // The current UI expects 0-100.
    
    // Let's use a "density" approach: value / total * 100 * scaling_factor?
    // No, simplest is: (value / total) * 100. The sum of all bars will be 100.
    // However, the radar chart looks best when values are somewhat filled.
    // If we have 6 categories, average is 16%. That looks "empty" on a 0-100 chart.
    
    // Better Approach for Radar: Normalize against the MAX possible score for a balanced collection?
    // Let's stick to the user's request: relative balance.
    // Let's normalize so the HIGHEST bar is 100 (relative peak), BUT allow for variance?
    // The user's complaint is "complete in all columns".
    // This happens because `max` is low in small collections, but in large collections everything has points.
    
    // NEW LOGIC: Normalize by collection length * max_possible_points_per_item.
    // Each item gives +2 points max to a category.
    // So if I have 10 perfumes, the max score for "freshness" is 20.
    // If I have 10 freshness points, that's 50%.
    
    const maxPossibleScore = collection.length * 2; // Each perfume can contribute +2 to a bucket
    dna[k as keyof ScentsProfileDNA] = Math.round((dna[k as keyof ScentsProfileDNA] / maxPossibleScore) * 100);
  });

  return dna;
}

export interface UserInsights {
  totalCount: number;
  topFamilies: { name: string; count: number; percentage: number }[];
  topBrands: { name: string; count: number }[];
  seasonPreference: { name: string; count: number }[];
  scentDNA: ScentsProfileDNA;
}


export function analyzeWardrobe(collection: Perfume[]): UserInsights {
  if (!collection || collection.length === 0) {
    return {
      totalCount: 0,
      topFamilies: [],
      topBrands: [],
      seasonPreference: [],
      scentDNA: { warmth: 0, freshness: 0, floral: 0, woody: 0, spicy: 0, depth: 0 }
    };
  }

  const familyCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};
  const seasonCounts: Record<string, number> = {};

  collection.forEach(item => {
    // 1. Analyze Families
    if (item.olfactory_family && Array.isArray(item.olfactory_family)) {
      item.olfactory_family.forEach(family => {
        const cleanFamily = family.trim();
        familyCounts[cleanFamily] = (familyCounts[cleanFamily] || 0) + 1;
      });
    }

    // 2. Analyze Brands
    if (item.brand?.name) {
      brandCounts[item.brand.name] = (brandCounts[item.brand.name] || 0) + 1;
    }

    // 3. Analyze Seasons
    if (item.best_season && Array.isArray(item.best_season)) {
      item.best_season.forEach(season => {
        seasonCounts[season] = (seasonCounts[season] || 0) + 1;
      });
    }
  });

  // Helper to sort and slice
  const sortAndSlice = (counts: Record<string, number>, topN: number) => {
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([name, count]) => ({ name, count }));
  };

  const topFamilies = sortAndSlice(familyCounts, 3).map(f => ({
    ...f,
    percentage: Math.round((f.count / collection.length) * 100)
  }));

  return {
    totalCount: collection.length,
    topFamilies,
    topBrands: sortAndSlice(brandCounts, 3),
    seasonPreference: sortAndSlice(seasonCounts, 1),
    scentDNA: calculateScentDNA(collection)
  };
}
