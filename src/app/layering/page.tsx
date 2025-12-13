'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PerfumePicker from '@/components/PerfumePicker';
import MixPyramid from '@/components/MixPyramid';
import ScentRadar from '@/components/ScentRadar';
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
          id, name, image_url, vibe_tags, price_tier,
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

  // Helper to fetch full perfume details with notes
  const hydrateAndSet = async (perfume: any, setSlot: (p: any) => void) => {
    if (!perfume) {
      setSlot(null);
      return;
    }

    // If notes are already present, just set it
    if (perfume.perfume_notes && perfume.perfume_notes.length > 0) {
      setSlot(perfume);
      return;
    }

    // Otherwise, fetch the full details
    const supabase = createClient();
    const { data } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url, vibe_tags, price_tier,
        scent_profile,
        brand:brands!perfumes_brand_id_fkey(name),
        perfume_notes(
          type,
          note:notes(name, color_hex)
        )
      `)
      .eq('id', perfume.id)
      .single();

    if (data) {
      setSlot(data);
    }
  };

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

        {/* THE MIXER AREA */}
        <div className="flex flex-col gap-8">
          
          {/* Row 1: The Slots */}
          <div className="grid md:grid-cols-2 gap-6 items-start">
             <div className="space-y-3">
               <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">Base Layer</div>
               <PerfumePicker label="Select Base..." onSelect={(p) => hydrateAndSet(p, setSlot1)} selected={slot1} />
             </div>
             
             <div className="space-y-3">
               <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">Top Layer</div>
               <PerfumePicker label="Select Top..." onSelect={(p) => hydrateAndSet(p, setSlot2)} selected={slot2} />
               
               {/* SMART SUGGESTIONS */}
               {suggestions.length > 0 && !slot2 && (
                 <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                   <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2 text-center">Suggested Pairings</div>
                   <div className="space-y-2">
                     {suggestions.map(s => (
                       <button
                         key={s.id}
                         onClick={() => hydrateAndSet(s, setSlot2)}
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

          {/* Row 2: The Controls (Only visible if both selected) */}
          {slot1 && slot2 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-stone-50 border border-stone-100 rounded-2xl p-6 max-w-xl mx-auto flex flex-col md:flex-row items-center gap-6">
                
                {/* Slider Section */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    <span>{ratio}% Base</span>
                    <span>{100 - ratio}% Top</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={ratio}
                    onChange={(e) => setRatio(Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-800"
                  />
                </div>

                {/* Swap Action */}
                <button
                  onClick={() => {
                    const temp = slot1;
                    setSlot1(slot2);
                    setSlot2(temp);
                  }}
                  className="p-3 bg-white border border-stone-200 rounded-full hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all shadow-sm group"
                  title="Swap Layers"
                >
                  <span className="text-xl leading-none group-hover:rotate-180 transition-transform block">⇄</span>
                </button>

              </div>
            </div>
          )}
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
                {slot1 && slot2 && (
                  <div className="mt-12 border-t border-stone-100 pt-8">
                    <h3 className="font-serif text-2xl text-stone-900 mb-6 text-center">New Scent Structure</h3>
                    <MixPyramid
                      perfumeA={slot1}
                      perfumeB={slot2}
                      ratio={ratio}
                    />
                  </div>
                )}
                
                {/* NEW: Radial Scent Profile */}
                {result.newProfile && (
                  <div className="mt-8 mb-8">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4 text-center">
                      Olfactory Geometry
                    </h4>
                    <div className="bg-white/50 rounded-2xl p-4 border border-stone-100">
                      <ScentRadar profile={result.newProfile} />
                    </div>
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