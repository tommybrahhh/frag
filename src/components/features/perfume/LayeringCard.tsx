'use client';

import React from 'react';
import Link from 'next/link';
import type { Recommendation } from '@/lib/recommendation-engine';
import type { Perfume } from '@/components/features/perfume/PerfumeClientView';
import ScentRadar from '@/components/ui/ScentRadar';

interface LayeringCardProps {
  mainPerfume: Perfume;
  recommendation: Recommendation;
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

export default function LayeringCard({ mainPerfume, recommendation }: LayeringCardProps) {
  const { perfume: candidatePerfume, resultingScent, score, reason, guidance } = recommendation;

  if (!resultingScent) return null;

  const tips = guidance?.split(' | ') || [];

  return (
    <div className="bg-white border border-stone-200 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 col-span-1 sm:col-span-2 lg:col-span-3">
      <div className="grid lg:grid-cols-[1fr_400px] gap-0">
        
        {/* Left Side: The Experiment */}
        <div className="p-8 md:p-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Layering</span>
              </div>
              <h3 className="font-serif text-3xl text-stone-900 mb-2">{resultingScent.name}</h3>
              <p className="text-stone-500 text-sm max-w-md italic leading-relaxed">"{reason}"</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Harmony</div>
              <div className="text-3xl font-serif text-stone-900">{score}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Connection Visualization */}
            <div className="relative flex items-center justify-center py-12">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-dashed bg-stone-200"></div>
                <div className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center z-10 shadow-sm">
                  <span className="text-xl font-light text-stone-300">+</span>
                </div>
              </div>

              <div className="grid grid-cols-2 w-full gap-20 relative z-0">
                {/* Main Perfume */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative h-32 w-32 bg-stone-50 rounded-2xl flex items-center justify-center p-4 mb-4">
                    {mainPerfume.image_url ? (
                      <img src={mainPerfume.image_url} alt={mainPerfume.name} className="h-full w-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="text-stone-300 text-xs">No Image</span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 truncate w-full">{mainPerfume.brand?.name}</div>
                  <div className="text-sm font-medium text-stone-900 truncate w-full px-2">{mainPerfume.name}</div>
                </div>

                {/* Candidate Perfume */}
                <Link href={`/perfume/${candidatePerfume.slug || candidatePerfume.id}`} className="flex flex-col items-center text-center group">
                  <div className="relative h-32 w-32 bg-stone-50 rounded-2xl flex items-center justify-center p-4 mb-4 group-hover:bg-stone-100 transition-colors">
                    {candidatePerfume.image_url ? (
                      <img src={candidatePerfume.image_url} alt={candidatePerfume.name} className="h-full w-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="text-stone-300 text-xs">No Image</span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-2xl transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-[10px] font-bold text-stone-900 bg-white px-3 py-1.5 rounded-full shadow-lg">View Profile</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 truncate w-full">{candidatePerfume.brand?.name}</div>
                  <div className="text-sm font-medium text-stone-900 truncate w-full px-2 group-hover:text-stone-600 transition-colors">{candidatePerfume.name}</div>
                </Link>
              </div>
            </div>

            {/* Mixing Tips */}
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-stone-400"></span>
                  Alchemy Notes
                </h4>
                <div className="space-y-3">
                  {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-stone-300 text-xs mt-0.5">0{i+1}</span>
                      <p className="text-sm text-stone-600 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 border-t border-stone-100">
                <div className="grid grid-cols-2 gap-8">
                  <PerfBar label="Longevity" original={mainPerfume.longevity_rating || 5} result={resultingScent.longevity} />
                  <PerfBar label="Sillage" original={mainPerfume.sillage_rating || 5} result={resultingScent.sillage} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Resulting DNA */}
        <div className="bg-stone-50 p-8 md:p-10 border-l border-stone-100 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Resulting DNA</h4>
            <div className="text-xl font-serif text-stone-900">{resultingScent.family}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-1">Best for {resultingScent.occasion}</div>
          </div>

          <div className="relative h-64 w-full flex items-center justify-center">
             <ScentRadar profile={resultingScent.profile} />
          </div>

          <div className="mt-8 pt-8 border-t border-stone-200/50 flex flex-col gap-4">
             <div className="flex justify-center gap-4">
                {Object.entries(resultingScent.profile)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([trait, value]) => (
                    <div key={trait} className="text-center">
                       <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">{trait}</div>
                       <div className="text-xs font-medium text-stone-900">{Math.round(value * 10)}%</div>
                    </div>
                  ))
                }
             </div>
             <Link 
                href={`/layering?base=${mainPerfume.slug}&top=${candidatePerfume.slug}`}
                className="w-full py-3 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest text-center rounded-xl hover:bg-stone-800 transition-colors shadow-lg shadow-stone-200"
             >
                Open in Studio →
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
