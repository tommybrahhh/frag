'use client';

import React from 'react';
import type { Recommendation } from '@/lib/recommendation-engine';
import type { Perfume } from '@/components/features/perfume/PerfumeClientView'; // Re-use the main perfume type

interface LayeringCardProps {
  mainPerfume: Perfume;
  recommendation: Recommendation;
}

// A small helper component for rendering performance bars with original vs new values
const PerfBar = ({ originalValue, newValue }: { originalValue: number, newValue: number }) => {
  const original = Math.round(originalValue);
  const combined = Math.round(newValue);

  return (
    <div className="flex gap-0.5 h-2 w-full max-w-[120px]">
      {[...Array(10)].map((_, i) => {
        let bgColor = 'bg-stone-200'; // Empty part of the bar
        if (i < combined) bgColor = 'bg-stone-800'; // The "new" part (darkest)
        if (i < original) bgColor = 'bg-stone-500'; // The "original" part (mid-tone)
        
        return <div key={i} className={`flex-1 rounded-full ${bgColor}`} />;
      })}
    </div>
  );
};

export default function LayeringCard({ mainPerfume, recommendation }: LayeringCardProps) {
  const { perfume: candidatePerfume, resultingScent } = recommendation;

  // Don't render if the crucial 'resultingScent' data is missing
  if (!resultingScent) {
    return null;
  }

  return (
    <div className="bg-stone-100 border border-stone-200/80 rounded-2xl p-4 md:p-6 w-full col-span-1 sm:col-span-2 lg:col-span-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Perfume 1 (Main) */}
        <div className="flex flex-col items-center text-center h-full">
          <div className="relative h-28 w-28 flex items-center justify-center">
            {mainPerfume.image_url ? (
                <img src={mainPerfume.image_url} alt={mainPerfume.name} className="h-full w-full object-contain mix-blend-multiply" />
            ) : (
                <span className="text-stone-300 text-xs italic">No Image</span>
            )}
          </div>
          <p className="font-bold text-sm mt-2 w-full truncate" title={mainPerfume.name}>{mainPerfume.name}</p>
          <p className="text-xs text-stone-500 w-full truncate" title={mainPerfume.brand?.name}>{mainPerfume.brand?.name}</p>
        </div>

        {/* Plus Icon & Candidate Perfume */}
        <div className="flex flex-col items-center text-center h-full">
            <div className="text-3xl text-stone-300 mb-2 font-thin">+</div>
            <div className="relative h-28 w-28 flex items-center justify-center">
              {candidatePerfume.image_url ? (
                  <img src={candidatePerfume.image_url} alt={candidatePerfume.name} className="h-full w-full object-contain mix-blend-multiply" />
              ) : (
                  <span className="text-stone-300 text-xs italic">No Image</span>
              )}
            </div>
            <p className="font-bold text-sm mt-2 w-full truncate" title={candidatePerfume.name}>{candidatePerfume.name}</p>
            <p className="text-xs text-stone-500 w-full truncate" title={candidatePerfume.brand?.name}>{candidatePerfume.brand?.name}</p>
        </div>

        {/* Equals and Resulting Scent */}
        <div className="flex flex-col items-center bg-stone-50 p-4 rounded-xl shadow-md border border-stone-200 h-full justify-between">
            <div className="text-3xl text-stone-300 mb-2 font-thin">=</div>
            
            <div className="w-full space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-stone-600">Longevity</p>
                    <PerfBar originalValue={mainPerfume.longevity_rating || 0} newValue={resultingScent.longevity} />
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-stone-600">Sillage</p>
                    <PerfBar originalValue={mainPerfume.sillage_rating || 0} newValue={resultingScent.sillage} />
                </div>
                 <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-stone-600">Occasion</p>
                    <p className="text-stone-500 truncate" title={resultingScent.occasion}>{resultingScent.occasion}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}