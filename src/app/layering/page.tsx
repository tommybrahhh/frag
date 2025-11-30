'use client';

import { useState, useEffect } from 'react';
import PerfumePicker from '@/components/PerfumePicker';
import { mixPerfumes, getCompatiblePerfumes } from '@/lib/alchemy';
import Link from 'next/link';

export default function LayeringLab() {
  const [step, setStep] = useState<'select-base' | 'select-top' | 'result'>('select-base');
  const [basePerfume, setBasePerfume] = useState<any>(null);
  const [topPerfume, setTopPerfume] = useState<any>(null);
  const [compatiblePerfumes, setCompatiblePerfumes] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch compatible perfumes when base is selected
  useEffect(() => {
    const fetchCompatiblePerfumes = async () => {
      if (basePerfume) {
        setLoading(true);
        try {
          const perfumes = await getCompatiblePerfumes(basePerfume);
          setCompatiblePerfumes(perfumes);
          setStep('select-top');
        } catch (error) {
          console.error('Error fetching compatible perfumes:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCompatiblePerfumes();
  }, [basePerfume]);

  const handleMix = () => {
    if (basePerfume && topPerfume) {
      const analysis = mixPerfumes(basePerfume, topPerfume);
      setResult(analysis);
      setStep('result');
    }
  };

  const resetSelection = () => {
    setBasePerfume(null);
    setTopPerfume(null);
    setCompatiblePerfumes([]);
    setResult(null);
    setStep('select-base');
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
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-8">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                step !== 'select-base' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'bg-white border-stone-800 text-stone-800'
              }`}>
                1
              </div>
              <span className="text-xs mt-2 text-stone-600">Choose Base</span>
            </div>
            
            <div className="w-12 h-0.5 bg-stone-300"></div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                step === 'result' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : step === 'select-top'
                  ? 'bg-white border-stone-800 text-stone-800'
                  : 'bg-stone-100 border-stone-300 text-stone-400'
              }`}>
                2
              </div>
              <span className="text-xs mt-2 text-stone-600">Choose Top</span>
            </div>
            
            <div className="w-12 h-0.5 bg-stone-300"></div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                step === 'result' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'bg-stone-100 border-stone-300 text-stone-400'
              }`}>
                3
              </div>
              <span className="text-xs mt-2 text-stone-600">Result</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Base Perfume */}
        {step === 'select-base' && (
          <div className="text-center">
            <h1 className="font-serif text-4xl mb-4">Start with Your Base</h1>
            <p className="text-stone-500 text-sm mb-8">
              Choose a fragrance with deeper, longer-lasting notes as your foundation.
            </p>
            
            <div className="max-w-md mx-auto">
              <PerfumePicker 
                label="Base Layer" 
                onSelect={setBasePerfume} 
                selected={basePerfume}
                placeholder="Search for a base perfume..."
              />
            </div>

            <div className="mt-12 bg-stone-50 border border-stone-200 rounded-xl p-6">
              <h3 className="font-bold text-stone-900 mb-3">Good Base Choices:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-stone-600">
                <div>
                  <span className="font-semibold">Woody</span> - Sandalwood, Cedar, Vetiver
                </div>
                <div>
                  <span className="font-semibold">Oriental</span> - Amber, Vanilla, Spices
                </div>
                <div>
                  <span className="font-semibold">Gourmand</span> - Chocolate, Coffee, Caramel
                </div>
                <div>
                  <span className="font-semibold">Musk</span> - Clean, Warm, Animalic
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Top Perfume */}
        {step === 'select-top' && (
          <div className="text-center">
            <h1 className="font-serif text-4xl mb-4">Add Your Top Note</h1>
            <p className="text-stone-500 text-sm mb-8">
              Now choose a complementary fragrance to layer over your base.
            </p>

            <div className="max-w-md mx-auto">
              <PerfumePicker 
                label="Top Layer" 
                onSelect={setTopPerfume} 
                selected={topPerfume}
                placeholder="Search for a top perfume..."
                filterOptions={compatiblePerfumes}
              />
            </div>

            {/* Compatibility Suggestions */}
            {compatiblePerfumes.length > 0 && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="font-bold text-green-900 mb-3">💡 Smart Suggestions</h3>
                <p className="text-sm text-green-700 mb-4">
                  Based on your base choice, these would work well:
                </p>
                <div className="grid gap-2">
                  {compatiblePerfumes.slice(0, 3).map((perfume) => (
                    <div key={perfume.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <div className="w-8 h-8 bg-stone-100 rounded flex items-center justify-center">
                        {perfume.image_url && <img src={perfume.image_url} className="h-full object-contain" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{perfume.name}</div>
                        <div className="text-xs text-stone-500">{perfume.brand_name}</div>
                      </div>
                      <div className="text-xs text-green-600 font-semibold">✓ Good match</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mix Button */}
            <div className="mt-10 text-center">
              <button
                disabled={!topPerfume}
                onClick={handleMix}
                className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500
                  ${topPerfume 
                    ? 'bg-stone-900 text-white hover:scale-105 shadow-xl' 
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
              >
                Analyze Your Mix
              </button>
              
              <button
                onClick={() => setStep('select-base')}
                className="ml-4 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] text-stone-600 hover:text-stone-800 transition"
              >
                Change Base
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && result && (
          <div className="text-center">
            <h1 className="font-serif text-4xl mb-4">Your Scent Creation</h1>
            
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                       {result.verdict} ({result.safety}% Compatible)
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
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {result.combinedVibes.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 border border-stone-200 bg-stone-50 rounded-full text-[10px] uppercase tracking-wide text-stone-600">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={resetSelection}
                      className="px-6 py-2 border border-stone-300 rounded-full text-xs font-bold uppercase tracking-wide text-stone-600 hover:bg-stone-50 transition"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={() => setStep('select-top')}
                      className="px-6 py-2 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-wide hover:bg-stone-800 transition"
                    >
                      Try Different Top
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}