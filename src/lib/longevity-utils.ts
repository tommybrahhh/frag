/**
 * Utility functions for converting between longevity rating scales
 * 
 * Converts from 1-5 scale (database storage) to hour ranges (user display)
 * Accounts for the discrepancy where cheap perfumes might be rated 5 but not last 10+ hours
 */

export interface LongevityMapping {
  rating: number;
  hourRange: string;
  description: string;
  minHours: number;
  maxHours: number;
}

export const longevityMappings: LongevityMapping[] = [
  {
    rating: 1,
    hourRange: "1-2 hours",
    description: "Very Weak",
    minHours: 1,
    maxHours: 2
  },
  {
    rating: 2,
    hourRange: "3-4 hours", 
    description: "Weak",
    minHours: 3,
    maxHours: 4
  },
  {
    rating: 3,
    hourRange: "5-6 hours",
    description: "Moderate",
    minHours: 5,
    maxHours: 6
  },
  {
    rating: 4,
    hourRange: "7-8 hours",
    description: "Long Lasting",
    minHours: 7,
    maxHours: 8
  },
  {
    rating: 5,
    hourRange: "8+ hours",
    description: "Excellent",
    minHours: 8,
    maxHours: 12 // Cap at 12 hours for realistic expectations
  }
];

/**
 * Convert a 1-5 longevity rating to hour range string
 */
export function ratingToHourRange(rating: number): string {
  const mapping = longevityMappings.find(m => m.rating === rating);
  return mapping?.hourRange || "Unknown";
}

/**
 * Convert a 1-5 longevity rating to description
 */
export function ratingToDescription(rating: number): string {
  const mapping = longevityMappings.find(m => m.rating === rating);
  return mapping?.description || "Unknown";
}

/**
 * Get the minimum hours for a given rating
 */
export function ratingToMinHours(rating: number): number {
  const mapping = longevityMappings.find(m => m.rating === rating);
  return mapping?.minHours || 0;
}

/**
 * Get the maximum hours for a given rating
 */
export function ratingToMaxHours(rating: number): number {
  const mapping = longevityMappings.find(m => m.rating === rating);
  return mapping?.maxHours || 0;
}

/**
 * Convert hour range string back to 1-5 rating (for filtering)
 */
export function hourRangeToRating(hourRange: string): number {
  const mapping = longevityMappings.find(m => m.hourRange === hourRange);
  return mapping?.rating || 0;
}

/**
 * Get all available hour ranges for filtering
 */
export function getAllHourRanges(): string[] {
  return longevityMappings.map(m => m.hourRange);
}

/**
 * Get hour range options for filter display
 */
export function getFilterOptions(): Array<{value: string, label: string}> {
  return longevityMappings.map(m => ({
    value: m.hourRange,
    label: m.hourRange
  }));
}