import React from 'react';
import { UserInsights } from '@/lib/analytics';

export default function WardrobeAnalytics({ insights }: { insights: UserInsights }) {
  if (insights.totalCount === 0) return null;

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-12">
      {/* Card 1: Signature Scent */}
      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Olfactory Profile</h3>
        <div className="space-y-3">
          {insights.topFamilies.map((fam) => (
            <div key={fam.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-stone-700">{fam.name}</span>
                <span className="text-stone-400">{fam.percentage}%</span>
              </div>
              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stone-800 rounded-full" 
                  style={{ width: `${fam.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Brand Loyalty */}
      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Top Brands</h3>
        <div className="space-y-2">
          {insights.topBrands.map((brand, idx) => (
            <div key={brand.name} className="flex items-center gap-3">
              <span className="text-xl font-serif text-stone-300 font-bold">0{idx + 1}</span>
              <div>
                <div className="text-sm font-bold text-stone-800">{brand.name}</div>
                <div className="text-[10px] text-stone-400 uppercase tracking-wide">{brand.count} Bottles</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Collection Stats */}
      <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 text-white flex flex-col justify-between">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Total Collection</h3>
          <div className="text-5xl font-serif">{insights.totalCount}</div>
        </div>
        
        {insights.seasonPreference.length > 0 && (
          <div className="mt-4">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Primary Season</h3>
             <div className="text-xl font-serif text-stone-200">{insights.seasonPreference[0].name}</div>
          </div>
        )}
      </div>
    </div>
  );
}
