'use client';

import { useState } from 'react';
import PerfumePicker from '@/components/PerfumePicker';
import { mixPerfumes } from '@/lib/alchemy';
import Link from 'next/link';

export default function LayeringLab() {
  const [slot1, setSlot1] = useState<any>(null);
  const [slot2, setSlot2] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const handleMix = () => {
    if (slot1 && slot2) {
      const analysis = mixPerfumes(slot1, slot2);
      setResult(analysis);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-20 font-sans">
      
      {/* Nav */}
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-0 z-20">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase">← Home</Link>
        <span className="font-serif text-xl italic">The Layering Lab</span>
        <div className="w-8"></div>
      </div>

      <div className="max-w-2xl mx-auto px-6 mt-12">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl mb-4">Scent Mixology</h1>
          <p className="text-stone-500 text-sm">Select two fragrances to predict their combined outcome.</p>
        </div>

        {/* Guidance Section */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 mb-12">
          <h2 className="font-serif text-xl mb-4 text-stone-800">Layering Guidelines</h2>
          
          <div className="grid md:grid-cols-2 gap-6 text-sm text-stone-600">
            <div>
              <h3 className="font-bold text-stone-900 mb-2">Good Combinations:</h3>
              <ul className="space-y-1">
                <li>• Floral + Woody = Balanced elegance</li>
                <li>• Citrus + Fresh = Bright, energizing</li>
                <li>• Oriental + Spicy = Warm, exotic</li>
                <li>• Gourmand + Vanilla = Sweet, comforting</li>
                <li>• Woody + Amber = Rich, sophisticated</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-stone-900 mb-2">Avoid:</h3>
              <ul className="space-y-1">
                <li>• Marine + Gourmand (fish & chocolate)</li>
                <li>• Animalic + Fresh (conflicting notes)</li>
                <li>• Leather + Fruity (clashing accords)</li>
                <li>• Too many different vibe categories</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-200">
            <h3 className="font-bold text-stone-900 mb-2">Pro Tip:</h3>
            <p className="text-sm text-stone-600">
              Start with perfumes from the same brand or with complementary base notes.
              Apply heavier scents first as base layers, lighter ones on top.
            </p>
          </div>
        </div>

        {/* THE MIXER INPUTS */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center relative">
          <div className="w-full md:w-1/2">
             <PerfumePicker label="Base Layer" onSelect={setSlot1} selected={slot1} />
          </div>
          
          <div className="text-2xl text-stone-300 font-serif italic">+</div>
          
          <div className="w-full md:w-1/2">
             <PerfumePicker label="Top Layer" onSelect={setSlot2} selected={slot2} />
          </div>
        </div>

        {/* MIX BUTTON */}
        <div className="mt-10 text-center">
          <button
            disabled={!slot1 || !slot2}
            onClick={handleMix}
            className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500
              ${slot1 && slot2 
                ? 'bg-stone-900 text-white hover:scale-105 shadow-xl' 
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
          >
            Analyze Mix
          </button>
        </div>

        {/* THE RESULT CARD */}
        {result && (
          <div className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
              
              {/* Background Decoration */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-stone-50 rounded-full blur-3xl"></div>

              <div className="text-center relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Predicted Result</div>
                <h2 className="font-serif text-4xl text-stone-900 mb-4">{result.mixName}</h2>
                
                {/* Description */}
                <div className="text-sm text-stone-600 italic mb-6 max-w-md mx-auto">
                  {result.description}
                </div>

                {/* Safety Meter */}
                <div className="flex flex-col items-center gap-2 mb-6">
                   <div className="w-full max-w-xs h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${result.safety > 80 ? 'bg-green-500' : result.safety > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${result.safety}%` }}
                      ></div>
                   </div>
                   <span className={`text-xs font-bold uppercase tracking-wide ${result.safety > 80 ? 'text-green-600' : result.safety > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                     {result.verdict} ({result.safety}% Safe)
                   </span>
                </div>

                {/* Tips */}
                {result.tips && result.tips.length > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700 mb-4">
                    <div className="font-bold mb-1">✨ Positive Notes:</div>
                    {result.tips.map((tip: string, i:number) => <div key={i}>{tip}</div>)}
                  </div>
                )}

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 mb-6">
                    <div className="font-bold mb-1">⚠️ Considerations:</div>
                    {result.warnings.map((w: string, i:number) => <div key={i}>{w}</div>)}
                  </div>
                )}

                {/* Combined Vibes */}
                <div className="flex flex-wrap justify-center gap-2">
                  {result.combinedVibes.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 border border-stone-200 bg-stone-50 rounded-full text-[10px] uppercase tracking-wide text-stone-600">
                      {tag}
                    </span>
                  ))}
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}