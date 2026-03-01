import { useState, useCallback, useMemo } from 'react';
import { FilterCategory, FilterValues } from '@/components/features/search/filterTypes';

export function useFilters(initialFilters?: Partial<FilterValues>) {
  const [isModified, setIsModified] = useState(false);
  const [price, setPrice] = useState<string[]>(initialFilters?.price || []);
  const [gender, setGender] = useState<string[]>(initialFilters?.gender || []);
  const [longevity, setLongevity] = useState<string[]>(initialFilters?.longevity || []);
  const [season, setSeason] = useState<string[]>(initialFilters?.season || []);
  const [concentration, setConcentration] = useState<string[]>(initialFilters?.concentration || []);
  const [tier, setTier] = useState<string[]>(initialFilters?.tier || []);
  const [moment, setMoment] = useState<string[]>(initialFilters?.moment || []);
  const [occasion, setOccasion] = useState<string[]>(initialFilters?.occasion || []);
  const [year, setYear] = useState<string[]>(initialFilters?.year || []);

  // Create a stable reference for the filters object
  const filters = useMemo(() => ({
    price,
    gender,
    longevity,
    season,
    concentration,
    tier,
    moment,
    occasion,
    year
  }), [price, gender, longevity, season, concentration, tier, moment, occasion, year]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).flat().length;
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((category: FilterCategory, value: string) => {
    const updateState = {
      price: setPrice,
      gender: setGender,
      longevity: setLongevity,
      season: setSeason,
      concentration: setConcentration,
      tier: setTier,
      moment: setMoment,
      occasion: setOccasion,
      year: setYear,
    }[category];

    updateState(prev => {
      const newValue = prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value];
      setIsModified(true);
      return newValue;
    });
  }, []);

  // Update filter (replace instead of toggle)
  const updateFilter = useCallback((category: FilterCategory, values: string[]) => {
    const updateState = {
      price: setPrice,
      gender: setGender,
      longevity: setLongevity,
      season: setSeason,
      concentration: setConcentration,
      tier: setTier,
      moment: setMoment,
      occasion: setOccasion,
      year: setYear,
    }[category];

    updateState(values);
    setIsModified(true);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setPrice([]);
    setGender([]);
    setLongevity([]);
    setSeason([]);
    setConcentration([]);
    setTier([]);
    setMoment([]);
    setOccasion([]);
    setYear([]);
    setIsModified(true);
  }, []);

  return {
    isModified,
    setIsModified,
    activeFilterCount,
    handleFilterChange,
    updateFilter,
    clearFilters,
    filters
  };
}