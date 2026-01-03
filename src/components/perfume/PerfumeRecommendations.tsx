'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RecommendationCategory } from '@/lib/recommendation-engine';
import type { Perfume } from '@/components/perfume/PerfumeClientView';
import LayeringCard from './LayeringCard';
import DiscoveryCard from './DiscoveryCard';

interface PerfumeRecommendationsProps {
  perfume: Perfume;
  recommendationCategories: RecommendationCategory[];
}

export default function PerfumeRecommendations({ perfume, recommendationCategories }: PerfumeRecommendationsProps) {
  const router = useRouter();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const handleRecommendationClick = (id: number) => {
    router.push(`/perfume/${id}`);
  };

  const toggleCategory = (type: string) => {
    setExpandedCategories(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="max-w-6xl mx-auto px-6 mt-24 mb-20 space-y-24">
      {recommendationCategories.map(category => {
        const expandableCategories = ['price_same', 'price_cheaper_1_2', 'price_upgrade_4', 'price_cheaper_3', 'price_cheaper_1'];
        const isExpanded = !!expandedCategories[category.type];
        const canExpand = expandableCategories.includes(category.type) && category.recommendations.length > 6;
        
        const itemsToShow = canExpand && !isExpanded 
          ? category.recommendations.slice(0, 6) 
          : category.recommendations;

        return (
          <section key={category.type}>
            <div className="mb-8 border-b border-stone-100 pb-4">
              <h3 className="font-serif text-2xl text-stone-900 mb-2">{category.title}</h3>
              <p className="text-stone-500 text-sm">{category.description}</p>
            </div>
            
            {itemsToShow && itemsToShow.length > 0 ? (
              <>
                {(() => {
                  if (category.type === 'layering') {
                    return itemsToShow.map((rec) => (
                      <LayeringCard key={rec.perfume.id} mainPerfume={perfume} recommendation={rec} />
                    ));
                  }
                  if (category.type === 'discovery') {
                    // Since discovery only has one item, we can just take the first.
                    return <DiscoveryCard recommendation={itemsToShow[0]} />;
                  }
                  // Default case: render the grid
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {itemsToShow.map((rec) => (
                        <div key={rec.perfume.id} className="group cursor-pointer" onClick={() => handleRecommendationClick(rec.perfume.id)}>
                          <div className="relative h-[320px] bg-stone-50 rounded-2xl mb-4 flex items-center justify-center p-6 transition-colors group-hover:bg-[#F0F0F0]">
                            {rec.score > 0 && (
                              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-full border border-stone-100 shadow-sm z-10">
                                <span className="text-[10px] font-bold text-stone-900 tabular-nums">{rec.score}% Match</span>
                              </div>
                            )}
                            {rec.perfume.image_url ? (
                              <img src={rec.perfume.image_url} className="h-full w-full object-contain mix-blend-multiply" alt={rec.perfume.name} />
                            ) : (
                              <span className="text-stone-300 text-xs">No Image</span>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1">{rec.perfume.brand?.name}</div>
                            <h4 className="font-serif text-lg text-stone-900 group-hover:text-stone-600 transition">{rec.perfume.name}</h4>
                            <p 
                              className="text-sm text-stone-600 mt-2"
                              dangerouslySetInnerHTML={{ __html: rec.reason }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                
                {canExpand && (
                  <div className="mt-8 text-center">
                    <button 
                      onClick={() => toggleCategory(category.type)}
                      className="py-2 px-6 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest hover:border-stone-900 hover:text-stone-900 transition-colors rounded-full"
                    >
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-48 bg-stone-50 rounded-2xl">
                <div className="text-center text-stone-400 italic">
                  <p>No recommendations available for this category right now.</p>
                  <p className="text-xs mt-2">Check back later for new suggestions!</p>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
