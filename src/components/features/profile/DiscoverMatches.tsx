'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Recommendation } from '@/lib/recommendation-engine';
import { getPerfumeImage } from '@/lib/perfume-utils';

interface DiscoverMatchesProps {
  topMatches: Recommendation[];
}

export default function DiscoverMatches({ topMatches }: DiscoverMatchesProps) {
  // Categorize Top Matches by Brand Tier
  const categorizedTopMatches = useMemo(() => {
    const categoryOrder = ["Niche", "Designer", "Indie", "Celebrity", "Historical", "Other"];
    const grouped: Record<string, Recommendation[]> = {
      "Niche": [],
      "Designer": [],
      "Indie": [],
      "Celebrity": [],
      "Historical": [],
      "Other": []
    };

    topMatches.forEach(rec => {
      const tier = rec.perfume.brand?.tier;
      if (tier && categoryOrder.includes(tier)) {
        grouped[tier].push(rec);
      } else {
        grouped["Other"].push(rec);
      }
    });

    // Sort categories based on predefined order
    const sortedGrouped: Record<string, Recommendation[]> = {};
    categoryOrder.forEach(category => {
      if (grouped[category] && grouped[category].length > 0) {
        sortedGrouped[category] = grouped[category];
      }
    });
    // Add any categories not in categoryOrder (e.g., new tiers) at the end
    for (const category in grouped) {
        if (!categoryOrder.includes(category) && grouped[category].length > 0) {
            sortedGrouped[category] = grouped[category];
        }
    }

    return sortedGrouped;
  }, [topMatches]);

  if (topMatches.length === 0) return null;

  return (
    <div className="pt-12 border-t border-stone-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Curated For You</span>
          <h2 className="font-serif text-2xl text-stone-900 mt-1">Discover</h2>
          <p className="text-stone-500 text-sm mt-1">Highly compatible with your taste profile, categorized by brand tier.</p>
        </div>
      </div>
      
      {Object.entries(categorizedTopMatches).map(([category, recommendations]) => (
          recommendations.length > 0 && (
              <div key={category} className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                      <h3 className="font-serif text-xl text-stone-900">
                          {category} Perfumes
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs font-bold">
                          {recommendations.length}
                      </span>
                      <div className="h-px bg-stone-100 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {recommendations.map((rec) => (
                      <Link 
                      key={rec.perfume.id} 
                      href={`/perfume/${rec.perfume.slug || rec.perfume.id}`}
                      className="group relative bg-white rounded-lg border border-stone-100 p-4 hover:border-stone-200 hover:shadow-sm transition-all duration-300 h-full flex flex-col"
                      >
                      <div className="h-44 flex items-center justify-center p-6 mb-4 bg-stone-50 rounded group-hover:bg-white transition-colors relative overflow-hidden">
                          {/* Match Badge */}
                          <div className="absolute top-2 right-2 bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">
                          {Math.round(rec.score)}%
                          </div>
                          
                          {rec.perfume.image_url ? (
                          <img src={getPerfumeImage(rec.perfume.image_url)} alt={rec.perfume.name} className="h-full object-contain mix-blend-multiply opacity-90 group-hover:opacity-100 transition-all duration-500" />
                          ) : (
                          <span className="text-stone-300 text-[10px] font-bold uppercase tracking-widest">N/A</span>
                          )}
                      </div>
                      
                      <div className="flex-1 flex flex-col text-center">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                          {rec.perfume.brand?.name}
                          </div>
                          <div className="font-serif text-lg text-stone-900 leading-tight mb-3 group-hover:text-stone-600 transition-colors">
                          {rec.perfume.name}
                          </div>
                          
                          <div className="mt-auto pt-4 border-t border-stone-50">
                              <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2 italic">
                                  &quot;{rec.reason}&quot;
                              </p>
                          </div>
                      </div>
                      </Link>
                  ))}
                  </div>
              </div>
          )
      ))}
    </div>
  );
}
