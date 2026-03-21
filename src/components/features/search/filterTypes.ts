export type FilterCategory = 
  | 'price'
  | 'gender'
  | 'longevity'
  | 'season'
  | 'concentration'
  | 'tier'
  | 'moment'
  | 'occasion'
  | 'year'
  | 'brand'
  | 'vibe'
  | 'family';

export type FilterValues = {
  price: string[];
  gender: string[];
  longevity: string[];
  season: string[];
  concentration: string[];
  tier: string[];
  moment: string[];
  occasion: string[];
  year: string[];
  brand: string[];
  vibe: string[];
  family: string[];
};

export type FilterChangeHandler = (filters: FilterValues) => void;

export interface FilterPanelProps {
  onFilterChange: FilterChangeHandler;
}

export interface FilterSectionProps {
  title: string;
  options: string[];
  selected: string[];
  onChange: (value: string) => void;
}

export const PRICE_OPTIONS = ['$', '$$', '$$$', '$$$$'];
export const GENDER_OPTIONS = ['Male', 'Female', 'Unisex'];
export const CONCENTRATION_OPTIONS = ['EDT', 'EDP', 'Parfum', 'Extrait', 'Cologne'];
export const TIER_OPTIONS = ['Designer', 'Niche', 'Indie'];
export const LONGEVITY_OPTIONS = ['1-2 hours', '3-4 hours', '5-6 hours', '7-8 hours', '8+ hours'];
export const SEASON_OPTIONS = ['Spring', 'Summer', 'Fall', 'Winter'];
export const MOMENT_OPTIONS = ['Day', 'Night', 'All Day'];
export const OCCASION_OPTIONS = ['Office', 'Date', 'Party', 'Daily'];
