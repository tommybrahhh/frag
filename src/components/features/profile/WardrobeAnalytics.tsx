import React from 'react';
import { UserInsights, ScentsProfileDNA } from '@/lib/analytics';
import Link from 'next/link';

// VISUAL COMPONENT 1: Vertical "Frequency" Bar
const DNAFrequencyBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center gap-2 group flex-1">
    {/* The Bar Container */}
    <div className="relative w-full h-32 bg-stone-100 rounded-t-lg rounded-b-sm overflow-hidden flex items-end">
      {/* The Fill */}
      <div 
        className="w-full bg-stone-900 transition-all duration-1000 ease-out relative group-hover:bg-emerald-900" 
        style={{ height: `${value}%` }}
      >
        {/* Tooltip on Hover */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          {value}%
        </div>
      </div>
    </div>
    {/* The Label */}
    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 rotate-0 md:-rotate-45 md:origin-center md:mt-2 lg:rotate-0 lg:mt-0">
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

  // Safe check for top brand
  const topBrand = insights.topBrands[0]?.name || 'N/A';
  const topSeason = insights.seasonPreference[0]?.name || 'N/A';

  // Real data for rotation
  const matchedPerfume = rotationPicks[0];
  const currentRotation = {
    season: currentSeason,
    perfumeName: matchedPerfume?.name || 'Empty Shelf',
    brandName: matchedPerfume?.brand?.name || '-',
    image: matchedPerfume?.image_url || null,
    reason: `Perfect for ${currentSeason}`
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 mb-12">
      
      {/* CARD 1: THE CURATOR'S PASSPORT (Spans 8 cols) */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Identity & Stats */}
        <div className="p-8 md:w-1/2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-100">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Olfactory ID</span>
            </div>
            
            <h2 className="font-serif text-4xl text-stone-900 mb-3 leading-tight">
              {getArchetype()}
            </h2>
            
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              Your collection leans heavily towards <span className="text-stone-900 font-semibold decoration-stone-300 underline underline-offset-4">
                {dna.warmth > dna.freshness ? 'warm & complex' : 'fresh & airy'}
              </span> profiles. 
              You favor longevity over projection.
            </p>
          </div>

          {/* Mini Stat Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
               <span className="block text-2xl font-serif text-stone-900">{insights.totalCount}</span>
               <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Bottles</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
               <span className="block text-lg font-serif text-stone-900">{topSeason}</span>
               <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Season</span>
            </div>
          </div>
        </div>

        {/* Right Side: The Lab Visualizer (Vertical Bars) */}
        <div className="p-8 md:w-1/2 bg-stone-50/50 flex flex-col justify-center">
          <div className="mb-6 flex justify-between items-end">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Scent DNA Analysis</h3>
            <span className="text-[9px] text-stone-300 font-mono">v.2.0</span>
          </div>
          
          <div className="flex justify-between items-end gap-2 h-40">
             <DNAFrequencyBar label="Fresh" value={dna.freshness} />
             <DNAFrequencyBar label="Floral" value={dna.floral} />
             <DNAFrequencyBar label="Spicy" value={dna.spicy} />
             <DNAFrequencyBar label="Woody" value={dna.woody} />
             <DNAFrequencyBar label="Warm" value={dna.warmth} />
             <DNAFrequencyBar label="Deep" value={dna.depth} />
          </div>
        </div>
      </div>

      {/* CARD 2: ATMOSPHERIC ROTATION (Spans 4 cols) */}
      <div className="lg:col-span-4 bg-stone-900 rounded-2xl relative overflow-hidden group">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
        
        {/* Optional: Put the perfume image as a blurred background for mood */}
        {currentRotation.image && (
          <img 
            src={currentRotation.image} 
            alt="Mood"
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105"
          />
        )}

        <div className="relative z-20 p-8 h-full flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex justify-between items-start">
             <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Current Rotation</span>
                <h2 className="text-white font-serif text-2xl mt-1">{currentRotation.season} Edition</h2>
             </div>
             <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white">
                {new Date().getHours() > 18 || new Date().getHours() < 6 ? 'Night' : 'Day'}
             </div>
          </div>

          {/* The Suggestion */}
          <div className="mt-8">
             <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">Recommended Wear</div>
             {matchedPerfume ? (
               <Link href={`/perfume/${matchedPerfume.slug || matchedPerfume.id}`}>
                 <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="h-12 w-12 bg-white rounded-full p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                       {currentRotation.image ? (
                         <img src={currentRotation.image} className="w-full h-full object-contain mix-blend-multiply rounded-full" alt={currentRotation.perfumeName} />
                       ) : (
                         <span className="text-stone-900 text-[8px]">IMG</span>
                       )}
                    </div>
                    <div className="overflow-hidden">
                       <h4 className="text-white font-serif text-lg leading-none truncate">{currentRotation.perfumeName}</h4>
                       <p className="text-stone-400 text-xs mt-1 truncate">{currentRotation.brandName}</p>
                    </div>
                 </div>
               </Link>
             ) : (
               <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-xl text-stone-400 text-xs italic text-center">
                 Add scents to your wardrobe to get recommendations
               </div>
             )}
             
             <button 
               onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth' })}
               className="w-full mt-4 py-3 bg-white text-stone-900 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-stone-200 transition-colors"
             >
                View Full Rotation
             </button>
          </div>
        </div>
      </div>

    </div>
  );
}
