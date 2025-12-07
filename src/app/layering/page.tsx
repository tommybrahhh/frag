'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import PerfumePicker from '@/components/PerfumePicker';
import MixPyramid from '@/components/MixPyramid';
import { mixPerfumes, findLayeringMatches } from '@/lib/alchemy';
import Link from 'next/link';

export default function LayeringLab() {
  const [allPerfumes, setAllPerfumes] = useState<any[]>([]);
  const [slot1, setSlot1] = useState<any>(null);
  const [slot2, setSlot2] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [ratio, setRatio] = useState(50); // 50% mix default

  // 1. Load Data for Suggestions
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('perfumes')
        .select(`
          id, name, image_url, vibe_tags,
          brand:brands!perfumes_brand_id_fkey(name),
          perfume_notes(type, note:notes(name, color_hex))
        `);
      setAllPerfumes(data || []);
    };
    loadData();
  }, []);

  // 2. Generate Suggestions when Slot 1 changes
  useEffect(() => {
    if (slot1 && allPerfumes.length > 0) {
      const matches = findLayeringMatches(slot1, allPerfumes);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
    setResult(null); // Reset result on change
  }, [slot1, allPerfumes]);

  // 3. Auto-Mix when both are selected (using current ratio)
  useEffect(() => {
    if (slot1 && slot2) {
      setResult(mixPerfumes(slot1, slot2, ratio / 100));
    }
  }, [slot1, slot2, ratio]);

  return (
    <div className="min-h-screen bg-white text-stone-800 pb-24 font-sans selection:bg-stone-900 selection:text-white">
      
      {/* Nav */}
      <div className="px-6 py-6 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">The Lab</span>
        <div className="w-8"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl text-stone-900 mb-4">Scent Mixology</h1>
          <p className="text-stone-500 text-sm tracking-wide uppercase">Select a base to see smart pairings</p>
        </div>

        {/* THE MIXER */}
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-start">
          
          {/* SLOT 1 */}
          <div className="space-y-4">
             <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">Base Layer</div>
             <PerfumePicker label="Search Base..." onSelect={setSlot1} selected={slot1} />
          </div>
          
          {/* MIX CONTROL PANEL */}
          <div className="flex flex-col items-center space-y-4 self-center">
            <div className="text-4xl text-stone-200 font-serif italic">+</div>
            
            {slot1 && slot2 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-4 w-64 space-y-4">
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Mix Control</div>
                  
                  {/* Ratio Slider */}
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ratio}
                      onChange={(e) => setRatio(Number(e.target.value))}
                      className="w-full h-2 bg-stone-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-800"
                    />
                    
                    {/* Visual Labels */}
                    <div className="flex justify-between text-[10px] text-stone-400 font-medium">
                      <span>Mostly Base</span>
                      <span>Mostly Top</span>
                    </div>
                    
                    {/* Current Ratio Display */}
                    <div className="text-xs text-stone-600 text-center">
                      {ratio}% Base / {100 - ratio}% Top
                    </div>
                  </div>
                  
                  {/* Swap Button */}
                  <button
                    onClick={() => {
                      const temp = slot1;
                      setSlot1(slot2);
                      setSlot2(temp);
                    }}
                    className="mt-4 w-full py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors text-sm font-medium"
                  >
                    🔄 Swap Scents
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* SLOT 2 */}
          <div className="space-y-4">
             <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">Top Layer</div>
             <PerfumePicker label="Search Top..." onSelect={setSlot2} selected={slot2} />
             
             {/* SMART SUGGESTIONS */}
             {suggestions.length > 0 && !slot2 && (
               <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                 <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2 text-center">Suggested Pairings</div>
                 <div className="space-y-2">
                   {suggestions.map(s => (
                     <button 
                       key={s.id} 
                       onClick={() => setSlot2(s)}
                       className="w-full flex items-center gap-3 p-2 bg-stone-50 hover:bg-stone-100 rounded-xl transition text-left border border-transparent hover:border-stone-200"
                     >
                        <div className="w-8 h-10 flex-shrink-0 bg-white rounded flex items-center justify-center">
                          {s.image_url && <img src={s.image_url} className="h-full object-contain mix-blend-multiply" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-800 leading-tight">{s.name}</div>
                          <div className="text-[9px] uppercase text-stone-400">{s.brand?.name}</div>
                        </div>
                     </button>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* THE RESULT (Appears Automatically) */}
        {result && (
          <div className="mt-20 border-t border-stone-100 pt-16 animate-in fade-in zoom-in-95 duration-700">
            <div className="bg-stone-50 rounded-3xl p-10 text-center border border-stone-100 relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-white border border-stone-200 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm">
                  {result.verdict}
                </div>
                <h2 className="font-serif text-5xl text-stone-900 mb-2">{result.mixName}</h2>
                <p className="text-sm text-stone-500 italic mb-8">{result.description}</p>
                
                {/* Scent Pyramid */}
                <div className="mb-8">
                  <MixPyramid
                    perfumeA={slot1}
                    perfumeB={slot2}
                    ratio={ratio}
                  />
                </div>
                
                {/* New Profile Visualizer */}
                {result.newProfile && (
                  <div className="max-w-xs mx-auto space-y-2">
                     {Object.entries(result.newProfile).map(([k, v]: any) => (
                       <div key={k} className="flex items-center gap-3">
                         <span className="w-12 text-[9px] font-bold uppercase text-stone-400 text-right">{k}</span>
                         <div className="flex-1 h-1 bg-white rounded-full overflow-hidden">
                           <div className="h-full bg-stone-800" style={{ width: `${v * 10}%` }}></div>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}