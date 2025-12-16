import { useState, useCallback, useMemo } from 'react';
import { FilterCategory, FilterValues } from '../components/filterTypes';

export function useFilters() {
  const [isModified, setIsModified] = useState(false);
  const [price, setPrice] = useState<string[]>([]);
  const [gender, setGender] = useState<string[]>([]);
  const [longevity, setLongevity] = useState<string[]>([]);
  const [season, setSeason] = useState<string[]>([]);
  const [concentration, setConcentration] = useState<string[]>([]);
  const [tier, setTier] = useState<string[]>([]);
  const [moment, setMoment] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string[]>([]);

  // Create a stable reference for the filters object
  const filters = useMemo(() => ({
    price,
    gender,
    longevity,
    season,
    concentration,
    tier,
    moment,
    occasion
  }), [price, gender, longevity, season, concentration, tier, moment, occasion]);

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
    }[category];

    updateState(prev => {
      const newValue = prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value];
      setIsModified(true);
      return newValue;
    });
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
    setIsModified(true);
  }, []);

  return {
    isModified,
    setIsModified,
    activeFilterCount,
    handleFilterChange,
    clearFilters,
    filters
  };
}