'use client';

import { useState } from 'react';
import { getAllHourRanges } from '@/lib/longevity-utils';

interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
}

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    price: string[];
    gender: string[];
    longevity: string[];
    season: string[];
    concentration: string[];
    tier: string[];
    moment: string[];
    occasion: string[];
  }>({
    price: [],
    gender: [],
    longevity: [],
    season: [],
    concentration: [],
    tier: [],
    moment: [],
    occasion: []
  });

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
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
      season: [],
      concentration: [],
      tier: [],
      moment: [],
      occasion: []
    };
    setSelectedFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <>
      {/* FILTER TOGGLE */}
      <div className="flex justify-end mb-4 max-w-[1400px] mx-auto px-6">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition flex items-center gap-2"
        >
          <span>Refine Collection</span>
          <span>{isFiltersOpen ? '−' : '+'}</span>
        </button>
      </div>

      {/* COLLAPSIBLE FILTER PANEL */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isFiltersOpen ? 'max-h-[500px] opacity-100 mb-12' : 'max-h-0 opacity-0'}`}>
        <div className="bg-stone-50 rounded-2xl p-8 max-w-[1400px] mx-auto mx-6 border border-stone-100">
          {/* The 2x4 Grid Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
            
            {/* --- ROW 1: IDENTITY --- */}
            
            {/* 1. Price */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Price Point</h4>
              <div className="flex flex-col gap-2">
                {['$', '$$', '$$$', '$$$$'].map((p) => (
                  <button key={p} onClick={() => toggleFilter('price', p)} className={`text-left text-sm transition-colors ${selectedFilters.price.includes(p) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Gender */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Gender</h4>
              <div className="flex flex-col gap-2">
                {['Male', 'Female', 'Unisex'].map((g) => (
                  <button key={g} onClick={() => toggleFilter('gender', g)} className={`text-left text-sm transition-colors ${selectedFilters.gender.includes(g) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Concentration (New) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Intensity</h4>
              <div className="flex flex-col gap-2">
                {['EDT', 'EDP', 'Parfum', 'Extrait'].map((c) => (
                  <button key={c} onClick={() => toggleFilter('concentration', c)} className={`text-left text-sm transition-colors ${selectedFilters.concentration.includes(c) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Market Tier (New) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Market</h4>
              <div className="flex flex-col gap-2">
                {['Designer', 'Niche', 'Indie'].map((t) => (
                  <button key={t} onClick={() => toggleFilter('tier', t)} className={`text-left text-sm transition-colors ${selectedFilters.tier.includes(t) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* --- ROW 2: CONTEXT --- */}
            
            {/* 5. Longevity */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Longevity</h4>
              <div className="flex flex-col gap-2">
                {['1-2 hours', '3-4 hours', '5-6 hours', '7-8 hours', '8+ hours'].map((l) => (
                  <button key={l} onClick={() => toggleFilter('longevity', l)} className={`text-left text-sm transition-colors ${selectedFilters.longevity.includes(l) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Season */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Season</h4>
              <div className="flex flex-col gap-2">
                {['Spring', 'Summer', 'Fall', 'Winter'].map((s) => (
                  <button key={s} onClick={() => toggleFilter('season', s)} className={`text-left text-sm transition-colors ${selectedFilters.season.includes(s) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Moment (New) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Time of Day</h4>
              <div className="flex flex-col gap-2">
                {['Day', 'Night', 'All Day'].map((m) => (
                  <button key={m} onClick={() => toggleFilter('moment', m)} className={`text-left text-sm transition-colors ${selectedFilters.moment.includes(m) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Occasion (New) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Occasion</h4>
              <div className="flex flex-col gap-2">
                {['Office', 'Date', 'Party', 'Daily'].map((o) => (
                  <button key={o} onClick={() => toggleFilter('occasion', o)} className={`text-left text-sm transition-colors ${selectedFilters.occasion.includes(o) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

          </div>
          
          {/* CLEAR FILTERS BUTTON */}
          <div className="flex justify-end mt-8 pt-4 border-t border-stone-100">
            <button
              onClick={clearFilters}
              className="text-xs font-bold tracking-widest text-stone-400 uppercase hover:text-stone-900 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </>
  );
}