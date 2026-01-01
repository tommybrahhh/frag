/**
 * Utility functions for converting between longevity rating scales.
 *
 * This module now supports a 1-10 scale for longevity, where:
 * 1-3: Poor
 * 4-5: Weak
 * 6-7: Moderate
 * 8: Long Lasting
 * 9: Very Long Lasting
 * 10: Eternal
 *
 * The `hourRange` values are maintained to be compatible with existing filter options.
 */

export interface LongevityMapping {
  rating: number;
  hourRange: string;
  description: string;
  minHours: number;
  maxHours: number;
}

export const longevityMappings: LongevityMapping[] = [
  { rating: 1, hourRange: "1-2 hours", description: "Poor", minHours: 1, maxHours: 2 },
  { rating: 2, hourRange: "1-2 hours", description: "Poor", minHours: 1, maxHours: 2 },
  { rating: 3, hourRange: "3-4 hours", description: "Poor", minHours: 2, maxHours: 3 },
  { rating: 4, hourRange: "3-4 hours", description: "Weak", minHours: 3, maxHours: 4 },
  { rating: 5, hourRange: "5-6 hours", description: "Weak", minHours: 4, maxHours: 5 },
  { rating: 6, hourRange: "5-6 hours", description: "Moderate", minHours: 5, maxHours: 6 },
  { rating: 7, hourRange: "7-8 hours", description: "Moderate", minHours: 6, maxHours: 7 },
  { rating: 8, hourRange: "7-8 hours", description: "Long Lasting", minHours: 7, maxHours: 8 },
  { rating: 9, hourRange: "8+ hours", description: "Very Long Lasting", minHours: 8, maxHours: 10 },
  { rating: 10, hourRange: "8+ hours", description: "Eternal", minHours: 10, maxHours: 24 } // Cap at 24 hours for eternal
];

/**
 * Convert a 1-10 longevity rating to hour range string (for filtering compatibility).
 */
export function ratingToHourRange(rating: number): string {
  const mapping = longevityMappings.find(m => m.rating === rating);
  return mapping?.hourRange || "Unknown";
}

/**
 * Convert a 1-10 longevity rating to its descriptive text.
 */
export function ratingToDescription(rating: number): string {
  const mapping = longevityMappings.find(m => m.rating === rating);
  return mapping?.description || "Unknown";
}

/**
 * Get the minimum hours for a given 1-10 rating.
 */
export function ratingToMinHours(rating: number): number {
  const mapping = longevityMappings.find(m => m.rating === rating);
  return mapping?.minHours || 0;
}

/**
 * Get the maximum hours for a given 1-10 rating.
 */
export function ratingToMaxHours(rating: number): number {
  const mapping = longevityMappings.find(m => m.rating === rating);
  return mapping?.maxHours || 0;
}

/**
 * Convert hour range string back to a representative 1-10 rating (for filtering).
 * This function will return the lowest rating that matches the hour range for consistency.
 */
export function hourRangeToRating(hourRange: string): number {
  const mapping = longevityMappings.find(m => m.hourRange === hourRange);
  return mapping?.rating || 0;
}

/**
 * Get all unique hour ranges for filtering.
 */
export function getAllHourRanges(): string[] {
  const uniqueHourRanges = Array.from(new Set(longevityMappings.map(m => m.hourRange)));
  return uniqueHourRanges;
}

/**
 * Get hour range options for filter display.
 */
export function getFilterOptions(): Array<{value: string, label: string}> {
  const uniqueOptions = Array.from(new Set(longevityMappings.map(m => m.hourRange)))
    .map(hr => ({ value: hr, label: hr }));
  return uniqueOptions;
}