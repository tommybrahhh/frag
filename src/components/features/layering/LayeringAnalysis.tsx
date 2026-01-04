'use client';

import React from 'react';
import MixPyramid from '@/components/ui/MixPyramid';
import ScentRadar from '@/components/ui/ScentRadar';

interface LayeringAnalysisProps {
  result: any;
  slot1: any;
  slot2: any;
  ratio: number;
  chefSpecials: { id: string; name: string; desc: string; ids: string[] }[];
  onQuickStart: (id1: string, id2: string) => void;
}

export default function LayeringAnalysis({
  result,
  slot1,
  slot2,
  ratio,
  chefSpecials,
  onQuickStart
}: LayeringAnalysisProps) {

  return (
    <div className="p-6 flex flex-col justify-center bg-white relative">
      
      {!result ? (
        // Empty State: Chef's Specials
        <div className="text-center opacity-60">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone-50 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center">
            <span className="text-2xl text-stone-300">⚗️</span>
          </div>
          <h3 className="font-serif text-xl text-stone-400 mb-1">The Beaker is Empty</h3>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">Select two fragrances to begin.</p>
          
          {/* Quick Start */}
          <div className="mt-8">
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-300 mb-3">Quick Start Recipes</p>
            <div className="flex flex-wrap justify-center gap-2">
              {chefSpecials.map(special => (
                <button 
                    key={special.id} 
                    onClick={() => onQuickStart(special.ids[0], special.ids[1])}
                    className="px-3 py-1.5 border border-stone-100 rounded-full text-[9px] font-bold uppercase text-stone-400 hover:border-stone-300 hover:text-stone-600 transition"
                >
                  {special.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Analysis Result
        <div className="animate-in fade-in zoom-in-95 duration-500">
          
          {/* Verdict Badge */}
          <div className="flex justify-center mb-6">
            <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm ${
              result.safety >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              result.safety >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
              'bg-red-50 text-red-700 border-red-100'
            }`}>
              {result.verdict} • {result.safety}% Harmony
            </div>
          </div>

          <p className="text-center text-sm text-stone-500 italic mb-8 max-w-sm mx-auto leading-relaxed">"{result.description}"</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Structure */}
            <div className="bg-stone-50/50 rounded-xl p-4 border border-stone-100">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 text-center">Structure</h4>
              <MixPyramid perfumeA={slot1} perfumeB={slot2} ratio={ratio} />
            </div>

            {/* Column 2: Performance */}
            {result.performance && result.performance.base && (
              <div className="bg-stone-50/50 rounded-xl p-4 border border-stone-100 flex flex-col justify-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4 flex items-center justify-center gap-2">
                  <span>⚡</span> Performance
                </div>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-[10px] text-stone-400 mb-1 font-bold uppercase tracking-wider">Longevity</div>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-xl font-serif text-stone-900">{result.performance.result.longevity}h</span>
                        {result.performance.result.longevity > result.performance.base.longevity && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            +{Math.round((result.performance.result.longevity - result.performance.base.longevity) * 10) / 10}h
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="w-full h-px bg-stone-200/50"></div>
                  <div className="text-center">
                    <div className="text-[10px] text-stone-400 mb-1 font-bold uppercase tracking-wider">Sillage</div>
                     <div className="flex items-center justify-center gap-2">
                        <span className="text-xl font-serif text-stone-900">{result.performance.result.sillage}/10</span>
                        {result.performance.result.sillage > result.performance.base.sillage && (
                           <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            +{Math.round((result.performance.result.sillage - result.performance.base.sillage) * 10) / 10}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Column 3: Profile */}
            <div className="bg-stone-50/50 rounded-xl p-4 border border-stone-100">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 text-center">Scent Profile</h4>
              <div className="h-40 flex items-center justify-center">
                <ScentRadar profile={result.newProfile} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
