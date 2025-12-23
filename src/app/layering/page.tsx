'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PerfumePicker from '@/components/PerfumePicker';
import MixPyramid from '@/components/MixPyramid';
import ScentRadar from '@/components/ScentRadar';
import { mixPerfumes, findLayeringMatches } from '@/lib/alchemy';
import Link from 'next/link';

// Mock "Chef's Specials" to solve the blank canvas problem
const CHEF_SPECIALS = [
  { id: 'special-1', name: 'The Winter Warmer', desc: 'Tobacco + Vanilla', ids: ['tobacco-vanilla', 'jazz-club'] }, // Placeholder IDs - would need real ones
  { id: 'special-2', name: 'The Fresh Cut', desc: 'Citrus + Green', ids: ['lime-basil', 'green-tea'] },
  { id: 'special-3', name: 'Midnight Rose', desc: 'Oud + Rose', ids: ['oud-wood', 'rose-31'] },
];

export default function LayeringLab() {
  const [slot1, setSlot1] = useState<any>(null);
  const [slot2, setSlot2] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [ratio, setRatio] = useState(50);
  const [recentMixes, setRecentMixes] = useState<any[]>([]);

  // 1. Generate Suggestions
  useEffect(() => {
    // We can't generate local suggestions easily without a loaded list.
    // For now, we'll clear suggestions or implement a server-side suggestion fetch later.
    // The previous logic relied on 'allPerfumes'.
    setSuggestions([]); 
    setResult(null);
  }, [slot1]);

  // Helper to hydrate perfume data
  const hydrateAndSet = async (perfume: any, setSlot: (p: any) => void) => {
    if (!perfume) {
      setSlot(null);
      return;
    }
    if (perfume.perfume_notes && perfume.perfume_notes.length > 0) {
      setSlot(perfume);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url, vibe_tags, price_tier,
        scent_profile,
        brand:brands!perfumes_brand_id_fkey(name),
        perfume_notes(type, note:notes(name, color_hex))
      `)
      .eq('id', perfume.id)
      .single();
    if (data) setSlot(data);
  };

  // 2. Auto-Mix
  useEffect(() => {
    if (slot1 && slot2) {
      setResult(mixPerfumes(slot1, slot2, ratio / 100));
    }
  }, [slot1, slot2, ratio]);

  const handleSaveMix = () => {
    if (result) {
      setRecentMixes([result, ...recentMixes]);
      alert('Mix saved to your Recipe Book!'); // Temporary feedback
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-24 font-sans selection:bg-stone-900 selection:text-white">
      
      {/* Nav */}
      <div className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">The Alchemist's Workbench</span>
        <div className="w-8"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        
        {/* WORKBENCH CARD */}
        <div className="bg-white rounded-[32px] shadow-xl border border-white overflow-hidden relative">
          
          {/* Header / Toolbar */}
          <div className="bg-stone-50 px-8 py-6 border-b border-stone-100 flex justify-between items-center">
            <div>
              <h1 className="font-serif text-2xl text-stone-900">Lab Session #001</h1>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">Experimenting with volatility & accords</p>
            </div>
            {result && (
              <button 
                onClick={handleSaveMix}
                className="px-6 py-3 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-stone-700 transition shadow-lg"
              >
                Save Recipe
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row min-h-[500px]">
            
            {/* LEFT: THE EQUATION (Input) */}
            <div className="lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-r border-stone-100 bg-stone-50/30 flex flex-col justify-center relative">
              
              {/* Dynamic Gradient Background based on Ratio */}
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000"
                style={{ background: `linear-gradient(135deg, ${slot1 ? '#e7e5e4' : '#fff'} ${100-ratio}%, ${slot2 ? '#d6d3d1' : '#fff'} 100%)` }}
              />

              <div className="relative z-10 space-y-6">
                
                {/* SLOT 1: BASE */}
                <div className="relative group">
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full hidden xl:block">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300 -rotate-90 block">Base</span>
                  </div>
                  <PerfumePicker 
                    label="Base Layer" 
                    placeholder="Select a fragrance..." 
                    onSelect={(p) => hydrateAndSet(p, setSlot1)} 
                    selected={slot1}
                  />
                </div>

                {/* CONTROLS (Swap & Ratio) */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-stone-200"></div>
                  
                  {/* Swap Button */}
                  <button
                    onClick={() => {
                      const temp = slot1;
                      setSlot1(slot2);
                      setSlot2(temp);
                    }}
                    className="w-8 h-8 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-900 transition shadow-sm z-20"
                    title="Swap Layers"
                  >
                    ⇄
                  </button>

                  {/* Ratio Slider (Compact) */}
                  <div className="w-40 relative group">
                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                      <span>Base</span>
                      <span>{ratio}/{100-ratio}</span>
                      <span>Top</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ratio}
                      onChange={(e) => setRatio(Number(e.target.value))}
                      className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:bg-stone-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                    />
                  </div>

                  <div className="flex-1 h-px bg-stone-200"></div>
                </div>

                {/* SLOT 2: TOP */}
                <div className="relative">
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full hidden xl:block">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300 -rotate-90 block">Top</span>
                  </div>
                  <PerfumePicker 
                    label="Top Layer" 
                    placeholder="Select a fragrance..." 
                    onSelect={(p) => hydrateAndSet(p, setSlot2)} 
                    selected={slot2}
                  />
                  
                  {/* Smart Suggestions - Temporarily removed */}
                  {!slot2 && suggestions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-stone-100 animate-in fade-in slide-in-from-top-2">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-3">AI Suggestions</div>
                      <div className="grid grid-cols-2 gap-2">
                        {suggestions.slice(0, 4).map(s => (
                          <button
                            key={s.id}
                            onClick={() => hydrateAndSet(s, setSlot2)}
                            className="text-left p-2 rounded-lg bg-white border border-stone-100 hover:border-stone-300 hover:shadow-sm transition flex items-center gap-2 group"
                          >
                            <div className="w-6 h-6 rounded-full bg-stone-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                               {s.image_url ? <img src={s.image_url} className="h-full object-contain mix-blend-multiply opacity-60 group-hover:opacity-100" /> : null}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[9px] font-bold text-stone-900 truncate">{s.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* RIGHT: THE RESULT (Output) */}
            <div className="lg:w-1/2 p-6 flex flex-col justify-center bg-white relative">
              
              {!result ? (
                // Empty State: Chef's Specials
                <div className="text-center opacity-60">
                  <div className="w-16 h-16 mx-auto mb-4 bg-stone-50 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center">
                    <span className="text-2xl text-stone-300">⚗️</span>
                  </div>
                  <h3 className="font-serif text-xl text-stone-400 mb-1">The Beaker is Empty</h3>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">Select two fragrances to begin.</p>
                  
                  {/* Quick Start (Mock functionality for now) */}
                  <div className="mt-8">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-stone-300 mb-3">Quick Start Recipes</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {CHEF_SPECIALS.map(special => (
                        <button key={special.id} className="px-3 py-1.5 border border-stone-100 rounded-full text-[9px] font-bold uppercase text-stone-400 hover:border-stone-300 hover:text-stone-600 transition">
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
                      {result.verdict} • {result.safety}% Stability
                    </div>
                  </div>

                  <p className="text-center text-sm text-stone-500 italic mb-8 max-w-sm mx-auto leading-relaxed">"{result.description}"</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Visualizer 1: Pyramid */}
                    <div className="bg-stone-50/50 rounded-xl p-3 border border-stone-50">
                      <h4 className="text-[8px] font-bold uppercase tracking-widest text-stone-400 mb-2 text-center">Structure</h4>
                      <MixPyramid perfumeA={slot1} perfumeB={slot2} ratio={ratio} />
                    </div>
                    {/* Visualizer 2: Radar */}
                    <div className="bg-stone-50/50 rounded-xl p-3 border border-stone-50">
                      <h4 className="text-[8px] font-bold uppercase tracking-widest text-stone-400 mb-2 text-center">Profile</h4>
                      <div className="h-28 flex items-center justify-center">
                        <ScentRadar profile={result.newProfile} />
                      </div>
                    </div>
                  </div>

                  {/* Tips Box */}
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2 flex items-center gap-2">
                      <span>💡</span> Lab Notes
                    </div>
                    <ul className="space-y-1.5">
                      {result.mixingTips.slice(0, 3).map((tip: string, i: number) => (
                        <li key={i} className="text-[10px] text-stone-600 flex items-start gap-2 leading-snug">
                          <span className="text-stone-300">•</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}