'use client';

import { useState, useEffect, useRef } from 'react';
import { useFilters } from '@/hooks/useFilters';
import { 
  DollarSign, 
  User, 
  Zap, 
  Store, 
  Clock, 
  Calendar, 
  Sun, 
  Briefcase,
  History
} from 'lucide-react';
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
    updateFilter,
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
          className={`
            text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 px-8 py-4 rounded-full border shadow-sm relative
            ${isFiltersOpen 
              ? 'bg-stone-900 text-white border-stone-900 shadow-xl scale-105' 
              : 'bg-white text-stone-900 border-stone-200 hover:border-stone-400 hover:shadow-md'
            }
          `}
        >
          <span>Refine Collection</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
          <span className={`text-lg transition-transform duration-500 ${isFiltersOpen ? 'rotate-180' : ''}`}>
            {isFiltersOpen ? '−' : '+'}
          </span>
        </button>
      </div>

      {/* COLLAPSIBLE FILTER PANEL */}
      <div
        id="filter-panel"
        ref={panelRef}
        className={`overflow-hidden transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${
          isFiltersOpen ? 'max-h-[2000px] opacity-100 mb-16 overflow-y-auto' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
        role="region"
        aria-labelledby="filter-panel-title"
      >
        <div className="bg-[#FDFBF7]/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 max-w-[1400px] mx-auto border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-stone-100">
            <div>
              <h2 id="filter-panel-title" className="font-serif text-3xl text-stone-900 mb-2">Curate your view</h2>
              <p className="text-stone-400 text-sm font-light">Select multiple characteristics to narrow down the collection.</p>
            </div>
            
            <button
              onClick={clearFilters}
              className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hover:text-stone-900 transition-all px-6 py-2.5 rounded-full border border-stone-100 hover:border-stone-200 bg-white"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-12">
            <FilterSection 
              title="Price Point"
              icon={<DollarSign size={14} />}
              options={PRICE_OPTIONS}
              selected={filters.price}
              onChange={(value: string) => handleFilterChange('price', value)}
            />
            <FilterSection 
              title="Gender"
              icon={<User size={14} />}
              options={GENDER_OPTIONS}
              selected={filters.gender}
              onChange={(value: string) => handleFilterChange('gender', value)}
            />
            <FilterSection 
              title="Intensity"
              icon={<Zap size={14} />}
              options={CONCENTRATION_OPTIONS}
              selected={filters.concentration}
              onChange={(value: string) => handleFilterChange('concentration', value)}
            />
            <FilterSection 
              title="Market"
              icon={<Store size={14} />}
              options={TIER_OPTIONS}
              selected={filters.tier}
              onChange={(value: string) => handleFilterChange('tier', value)}
            />
            <FilterSection 
              title="Longevity"
              icon={<Clock size={14} />}
              options={LONGEVITY_OPTIONS}
              selected={filters.longevity}
              onChange={(value: string) => handleFilterChange('longevity', value)}
            />
            <FilterSection 
              title="Season"
              icon={<Calendar size={14} />}
              options={SEASON_OPTIONS}
              selected={filters.season}
              onChange={(value: string) => handleFilterChange('season', value)}
            />
            <FilterSection 
              title="Time of Day"
              icon={<Sun size={14} />}
              options={MOMENT_OPTIONS}
              selected={filters.moment}
              onChange={(value: string) => handleFilterChange('moment', value)}
            />
            <FilterSection 
              title="Occasion"
              icon={<Briefcase size={14} />}
              options={OCCASION_OPTIONS}
              selected={filters.occasion}
              onChange={(value: string) => handleFilterChange('occasion', value)}
            />
            <div className="w-full group">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-stone-400 group-hover:text-stone-600 transition-colors">
                  <History size={14} />
                </span>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-500 transition-colors">Release Year</h3>
              </div>
              <div className="relative max-w-[120px]">
                <input 
                  type="number"
                  placeholder="YYYY"
                  min="1900"
                  max="2099"
                  value={filters.year[0] || ''}
                  onChange={(e) => updateFilter('year', e.target.value ? [e.target.value] : [])}
                  className="w-full bg-white border border-stone-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all text-stone-900 placeholder:text-stone-300 shadow-sm group-hover:border-stone-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}