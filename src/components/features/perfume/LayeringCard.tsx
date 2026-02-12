'use client';

import React from 'react';
import Link from 'next/link';
import type { Recommendation } from '@/lib/recommendation-engine';
import type { Perfume } from '@/components/features/perfume/PerfumeClientView';
import ScentRadar from '@/components/ui/ScentRadar';

interface LayeringCardProps {
  mainPerfume: Perfume;
  recommendation: Recommendation;
  onRefresh?: () => void;
}

const PerfBar = ({ label, original, result }: { label: string, original: number, result: number }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
        <span className="text-stone-400">{label}</span>
        <span className="text-stone-900">{result.toFixed(1)}/10</span>
      </div>
      <div className="flex gap-1 h-1.5">
        {[...Array(10)].map((_, i) => {
          const step = i + 1;
          let bgColor = 'bg-stone-100';
          if (step <= result) bgColor = 'bg-stone-800';
          if (step <= original && step <= result) bgColor = 'bg-stone-900';
          if (step <= original && step > result) bgColor = 'bg-stone-400';
          
          return (
            <div 
              key={i} 
              className={`flex-1 rounded-full transition-all duration-1000 ${bgColor}`}
              style={{ opacity: step <= result ? 1 : 0.3 }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default function LayeringCard({ mainPerfume, recommendation, onRefresh }: LayeringCardProps) {
  const { perfume: candidatePerfume, resultingScent, score, reason, guidance } = recommendation;

  if (!resultingScent) return null;

  const tips = guidance?.split(' | ') || [];

  return (
    <div className="bg-white border border-stone-200 rounded-[2rem] md:rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 col-span-1 sm:col-span-2 lg:col-span-3">
      <div className="grid lg:grid-cols-[1fr_400px] gap-0">
        
        {/* Left Side: The Experiment */}
        <div className="p-6 md:p-10 flex flex-col">
          <div className="flex items-start justify-between mb-6 md:mb-8">
            <div className="min-w-0 pr-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full mb-3 md:mb-4">
                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-stone-600">Layering Combo</span>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl text-stone-900 mb-1 md:mb-2 truncate">{resultingScent.name}</h3>
              <p className="text-stone-500 text-xs md:text-sm italic leading-relaxed line-clamp-2 md:line-clamp-none">"{reason}"</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5 md:mb-1">Harmony</div>
              <div className="text-2xl md:text-3xl font-serif text-stone-900">{score}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center flex-1">
            {/* Connection Visualization */}
            <div className="relative flex items-center justify-center py-8 md:py-12">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px border-t border-dashed border-stone-200"></div>
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center z-10 shadow-sm">
                  <span className="text-base md:text-xl font-light text-stone-300">+</span>
                </div>
              </div>

              <div className="grid grid-cols-2 w-full gap-8 md:gap-20 relative z-0">
                {/* Main Perfume */}
                <div className="flex flex-col items-center text-center min-w-0">
                  <div className="relative h-20 w-20 md:h-32 md:w-32 bg-stone-50 rounded-xl md:rounded-2xl flex items-center justify-center p-3 md:p-4 mb-3 md:mb-4">
                    {mainPerfume.image_url ? (
                      <img src={mainPerfume.image_url} alt={mainPerfume.name} className="h-full w-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="text-stone-300 text-[8px] md:text-xs">No Image</span>
                    )}
                  </div>
                  <div className="text-[8px] md:text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-0.5 truncate w-full">{mainPerfume.brand?.name}</div>
                  <div className="text-[10px] md:text-sm font-medium text-stone-900 truncate w-full px-1 md:px-2">{mainPerfume.name}</div>
                </div>

                {/* Candidate Perfume */}
                <div className="relative group min-w-0">
                    {onRefresh && (
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRefresh();
                            }}
                            className="absolute -top-1 -right-1 md:-top-2 md:-right-2 z-30 w-6 h-6 md:w-8 md:h-8 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 shadow-sm transition-all"
                            title="Discover new pairing"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                <path d="M16 21h5v-5" />
                            </svg>
                        </button>
                    )}
                    <Link href={`/perfume/${candidatePerfume.slug || candidatePerfume.id}`} className="flex flex-col items-center text-center group">
                    <div className="relative h-20 w-20 md:h-32 md:w-32 bg-stone-50 rounded-xl md:rounded-2xl flex items-center justify-center p-3 md:p-4 mb-3 md:mb-4 group-hover:bg-stone-100 transition-colors">
                        {candidatePerfume.image_url ? (
                        <img src={candidatePerfume.image_url} alt={candidatePerfume.name} className="h-full w-full object-contain mix-blend-multiply" />
                        ) : (
                        <span className="text-stone-300 text-[8px] md:text-xs">No Image</span>
                        )}
                    </div>
                    <div className="text-[8px] md:text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-0.5 truncate w-full">{candidatePerfume.brand?.name}</div>
                    <div className="text-[10px] md:text-sm font-medium text-stone-900 truncate w-full px-1 md:px-2 group-hover:text-stone-600 transition-colors">{candidatePerfume.name}</div>
                    </Link>
                </div>
              </div>
            </div>

            {/* Mixing Tips */}
            <div className="space-y-5 md:space-y-6">
              <div>
                <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 md:mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-stone-400"></span>
                  Alchemy Notes
                </h4>
                <div className="space-y-2.5 md:space-y-3">
                  {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-stone-300 text-[10px] md:text-xs mt-0.5">0{i+1}</span>
                      <p className="text-xs md:text-sm text-stone-600 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-5 md:pt-6 border-t border-stone-100">
                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <PerfBar label="Longevity" original={mainPerfume.longevity_rating || 5} result={resultingScent.longevity} />
                  <PerfBar label="Sillage" original={mainPerfume.sillage_rating || 5} result={resultingScent.sillage} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Resulting DNA */}
        <div className="bg-stone-50 p-6 md:p-10 border-t lg:border-t-0 lg:border-l border-stone-100 flex flex-col justify-center min-h-[400px] md:min-h-0">
          <div className="text-center mb-6 md:mb-8">
            <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5 md:mb-2">Resulting DNA</h4>
            <div className="text-lg md:text-xl font-serif text-stone-900 truncate px-2">{resultingScent.family}</div>
            <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-1">Best for {resultingScent.occasion}</div>
          </div>

          <div className="relative h-48 md:h-64 w-full flex items-center justify-center">
             <ScentRadar profile={resultingScent.profile} />
          </div>

          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-stone-200/50 flex flex-col gap-4">
             <div className="grid grid-cols-3 gap-2">
                {Object.entries(resultingScent.profile)
                  .sort((a, b) => (b[1] as number) - (a as number))
                  .slice(0, 3)
                  .map(([trait, value]) => (
                    <div key={trait} className="text-center min-w-0">
                       <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1 truncate px-1">{trait}</div>
                       <div className="text-[10px] md:text-xs font-medium text-stone-900">{Math.round((value as number) * 10)}%</div>
                    </div>
                  ))
                }
             </div>
             <Link 
                href={`/layering?base=${mainPerfume.slug}&top=${candidatePerfume.slug}`}
                className="w-full py-3 bg-stone-900 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center rounded-xl hover:bg-stone-800 transition-colors shadow-md active:scale-95"
             >
                Studio →
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
