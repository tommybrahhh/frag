import React from 'react';
import { UserInsights, ScentsProfileDNA } from '@/lib/analytics';
import Link from 'next/link';

// VISUAL COMPONENT 1: Vertical "Frequency" Bar
const DNAFrequencyBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center gap-3 group flex-1">
    <div className="relative w-full h-32 bg-stone-50 rounded-sm overflow-hidden flex items-end">
      <div 
        className="w-full bg-stone-900 transition-all duration-1000 ease-out relative group-hover:bg-stone-600" 
        style={{ height: `${value}%` }}
      >
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          {value}%
        </div>
      </div>
    </div>
    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
      {label}
    </span>
  </div>
);

export default function WardrobeAnalytics({ 
  insights, 
  dna,
  rotationPicks,
  currentSeason
}: { 
  insights: UserInsights, 
  dna: ScentsProfileDNA,
  rotationPicks: any[],
  currentSeason: string
}) {
  if (insights.totalCount === 0) return null;

  const getArchetype = () => {
    const values = Object.values(dna);
    const max = Math.max(...values);
    if (dna.freshness === max) return "The Modern Minimalist";
    if (dna.warmth === max) return "The Orientalist";
    if (dna.floral === max) return "The Romantic";
    if (dna.depth === max) return "The Noir Connoisseur";
    return "The Eclectic Collector";
  };

  const topSeason = insights.seasonPreference[0]?.name || 'N/A';
  const matchedPerfume = rotationPicks[0];

  return (
    <div className="grid lg:grid-cols-12 gap-8 mb-16">
      
      {/* CARD 1: THE CURATOR'S PASSPORT */}
      <div className="lg:col-span-8 bg-white rounded-lg border border-stone-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        <div className="p-8 md:w-1/2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-100">
          <div>
            <div className="inline-flex items-center gap-2 mb-6">
               <span className="w-1.5 h-1.5 rounded-full bg-stone-900"></span>
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Olfactory Profile</span>
            </div>
            
            <h2 className="font-serif text-4xl text-stone-900 mb-4 leading-tight">
              {getArchetype()}
            </h2>
            
            <p className="text-stone-500 text-sm leading-relaxed mb-8 font-light">
              Your collection leans towards <span className="text-stone-900 font-medium">
                {dna.warmth > dna.freshness ? 'warm & complex' : 'fresh & airy'}
              </span> profiles. You favor {dna.depth > 50 ? 'depth' : 'clarity'} in your selections.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-50 p-4 rounded-lg">
               <span className="block text-2xl font-serif text-stone-900">{insights.totalCount}</span>
               <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Bottles</span>
            </div>
            <div className="bg-stone-50 p-4 rounded-lg">
               <span className="block text-xl font-serif text-stone-900">{topSeason}</span>
               <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Season</span>
            </div>
          </div>
        </div>

        <div className="p-8 md:w-1/2 bg-stone-50/30 flex flex-col justify-center">
          <div className="mb-8 flex justify-between items-end">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">DNA Analysis</h3>
          </div>
          
          <div className="flex justify-between items-end gap-3 h-40">
             <DNAFrequencyBar label="Fresh" value={dna.freshness} />
             <DNAFrequencyBar label="Floral" value={dna.floral} />
             <DNAFrequencyBar label="Spicy" value={dna.spicy} />
             <DNAFrequencyBar label="Woody" value={dna.woody} />
             <DNAFrequencyBar label="Warm" value={dna.warmth} />
             <DNAFrequencyBar label="Deep" value={dna.depth} />
          </div>
        </div>
      </div>

      {/* CARD 2: ATMOSPHERIC ROTATION */}
      <div className="lg:col-span-4 bg-stone-900 rounded-lg relative overflow-hidden group p-8 flex flex-col justify-between min-h-[400px]">
        <div className="relative z-20">
          <div className="flex justify-between items-start mb-12">
             <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Rotation</span>
                <h2 className="text-white font-serif text-3xl mt-1">{currentSeason}</h2>
             </div>
          </div>

          <div className="mt-8">
             <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-4">Recommended Wear</div>
             {matchedPerfume ? (
               <Link href={`/perfume/${matchedPerfume.slug || matchedPerfume.id}`}>
                 <div className="bg-white/5 border border-white/10 p-5 rounded-lg flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer">
                    <div className="h-12 w-12 bg-white rounded-full p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
                       {matchedPerfume.image_url ? (
                         <img src={matchedPerfume.image_url} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                       ) : (
                         <span className="text-stone-900 text-[8px]">N/A</span>
                       )}
                    </div>
                    <div className="overflow-hidden">
                       <h4 className="text-white font-serif text-lg leading-none truncate mb-1">{matchedPerfume.name}</h4>
                       <p className="text-stone-500 text-[10px] uppercase tracking-wider truncate">{matchedPerfume.brand?.name}</p>
                    </div>
                 </div>
               </Link>
             ) : (
               <div className="bg-white/5 border border-white/10 p-5 rounded-lg text-stone-500 text-xs italic text-center">
                 Add scents to get recommendations
               </div>
             )}
          </div>
        </div>

        <button 
           onClick={() => window.scrollTo({ top: 1200, behavior: 'smooth' })}
           className="relative z-20 w-full py-4 bg-white text-stone-900 text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg hover:bg-stone-100 transition-all"
         >
            Explore Wardrobe
         </button>
      </div>

    </div>
  );
}
