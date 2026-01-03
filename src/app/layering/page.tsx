'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { mixPerfumes } from '@/lib/alchemy';
import { getLayeringSuggestions } from '@/app/actions/layering';
import Link from 'next/link';

// Import new/refactored components
import PerfumePicker from '@/components/PerfumePicker';
import MixingControls from '@/components/layering/MixingControls';
import LayeringAnalysis from '@/components/layering/LayeringAnalysis';

// Mock "Chef's Specials" to solve the blank canvas problem
const CHEF_SPECIALS = [
  { id: 'special-1', name: 'The Winter Warmer', desc: 'Tobacco + Vanilla', ids: ['45e31a93-5910-4246-8684-25b33bf18c1c', '7fbe126c-e44d-41f5-985a-9295947a5066'] }, // Tobacco Oud Intense + Vanilla Sex
  { id: 'special-2', name: 'The Fresh Cut', desc: 'Citrus + Green', ids: ['57d9fed2-9d89-4ee4-82ab-71f9d6674e1f', 'c9a5eae1-625b-4c4e-b686-177b04a4af2e'] }, // Mandarine Basilic Harvest + Imperial Tea
  { id: 'special-3', name: 'Midnight Rose', desc: 'Oud + Rose', ids: ['190d87e6-7959-48a1-abe6-79cc8cc387a5', 'd4ade9d3-9ce6-46c1-80f5-df33334fb403'] }, // Dhaneloudh Al Nafees + Atomic Rose
];

export default function LayeringLab() {
  const [slot1, setSlot1] = useState<any>(null);
  const [slot2, setSlot2] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [ratio, setRatio] = useState(50);
  const [recentMixes, setRecentMixes] = useState<any[]>([]);

  // 1. Generate Suggestions for Slot 2
  useEffect(() => {
    async function loadSuggestions() {
        if (slot1) {
            setSuggestions([]); // Clear previous
            try {
                const matches = await getLayeringSuggestions(slot1.id);
                setSuggestions(matches);
            } catch (err) {
                console.error("Error fetching suggestions:", err);
            }
        } else {
            setSuggestions([]);
        }
        setResult(null); // Clear result when base changes
    }
    loadSuggestions();
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
      .select('id, name, image_url, vibe_tags, price_tier, scent_profile, longevity_rating, sillage_rating, brand:brands!perfumes_brand_id_fkey(name), perfume_notes(type, note:notes(name, color_hex))')
      .eq('id', perfume.id)
      .single();
    if (data) setSlot(data);
  };

  // 2. Auto-Mix when inputs change
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

  const handleSwap = () => {
    const temp = slot1;
    setSlot1(slot2);
    setSlot2(temp);
  };

  const handleQuickStart = (id1: string, id2: string) => {
    hydrateAndSet({ id: id1 }, setSlot1);
    hydrateAndSet({ id: id2 }, setSlot2);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-24 font-sans selection:bg-stone-900 selection:text-white">
      
      {/* --- PAGE HEADER --- */}
      <div className="border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="px-6 py-4 max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
            <h1 className="font-serif text-3xl text-stone-900">Layering Studio</h1>
            <div className="w-16"></div> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        
        {/* --- EQUATION SECTION --- */}
        <div className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="w-full flex-1">
                    <PerfumePicker 
                        label="Base Layer" 
                        placeholder="Select a fragrance..." 
                        onSelect={(p) => hydrateAndSet(p, setSlot1)} 
                        selected={slot1}
                        compact={true}
                    />
                </div>

                <div className="py-4 flex-shrink-0">
                    <MixingControls 
                        ratio={ratio}
                        onRatioChange={setRatio}
                        onSwap={handleSwap}
                    />
                </div>

                <div className="w-full flex-1">
                     <PerfumePicker 
                        label="Top Layer" 
                        placeholder="Select a fragrance..." 
                        onSelect={(p) => hydrateAndSet(p, setSlot2)} 
                        selected={slot2}
                        compact={true}
                    />
                </div>
            </div>
            {/* Suggestions can be shown here if needed in the future */}
        </div>

        {/* --- ANALYSIS SECTION --- */}
        {result && (
             <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-500">
                 <LayeringAnalysis 
                    result={result}
                    slot1={slot1}
                    slot2={slot2}
                    ratio={ratio}
                    chefSpecials={CHEF_SPECIALS}
                    onQuickStart={handleQuickStart}
                 />
            </div>
        )}

        {/* --- EMPTY STATE / QUICK START --- */}
        {!slot1 && !slot2 && (
            <div className="mt-12 text-center animate-in fade-in">
                 <p className="text-sm text-stone-400 mb-4">Select fragrances above, or try one of our starter recipes.</p>
                 <div className="flex flex-wrap justify-center gap-3">
                    {CHEF_SPECIALS.map(special => (
                        <button 
                            key={special.id} 
                            onClick={() => handleQuickStart(special.ids[0], special.ids[1])}
                            className="px-4 py-2 bg-white border border-stone-200 rounded-full text-xs font-semibold text-stone-600 hover:border-stone-400 hover:text-stone-900 transition"
                        >
                          {special.name}
                        </button>
                    ))}
                 </div>
            </div>
        )}
      </div>
    </div>
  );
}