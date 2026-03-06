'use client';

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
  History,
  RotateCcw,
  ChevronDown
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
import { useEffect, useState } from 'react';

export default function FilterBar({ onFilterChange, initialFilters }: FilterPanelProps & { initialFilters?: any }) {
  const {
    isModified,
    setIsModified,
    activeFilterCount,
    handleFilterChange,
    updateFilter,
    clearFilters,
    filters
  } = useFilters(initialFilters);

  const [isYearOpen, setIsYearOpen] = useState(true);

  // Call onFilterChange immediately when filters change
  useEffect(() => {
    if (isModified) {
      onFilterChange(filters);
      setIsModified(false);
    }
  }, [isModified, filters, onFilterChange, setIsModified]);

  return (
    <div className="w-full flex flex-col gap-8">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h3 className="font-serif text-xl text-stone-900">Filters</h3>
          {activeFilterCount > 0 && (
            <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">
              {activeFilterCount} active
            </p>
          )}
        </div>
        
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-red-500 uppercase hover:text-red-700 transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* FILTERS LIST */}
      <div className="flex flex-col gap-8">
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
        
        {/* Release Year Input */}
        <div className="w-full group">
          <button
            onClick={() => setIsYearOpen(!isYearOpen)}
            className="w-full flex items-center justify-between mb-4 group/btn"
          >
            <div className="flex items-center gap-2">
              <span className="text-stone-400 group-hover:text-stone-600 transition-colors group-hover/btn:text-stone-600">
                <History size={14} />
              </span>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-500 transition-colors group-hover/btn:text-stone-500">
                Release Year {filters.year.length > 0 && filters.year[0] && <span className="text-stone-900 ml-1">({filters.year[0]})</span>}
              </h3>
            </div>
            <ChevronDown 
              size={14} 
              className={`text-stone-400 transition-transform duration-300 ${isYearOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {isYearOpen && (
            <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
              <input 
                type="number"
                placeholder="YYYY"
                min="1900"
                max="2099"
                value={filters.year[0] || ''}
                onChange={(e) => updateFilter('year', e.target.value ? [e.target.value] : [])}
                className="w-full bg-white border border-stone-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all text-stone-900 placeholder:text-stone-300 shadow-sm group-hover:border-stone-300"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
