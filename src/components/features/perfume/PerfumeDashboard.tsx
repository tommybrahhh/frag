'use client';

import React from 'react';
import ScentRadar from '@/components/ui/ScentRadar';
import { Database } from '@/types/database';
import { ratingToDescription } from '@/lib/longevity-utils';

// This component should not have its own background or layout styling,
// as it will be placed inside a styled grid container.

type Perfume = Database['public']['Tables']['perfumes']['Row'] & {
  scent_profile?: Record<string, number>;
  longevity_rating?: number | null;
  sillage_rating?: number | null;
  best_season?: string[] | null;
  best_time?: string | null;
};

// Helper function for Sillage description
const getSillageDescription = (rating: number | null | undefined): string => {
  if (rating === null || rating === undefined) return 'Moderate';
  if (rating >= 1 && rating <= 3) return 'Intimate';
  if (rating >= 4 && rating <= 5) return 'Moderate';
  if (rating >= 6 && rating <= 7) return 'Strong';
  if (rating === 8) return 'Enormous';
  if (rating === 9) return 'Beast Mode';
  if (rating === 10) return 'Suffocating';
  return 'Moderate';
};

interface PerfumeDashboardProps {
  perfume: Perfume;
}

export default function PerfumeDashboard({ perfume }: PerfumeDashboardProps) {
  // This now only returns the content for the left column of the grid.
  return (
    <div className="space-y-12">
      {/* Context */}
      <div>
        <h4 className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 pb-2 border-b border-stone-200">
          Context <span className="flex-1 h-px bg-stone-200"></span>
        </h4>
        <div className="space-y-6">
          <div>
            <span className="block text-[9px] font-bold text-stone-400 uppercase mb-3">Best Season</span>
            <div className="flex gap-2">
              {[
                { name: 'Spring', icon: '/icons/leaf.svg', active: perfume.best_season?.includes('Spring') },
                { name: 'Summer', icon: '/icons/sun.svg', active: perfume.best_season?.includes('Summer') },
                { name: 'Fall', icon: '/icons/leaf.svg', active: perfume.best_season?.includes('Fall') },
                { name: 'Winter', icon: '/icons/snowflake.svg', active: perfume.best_season?.includes('Winter') }
              ].map(s => (
                <div key={s.name} title={s.name} className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${s.active ? 'bg-stone-900 border-stone-900 shadow-md' : 'bg-stone-100 border-stone-200'}`}>
                  <img 
                    src={s.icon} 
                    alt={s.name} 
                    className={`w-5 h-5 transition-all ${s.active ? 'invert' : 'filter grayscale brightness-150 contrast-50'}`} 
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-[9px] font-bold text-stone-400 uppercase mb-3">Best Time</span>
            <div className="flex gap-2">
                <div title="Day" className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${!perfume.best_time || perfume.best_time === 'Day' || perfume.best_time === 'All Day' ? 'bg-stone-900 border-stone-900 shadow-md' : 'bg-stone-100 border-stone-200'}`}>
                  <img 
                    src="/icons/sun.svg" 
                    alt="Day" 
                    className={`w-5 h-5 transition-all ${!perfume.best_time || perfume.best_time === 'Day' || perfume.best_time === 'All Day' ? 'invert' : 'filter grayscale brightness-150 contrast-50'}`}
                  />
                </div>
                <div title="Night" className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${perfume.best_time === 'Night' || perfume.best_time === 'All Day' ? 'bg-stone-900 border-stone-900 shadow-md' : 'bg-stone-100 border-stone-200'}`}>
                  <img 
                    src="/icons/moon.svg" 
                    alt="Night" 
                    className={`w-5 h-5 transition-all ${perfume.best_time === 'Night' || perfume.best_time === 'All Day' ? 'invert' : 'filter grayscale brightness-150 contrast-50'}`}
                  />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div>
        <h4 className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 pb-2 border-b border-stone-200">
          Performance <span className="flex-1 h-px bg-stone-200"></span>
        </h4>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Longevity</span>
              <span className="text-xs font-serif italic text-stone-900">{ratingToDescription(perfume.longevity_rating || 0)}</span>
            </div>
            <div className="flex gap-1 h-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(step => (
                <div key={step} className={`flex-1 rounded-full transition-all duration-1000 ${(perfume.longevity_rating || 0) >= step ? 'bg-stone-800' : 'bg-stone-100'}`} />
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Sillage</span>
              <span className="text-xs font-serif italic text-stone-900">{getSillageDescription(perfume.sillage_rating)}</span>
            </div>
            <div className="flex gap-1 h-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(step => (
                <div key={step} className={`flex-1 rounded-full transition-all duration-1000 ${(perfume.sillage_rating || 0) >= step ? 'bg-stone-800' : 'bg-stone-100'}`} />
              ))}
            </div>
          </div>                      
        </div>
      </div>

      {/* Radar */}
      <div>
        <h4 className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 pb-2 border-b border-stone-200">
          Scent DNA <span className="flex-1 h-px bg-stone-200"></span>
        </h4>
        <div className="-ml-4 -mt-4">
          <ScentRadar profile={(perfume.scent_profile && Object.keys(perfume.scent_profile).length > 0) ? perfume.scent_profile : { fresh: 5, sweet: 5, spicy: 5, woody: 5, floral: 5 }} />
        </div>
      </div>
    </div>
  );
}