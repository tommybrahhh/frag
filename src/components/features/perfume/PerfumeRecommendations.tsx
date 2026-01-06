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

  const visibleRecommendations = isExpanded 
    ? category.recommendations 
    : category.recommendations.slice(0, 6);
    
  const hasHiddenItems = category.recommendations.length > 6;

  const handleRecommendationClick = (id: string) => {
    router.push(`/perfume/${id}`);
  };

  return (
    <section>
      <div className="mb-8 border-b border-stone-100 pb-4">
        <h3 className="font-serif text-2xl text-stone-900 mb-2">{category.title}</h3>
        <p className="text-stone-500 text-sm">{category.description}</p>
      </div>
      
      {category.recommendations && category.recommendations.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleRecommendations.map((rec) => (
              category.type === 'layering' ? (
                <LayeringCard key={rec.perfume.id} mainPerfume={mainPerfume} recommendation={rec} />
              ) : (
                <div key={rec.perfume.id} className="group cursor-pointer" onClick={() => handleRecommendationClick(rec.perfume.id)}>
                  <div className="relative h-[320px] bg-stone-50 rounded-2xl mb-4 flex items-center justify-center p-6 transition-colors group-hover:bg-[#F0F0F0]">
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-full border border-stone-100 shadow-sm z-10">
                      <span className="text-[10px] font-bold text-stone-900 tabular-nums">{rec.score}% Match</span>
                    </div>
                    {rec.perfume.image_url ? (
                      <img src={rec.perfume.image_url} className="h-full w-full object-contain mix-blend-multiply" alt={rec.perfume.name} />
                    ) : (
                      <span className="text-stone-300 text-xs">No Image</span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1">{rec.perfume.brand?.name}</div>
                    <h4 className="font-serif text-lg text-stone-900 group-hover:text-stone-600 transition">{rec.perfume.name}</h4>
                    <p className="text-xs text-stone-500 mt-1">{rec.reason}</p>
                  </div>
                </div>
              )
            ))}
          </div>

          {hasHiddenItems && (
             <div className="mt-8 text-center">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-full text-xs font-bold uppercase tracking-widest text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all shadow-sm hover:shadow-md"
                >
                  {isExpanded ? 'Show Less' : `Show ${category.recommendations.length - 6} More`}
                </button>
             </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-48 bg-stone-50 rounded-2xl">
          <div className="text-center text-stone-400 italic">
            <p>No recommendations available right now.</p>
            <p className="text-xs mt-2">Check back later for new suggestions!</p>
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
