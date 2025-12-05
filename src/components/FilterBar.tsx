'use client';

import { useState } from 'react';
import { getAllHourRanges } from '@/lib/longevity-utils';

interface FilterOptions {
  price: string[];
  gender: string[];
  longevity: string[];
  season: string[];
}

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({
    price: [],
    gender: [],
    longevity: [],
    season: []
  });

  const filterOptions = {
    price: ['$', '$$', '$$$', '$$$$'],
    gender: ['Male', 'Female', 'Unisex'],
    longevity: getAllHourRanges(),
    season: ['Spring', 'Summer', 'Fall', 'Winter']
  };

  const handleFilterToggle = (category: keyof FilterOptions, value: string) => {
    const newFilters = { ...selectedFilters };
    
    if (newFilters[category].includes(value)) {
      newFilters[category] = newFilters[category].filter(v => v !== value);
    } else {
      newFilters[category] = [...newFilters[category], value];
    }

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      price: [],
      gender: [],
      longevity: [],
      season: []
    };
    setSelectedFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };


  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl text-stone-900">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-xs font-bold tracking-widest text-stone-400 uppercase hover:text-stone-900 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Price Filter */}
        <div>
          <h4 className="text-sm font-bold text-stone-700 mb-3">Price</h4>
          <div className="space-y-2">
            {filterOptions.price.map((price) => (
              <label key={price} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFilters.price.includes(price)}
                  onChange={() => handleFilterToggle('price', price)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center transition-colors ${
                  selectedFilters.price.includes(price)
                    ? 'bg-stone-900 border-stone-900'
                    : 'border-stone-300 group-hover:border-stone-400'
                }`}>
                  {selectedFilters.price.includes(price) && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                  {price}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Gender Filter */}
        <div>
          <h4 className="text-sm font-bold text-stone-700 mb-3">Gender</h4>
          <div className="space-y-2">
            {filterOptions.gender.map((gender) => (
              <label key={gender} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFilters.gender.includes(gender)}
                  onChange={() => handleFilterToggle('gender', gender)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center transition-colors ${
                  selectedFilters.gender.includes(gender)
                    ? 'bg-stone-900 border-stone-900'
                    : 'border-stone-300 group-hover:border-stone-400'
                }`}>
                  {selectedFilters.gender.includes(gender) && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                  {gender}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Longevity Filter */}
        <div>
          <h4 className="text-sm font-bold text-stone-700 mb-3">Longevity</h4>
          <div className="space-y-2">
            {filterOptions.longevity.map((longevity) => (
              <label key={longevity} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFilters.longevity.includes(longevity)}
                  onChange={() => handleFilterToggle('longevity', longevity)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center transition-colors ${
                  selectedFilters.longevity.includes(longevity)
                    ? 'bg-stone-900 border-stone-900'
                    : 'border-stone-300 group-hover:border-stone-400'
                }`}>
                  {selectedFilters.longevity.includes(longevity) && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                  {longevity}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Season Filter */}
        <div>
          <h4 className="text-sm font-bold text-stone-700 mb-3">Season</h4>
          <div className="space-y-2">
            {filterOptions.season.map((season) => (
              <label key={season} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFilters.season.includes(season)}
                  onChange={() => handleFilterToggle('season', season)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center transition-colors ${
                  selectedFilters.season.includes(season)
                    ? 'bg-stone-900 border-stone-900'
                    : 'border-stone-300 group-hover:border-stone-400'
                }`}>
                  {selectedFilters.season.includes(season) && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                  {season}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}