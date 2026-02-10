'use client';

import { useState, useEffect, useRef } from 'react';
import { useFilters } from '@/hooks/useFilters';
import { 
  FilterPanelProps,
  PRICE_OPTIONS,
  GENDER_OPTIONS,
  CONCENTRATION_OPTIONS,
  TIER_OPTIONS,
  LONGEVITY_OPTIONS,
  SEASON_OPTIONS,
  MOMENT_OPTIONS,
  OCCASION_OPTIONS
} from './filterTypes';
import FilterSection from './FilterSection';

export default function FilterPanel({ onFilterChange, initialFilters }: FilterPanelProps & { initialFilters?: any }) {
  const {
    isModified,
    setIsModified,
    activeFilterCount,
    handleFilterChange,
    clearFilters,
    filters
  } = useFilters(initialFilters);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Apply filters callback with debounce
  useEffect(() => {
    if (isModified) {
      const timeoutId = setTimeout(() => {
        onFilterChange(filters);
        setIsModified(false);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [isModified, filters, onFilterChange, setIsModified]);

  // Focus management
  useEffect(() => {
    if (isFiltersOpen && panelRef.current) {
      const firstFilter = panelRef.current.querySelector('button');
      firstFilter?.focus();
    } else if (!isFiltersOpen && filterButtonRef.current) {
      filterButtonRef.current.focus();
    }
  }, [isFiltersOpen]);

  return (
    <>
      {/* FILTER TOGGLE */}
      <div className="flex justify-center mb-4 max-w-[1400px] mx-auto px-4 sm:px-6">
        <button
          ref={filterButtonRef}
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          aria-expanded={isFiltersOpen}
          aria-controls="filter-panel"
          className="text-sm font-bold uppercase tracking-widest text-stone-900 hover:text-stone-700 transition-all flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-stone-200 hover:border-stone-300 shadow-sm relative"
        >
          <span>Refine Collection</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
          <span className="text-lg transition-transform duration-300">
            {isFiltersOpen ? '−' : '+'}
          </span>
        </button>
      </div>

      {/* COLLAPSIBLE FILTER PANEL */}
      <div
        id="filter-panel"
        ref={panelRef}
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isFiltersOpen ? 'max-h-[85vh] opacity-100 mb-12 overflow-y-auto' : 'max-h-0 opacity-0'
        }`}
        role="region"
        aria-labelledby="filter-panel-title"
      >
        <div className="bg-stone-50/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 max-w-[1400px] mx-auto border border-stone-200 shadow-xl">
          <h2 id="filter-panel-title" className="sr-only">Filter Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            <FilterSection 
              title="Price Point"
              options={PRICE_OPTIONS}
              selected={filters.price}
              onChange={(value: string) => handleFilterChange('price', value)}
            />
            <FilterSection 
              title="Gender"
              options={GENDER_OPTIONS}
              selected={filters.gender}
              onChange={(value: string) => handleFilterChange('gender', value)}
            />
            <FilterSection 
              title="Intensity"
              options={CONCENTRATION_OPTIONS}
              selected={filters.concentration}
              onChange={(value: string) => handleFilterChange('concentration', value)}
            />
            <FilterSection 
              title="Market"
              options={TIER_OPTIONS}
              selected={filters.tier}
              onChange={(value: string) => handleFilterChange('tier', value)}
            />
            <FilterSection 
              title="Longevity"
              options={LONGEVITY_OPTIONS}
              selected={filters.longevity}
              onChange={(value: string) => handleFilterChange('longevity', value)}
            />
            <FilterSection 
              title="Season"
              options={SEASON_OPTIONS}
              selected={filters.season}
              onChange={(value: string) => handleFilterChange('season', value)}
            />
            <FilterSection 
              title="Time of Day"
              options={MOMENT_OPTIONS}
              selected={filters.moment}
              onChange={(value: string) => handleFilterChange('moment', value)}
            />
            <FilterSection 
              title="Occasion"
              options={OCCASION_OPTIONS}
              selected={filters.occasion}
              onChange={(value: string) => handleFilterChange('occasion', value)}
            />
          </div>
          
          <div className="flex justify-end mt-6 pt-4 border-t border-stone-100">
            <button
              onClick={clearFilters}
              className="text-xs font-bold tracking-widest text-stone-400 uppercase hover:text-stone-900 transition-colors px-4 py-2 rounded-lg hover:bg-stone-100"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </>
  );
}