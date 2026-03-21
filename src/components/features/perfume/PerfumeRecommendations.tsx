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
  const [layeringIndex, setLayeringIndex] = useState(0);

  const isLayering = category.type === 'layering';

  const visibleRecommendations = isLayering
    ? [category.recommendations[layeringIndex]].filter(Boolean)
    : category.recommendations.slice(0, 4);

  const handleRecommendationClick = (slug: string) => {
    router.push(`/perfume/${slug}`);
  };

  const handleRefreshLayering = () => {
    setLayeringIndex((prev) => (prev + 1) % category.recommendations.length);
  };

  const getPathLabel = (type: string) => {
    switch (type) {
      case 'performance_upgrade': return 'The Upgrade';
      case 'niche_leap': return 'Niche Leap';
      case 'seasonal_mirror': return 'Seasonal Pivot';
      case 'note_isolator': return 'Note Spotlight';
      case 'vibe_evolution': return 'New Energy';
      case 'structural_shift': return 'Pure Base';
      default: return 'Pure Match';
    }
  };

  const getVibeColor = (vibe?: string) => {
    const v = vibe?.toLowerCase();
    if (!v) return 'rgba(214,211,209,0.2)'; // stone-200
    if (v.includes('fresh') || v.includes('clean')) return 'rgba(186,230,253,0.3)'; // sky-200
    if (v.includes('warm') || v.includes('spicy')) return 'rgba(254,215,170,0.3)'; // orange-200
    if (v.includes('woody') || v.includes('earthy')) return 'rgba(209,213,219,0.3)'; // gray-300
    if (v.includes('floral')) return 'rgba(251,207,232,0.3)'; // pink-200
    return 'rgba(214,211,209,0.2)';
  };

  return (
    <section className="mt-12 md:mt-24">
      <div className="mb-10 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-px bg-stone-900" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">Curated Discovery</span>
            </div>
            <h3 className="font-serif text-3xl md:text-5xl text-stone-900 mb-4">{category.title}</h3>
            <p className="text-stone-600 text-sm md:text-base font-light leading-relaxed">{category.description}</p>
          </div>
          <div className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-stone-300 border-l border-stone-100 pl-6 py-2">
            AI-Engine <br/> Generated
          </div>
      </div>
      
      {category.recommendations && category.recommendations.length > 0 ? (
        <div className="flex overflow-x-auto pb-12 gap-6 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-10 hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
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
                className="group cursor-pointer shrink-0 w-[280px] md:w-auto" 
                onClick={() => handleRecommendationClick(rec.perfume.slug || rec.perfume.id)}
              >
                <div className="relative aspect-[4/5] bg-[#FAFAF9] rounded-[2.5rem] mb-8 flex items-center justify-center p-10 transition-all duration-700 group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] overflow-hidden border border-stone-100/50 group-hover:border-stone-200/50">
                  
                  {/* Path Label Badge */}
                  <div className="absolute top-8 left-8 z-30 transform -rotate-1 group-hover:rotate-0 transition-all duration-500">
                     <span className="px-3 py-1 bg-white text-[9px] font-black uppercase tracking-[0.1em] text-stone-900 rounded-md border border-stone-100 shadow-sm group-hover:shadow-md transition-all">
                        {getPathLabel(rec.type)}
                     </span>
                  </div>

                  {/* Match DNA Indicator */}
                  <div className="absolute top-8 right-8 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                    <div className="flex items-center gap-2 bg-stone-900/5 backdrop-blur-sm px-2 py-1 rounded-full">
                      <div className="w-1 h-1 rounded-full bg-stone-900 animate-pulse" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-stone-900">DNA Sync</span>
                    </div>
                  </div>

                  {/* Glassmorphic Match Score - Floating Bottom Right */}
                  <div className="absolute bottom-8 right-8 z-30 transition-transform duration-700 group-hover:scale-110 group-hover:-translate-y-2">
                    <div className="bg-white/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] text-center min-w-[70px]">
                      <div className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter mb-0.5">Match</div>
                      <div className="text-sm font-serif text-stone-900 leading-none">{Math.round(rec.score)}%</div>
                    </div>
                  </div>

                  {rec.perfume.image_url ? (
                    <img 
                      src={getPerfumeImage(rec.perfume.image_url)} 
                      className="relative z-10 h-[80%] w-[80%] object-contain mix-blend-multiply transition-transform duration-1000 ease-out group-hover:scale-110" 
                      alt={rec.perfume.name} 
                    />
                  ) : (
                    <span className="relative z-10 text-stone-300 text-[10px] font-bold uppercase tracking-widest">No Image</span>
                  )}

                  {/* Intensity Shift Badge - Floating Bottom Left */}
                  {rec.intensityShift && (
                     <div className="absolute bottom-8 left-8 z-30 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">Character Shift</span>
                           <div className="inline-flex px-3 py-1.5 bg-stone-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-xl">
                              {rec.intensityShift.label} +{rec.intensityShift.value}%
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Vibe-Aura Background */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${getVibeColor(rec.perfume.vibe_tags?.[0])} 0%, transparent 70%)` }}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.02)_0%,transparent_50%)]" />
                </div>

                <div className="px-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-[10px] font-bold tracking-[0.3em] text-stone-400 uppercase group-hover:text-stone-600 transition-colors">{rec.perfume.brand?.name}</div>
                    <div className="h-px flex-1 bg-stone-100 group-hover:bg-stone-200 transition-colors" />
                  </div>
                  
                  <h4 className="font-serif text-xl md:text-2xl text-stone-900 group-hover:text-stone-700 transition-all mb-4 line-clamp-1 decoration-stone-200 decoration-1 underline-offset-4 group-hover:underline">
                    {rec.perfume.name}
                  </h4>
                  
                  <p className="text-[13px] text-stone-500 font-light line-clamp-2 leading-relaxed italic border-l-2 border-stone-100 pl-4 group-hover:border-stone-900 transition-colors duration-500">
                    {rec.reason}
                  </p>
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
          <div className="text-center text-stone-400 italic text-sm">
            Curating your discovery path...
          </div>
        </div>
      )}
    </section>
  );
};

export default function PerfumeRecommendations({ mainPerfume, recommendationCategories }: PerfumeRecommendationsProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 mt-12 mb-20 space-y-12">
      {recommendationCategories.map(category => (
        <RecommendationSection key={category.type} category={category} mainPerfume={mainPerfume} />
      ))}
    </div>
  );
}
