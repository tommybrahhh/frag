import { Database } from '@/types/database';

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type Perfume = Tables<'perfumes'> & { brand: Tables<'brands'> | null };

export interface UserInsights {
  totalCount: number;
  topFamilies: { name: string; count: number; percentage: number }[];
  topBrands: { name: string; count: number }[];
  seasonPreference: { name: string; count: number }[];
}

export function analyzeWardrobe(collection: Perfume[]): UserInsights {
  if (!collection || collection.length === 0) {
    return {
      totalCount: 0,
      topFamilies: [],
      topBrands: [],
      seasonPreference: []
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
    seasonPreference: sortAndSlice(seasonCounts, 1) // Just the top season
  };
}
