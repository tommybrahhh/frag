'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RecommendationCategory } from '@/lib/recommendation-engine';
import LayeringCard from '@/components/features/perfume/LayeringCard';
import type { Perfume } from '@/components/features/perfume/PerfumeClientView';

interface PerfumeRecommendationsProps {
  mainPerfume: Perfume;
  recommendationCategories: RecommendationCategory[];
}

const RecommendationSection = ({ category, mainPerfume }: { category: RecommendationCategory, mainPerfume: Perfume }) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [layeringIndex, setLayeringIndex] = useState(0);

  const isLayering = category.type === 'layering';

  const visibleRecommendations = isLayering
    ? [category.recommendations[layeringIndex]].filter(Boolean)
    : (isExpanded ? category.recommendations : category.recommendations.slice(0, 3));
    
  const hasHiddenItems = !isLayering && category.recommendations.length > 3;

  const handleRecommendationClick = (slug: string) => {
    router.push(`/perfume/${slug}`);
  };

  const handleRefreshLayering = () => {
    setLayeringIndex((prev) => (prev + 1) % category.recommendations.length);
  };

  return (
    <section>
      <div className="mb-8 border-b border-stone-100 pb-4">
        <h3 className="font-serif text-xl md:text-2xl text-stone-900 mb-2">{category.title}</h3>
        <p className="text-stone-500 text-xs md:text-sm">{category.description}</p>
      </div>
      
      {category.recommendations && category.recommendations.length > 0 ? (
        <>
          <div className="flex overflow-x-auto pb-8 gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
            {visibleRecommendations.map((rec) => (
              isLayering ? (
                <div key={rec.perfume.id} className="shrink-0 w-[calc(100vw-48px)] md:w-auto">
                  <LayeringCard 
                      mainPerfume={mainPerfume} 
                      recommendation={rec} 
                      onRefresh={handleRefreshLayering}
                  />
                </div>
              ) : (
                <div 
                  key={rec.perfume.id} 
                  className="group cursor-pointer shrink-0 w-[240px] md:w-auto" 
                  onClick={() => handleRecommendationClick(rec.perfume.slug || rec.perfume.id)}
                >
                  <div className="relative h-[240px] md:h-[320px] bg-stone-50 rounded-2xl mb-4 flex items-center justify-center p-6 transition-colors group-hover:bg-[#F0F0F0] overflow-hidden">
                    {/* Compare Button */}
                    <div 
                      className="absolute top-3 left-3 md:top-4 md:left-4 z-30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a 
                        href={`/compare?ids=${mainPerfume.id},${rec.perfume.id}`}
                        className="flex items-center justify-center w-8 h-8 bg-white/90 backdrop-blur rounded-full border border-stone-200 shadow-sm text-stone-500 hover:text-stone-900 hover:border-stone-900 transition-all"
                        title="Compare"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l5 5M4 4l5 5"/>
                        </svg>
                      </a>
                    </div>

                    <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-white/90 backdrop-blur px-2 py-0.5 md:py-1 rounded-full border border-stone-100 shadow-sm z-10">
                      <span className="text-[9px] md:text-[10px] font-bold text-stone-900 tabular-nums">{Math.round(rec.score)}% Match</span>
                    </div>
                    {rec.perfume.image_url ? (
                      <img src={rec.perfume.image_url} className="h-full w-full object-contain mix-blend-multiply p-4" alt={rec.perfume.name} />
                    ) : (
                      <span className="text-stone-300 text-xs">No Image</span>
                    )}

                    {/* Desktop Hover Overlay (Hidden on Mobile for cleaner scroll) */}
                    <div className="hidden md:flex absolute inset-0 bg-white/95 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex-col z-20 text-left shadow-inner">
                      {/* ... existing hover content ... */}
                      <div className="flex justify-between items-start mb-6 border-b border-stone-100 pb-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Match Score</div>
                          <div className="text-2xl font-serif text-stone-900">{Math.round(rec.score)}%</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Price</div>
                           <div className={`text-sm font-bold ${
                             rec.priceComparison === 'cheaper' ? 'text-green-600' : 
                             rec.priceComparison === 'premium' ? 'text-stone-900' : 'text-stone-500'
                           }`}>
                             {rec.priceComparison === 'cheaper' ? 'Lower Price' : 
                              rec.priceComparison === 'premium' ? 'Premium' : 'Similar'}
                           </div>
                        </div>
                      </div>
                      
                      <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                        {(rec.sharedNotes?.length || 0) > 0 && (
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-2">Shared DNA</span>
                            <div className="flex flex-wrap gap-1.5">
                              {rec.sharedNotes!.slice(0, 3).map((note, i) => (
                                <span key={`${note}-${i}`} className="text-[10px] px-2 py-1 bg-stone-100 rounded-md text-stone-700 capitalize border border-stone-200">
                                  {note}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {rec.perfume.scent_profile && (
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-2">Main Accords</span>
                            <div className="space-y-1.5">
                               {Object.entries(rec.perfume.scent_profile)
                                  .sort(([,a], [,b]) => (b as number) - (a as number))
                                  .slice(0, 2)
                                  .map(([accord, value]) => (
                                    <div key={accord} className="flex items-center gap-2">
                                      <span className="text-[10px] w-16 capitalize truncate text-stone-600">{accord}</span>
                                      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-stone-400 rounded-full" style={{ width: `${Math.min(100, (value as number) * 10)}%` }}></div>
                                      </div>
                                    </div>
                                  ))
                               }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-center md:text-left px-2">
                    <div className="text-[8px] md:text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1">{rec.perfume.brand?.name}</div>
                    <h4 className="font-serif text-base md:text-lg text-stone-900 group-hover:text-stone-600 transition truncate">{rec.perfume.name}</h4>
                    <p className="text-[10px] md:text-xs text-stone-500 mt-1 line-clamp-1">{rec.reason}</p>
                  </div>
                </div>
              )
            ))}
          </div>

          {hasHiddenItems && (
             <div className="mt-8 text-center md:text-left">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-full text-xs font-bold uppercase tracking-widest text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all"
                >
                  {isExpanded ? 'Show Less' : `Show All`}
                </button>
             </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-48 bg-stone-50 rounded-2xl">
          <div className="text-center text-stone-400 italic text-xs">
            No recommendations available.
          </div>
        </div>
      )}
    </section>
  );
};

export default function PerfumeRecommendations({ mainPerfume, recommendationCategories }: PerfumeRecommendationsProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 mt-24 mb-20 space-y-24">
      {recommendationCategories.map(category => (
        <RecommendationSection key={category.type} category={category} mainPerfume={mainPerfume} />
      ))}
    </div>
  );
}
