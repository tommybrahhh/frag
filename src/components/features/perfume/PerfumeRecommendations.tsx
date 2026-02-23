'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RecommendationCategory } from '@/lib/recommendation-engine';
import LayeringCard from '@/components/features/perfume/LayeringCard';
import type { Perfume } from '@/components/features/perfume/PerfumeClientView';
import { getPerfumeImage } from '@/lib/perfume-utils';

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
      <div className="mb-10 md:mb-12 border-b border-stone-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl md:text-4xl text-stone-900 mb-3">{category.title}</h3>
          <p className="text-stone-600 text-sm md:text-base font-light max-w-2xl">{category.description}</p>
        </div>
        {hasHiddenItems && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden md:inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
          >
            {isExpanded ? 'Show Less' : `View All (${category.recommendations.length})`}
          </button>
        )}
      </div>
      
      {category.recommendations && category.recommendations.length > 0 ? (
        <>
          <div className="flex overflow-x-auto pb-8 gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-12 hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
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
                  className="group cursor-pointer shrink-0 w-[260px] md:w-auto" 
                  onClick={() => handleRecommendationClick(rec.perfume.slug || rec.perfume.id)}
                >
                  <div className="relative aspect-[4/5] md:aspect-square bg-stone-50 border border-stone-100 rounded-[2rem] mb-6 flex items-center justify-center p-8 transition-all duration-500 group-hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] overflow-hidden">
                    {/* Compare Button */}
                    <div 
                      className="absolute top-4 left-4 md:top-6 md:left-6 z-30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a 
                        href={`/compare?ids=${mainPerfume.id},${rec.perfume.id}`}
                        className="flex items-center justify-center w-9 h-9 bg-white/90 backdrop-blur rounded-full border border-stone-100 shadow-sm text-stone-500 hover:text-stone-900 hover:border-stone-900 transition-all active:scale-90"
                        title="Compare"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l5 5M4 4l5 5"/>
                        </svg>
                      </a>
                    </div>

                    <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-stone-50 shadow-sm z-10">
                      <span className="text-[10px] md:text-[11px] font-bold text-stone-900 tabular-nums tracking-tight">{Math.round(rec.score)}% Match</span>
                    </div>
                    {rec.perfume.image_url ? (
                      <img src={getPerfumeImage(rec.perfume.image_url)} className="h-[80%] w-[80%] object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110" alt={rec.perfume.name} />
                    ) : (
                      <span className="text-stone-300 text-xs font-bold uppercase tracking-widest">No Image</span>
                    )}

                    {/* Desktop Hover Overlay */}
                    <div className="hidden md:flex absolute inset-0 bg-white/98 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 p-8 flex-col z-20 text-left shadow-inner translate-y-4 group-hover:translate-y-0">
                      <div className="flex justify-between items-start mb-6 border-b border-stone-100 pb-4">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Match Score</div>
                          <div className="text-3xl font-serif text-stone-900">{Math.round(rec.score)}%</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Price</div>
                           <div className={`text-sm font-bold uppercase tracking-widest ${
                             rec.priceComparison === 'cheaper' ? 'text-emerald-600' : 
                             rec.priceComparison === 'premium' ? 'text-stone-900' : 'text-stone-600'
                           }`}>
                             {rec.priceComparison === 'cheaper' ? 'Affordable' : 
                              rec.priceComparison === 'premium' ? 'Premium' : 'Similar'}
                           </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {(rec.sharedNotes?.length || 0) > 0 && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-3">Shared Notes</span>
                            <div className="flex flex-wrap gap-2">
                              {rec.sharedNotes!.slice(0, 4).map((note, i) => (
                                <span key={`${note}-${i}`} className="text-[11px] px-3 py-1.5 bg-stone-50 rounded-lg text-stone-800 font-medium capitalize border border-stone-100">
                                  {note}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {rec.perfume.scent_profile && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-3">Scent Profile</span>
                            <div className="space-y-2.5">
                               {Object.entries(rec.perfume.scent_profile)
                                  .sort(([,a], [,b]) => (b as number) - (a as number))
                                  .slice(0, 3)
                                  .map(([accord, value]) => (
                                    <div key={accord} className="flex items-center gap-3">
                                      <span className="text-[11px] w-20 capitalize truncate text-stone-700 font-medium">{accord}</span>
                                      <div className="flex-1 h-2 bg-stone-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-stone-900/10 rounded-full" style={{ width: `${Math.min(100, (value as number) * 10)}%` }}></div>
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
                  <div className="text-center md:text-left px-1">
                    <div className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-2">{rec.perfume.brand?.name}</div>
                    <h4 className="font-serif text-xl md:text-2xl text-stone-900 group-hover:text-stone-600 transition truncate mb-2">{rec.perfume.name}</h4>
                    <p className="text-xs md:text-sm text-stone-600 font-light line-clamp-2 leading-relaxed italic">{rec.reason}</p>
                  </div>
                </div>
              )
            ))}
          </div>

          {hasHiddenItems && (
             <div className="mt-8 text-center md:hidden">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full py-4 bg-white border border-stone-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-stone-600 active:bg-stone-50 transition-all"
                >
                  {isExpanded ? 'Show Less' : `View All Recommendations`}
                </button>
             </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-48 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
          <div className="text-center text-stone-400 italic text-sm">
            No similar scents found in the vault.
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
