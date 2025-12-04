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
  const [showTutorial, setShowTutorial] = useState(false);
  const [savedCombinations, setSavedCombinations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mixingRatio, setMixingRatio] = useState<'70/30' | '50/50' | '30/70'>('70/30');

  // Fetch compatible perfumes when base is selected
  useEffect(() => {
    const fetchCompatiblePerfumes = async () => {
      if (basePerfume) {
        setLoading(true);
        setError(null);
        try {
          const perfumes = await getCompatiblePerfumes(basePerfume);
          setCompatiblePerfumes(perfumes);
          setStep('select-top');
        } catch (error) {
          console.error('Error fetching compatible perfumes:', error);
          setError('Failed to load compatible perfumes. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCompatiblePerfumes();
  }, [basePerfume]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTutorial) {
          setShowTutorial(false);
        } else if (step === 'result') {
          resetSelection();
        }
      }
      if (e.key === 'Enter' && step === 'select-top' && topPerfume) {
        handleMix();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [step, topPerfume, showTutorial]);

  const handleMix = () => {
    if (basePerfume && topPerfume) {
      const analysis = mixPerfumes(basePerfume, topPerfume);
      setResult({
        ...analysis,
        mixingRatio,
        applicationTips: getApplicationTips(mixingRatio, analysis.safety)
      });
      setStep('result');
    }
  };

  const getApplicationTips = (ratio: string, safety: number) => {
    const tips: string[] = [];
    
    switch (ratio) {
      case '70/30':
        tips.push('Apply base perfume to pulse points first');
        tips.push('Wait 2-3 minutes for base to settle');
        tips.push('Lightly spray top perfume over same areas');
        break;
      case '50/50':
        tips.push('Apply both perfumes to different pulse points');
        tips.push('Blend gently by rubbing wrists together');
        tips.push('Consider spraying one on clothes, one on skin');
        break;
      case '30/70':
        tips.push('Apply top perfume to pulse points first');
        tips.push('Wait 1-2 minutes before adding base');
        tips.push('Use base as an accent rather than foundation');
        break;
    }

    if (safety < 50) {
      tips.push('⚠️ Test on skin first before full application');
      tips.push('Consider applying to different body areas');
    }

    if (safety >= 80) {
      tips.push('✅ Safe to apply directly layered');
    }

    return tips;
  };

  const resetSelection = () => {
    setBasePerfume(null);
    setTopPerfume(null);
    setCompatiblePerfumes([]);
    setResult(null);
    setStep('select-base');
  };

  const saveCombination = () => {
    if (result && basePerfume && topPerfume) {
      const newCombination = {
        id: Date.now(),
        base: basePerfume,
        top: topPerfume,
        result: result,
        timestamp: new Date().toISOString()
      };
      setSavedCombinations(prev => [newCombination, ...prev.slice(0, 4)]);
    }
  };

  const loadCombination = (combination: any) => {
    setBasePerfume(combination.base);
    setTopPerfume(combination.top);
    setResult(combination.result);
    setStep('result');
  };

  return (
    <div className="min-h-screen bg-white text-stone-800 pb-20 font-sans">
      
      {/* Nav */}
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-0 z-20">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase">← Home</Link>
        <span className="font-serif text-xl italic">The Layering Lab</span>
        <button
          onClick={() => setShowTutorial(true)}
          className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition"
        >
          Tutorial
        </button>
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
                showFilters={true}
              />
            </div>

            {/* Loading state */}
            {loading && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-stone-900"></div>
                <p className="text-xs text-stone-500 mt-2">Finding compatible perfumes...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-red-600 text-xs font-bold hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            )}

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

            {/* Quick tips */}
            <div className="mt-8 text-xs text-stone-400">
              💡 Press <kbd className="px-1 py-0.5 bg-stone-200 rounded text-stone-700">Esc</kbd> to reset
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
                showFilters={true}
              />
            </div>

            {/* Quick action tips */}
            <div className="mt-4 text-xs text-stone-400">
              {topPerfume ? (
                <>💡 Press <kbd className="px-1 py-0.5 bg-stone-200 rounded text-stone-700">Enter</kbd> to analyze</>
              ) : (
                <>💡 Choose a top perfume to continue</>
              )}
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
                        {perfume.image_url && <img src={perfume.image_url} className="h-full object-contain mix-blend-multiply" />}
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

            {/* Mixing Ratio Selector */}
            {topPerfume && (
              <div className="mt-6">
                <label className="block text-xs font-bold text-stone-600 mb-2">MIXING RATIO:</label>
                <div className="flex justify-center gap-2">
                  {(['70/30', '50/50', '30/70'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setMixingRatio(ratio)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition ${
                        mixingRatio === ratio
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-2">
                  {mixingRatio === '70/30' && 'Base dominant, top as accent'}
                  {mixingRatio === '50/50' && 'Balanced blend'}
                  {mixingRatio === '30/70' && 'Top dominant, base as foundation'}
                </p>
              </div>
            )}

            {/* Mix Button */}
            <div className="mt-8 text-center">
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

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-xs font-bold text-stone-600 mb-1">LONGEVITY</div>
                      <div className="text-lg font-bold text-stone-900">{result.performance.longevity}h</div>
                      <div className="text-[10px] text-stone-400">Lasting power</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-stone-600 mb-1">SILLAGE</div>
                      <div className="text-lg font-bold text-stone-900">
                        {'⭐'.repeat(result.performance.sillage)}
                      </div>
                      <div className="text-[10px] text-stone-400">Scent trail</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-stone-600 mb-1">PROJECTION</div>
                      <div className="text-lg font-bold text-stone-900">
                        {'⭐'.repeat(result.performance.projection)}
                      </div>
                      <div className="text-[10px] text-stone-400">Strength</div>
                    </div>
                  </div>

                  {/* Visual Representation */}
                  <div className="mb-6">
                    <div className="text-xs font-bold text-stone-600 mb-3 text-center">SCENT PROFILE</div>
                    <div className="flex justify-center gap-2">
                      {result.visualization.map((item: any, index: number) => (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="w-8 h-8 rounded-full mb-1"
                            style={{
                              backgroundColor: item.color,
                              opacity: item.intensity
                            }}
                          />
                          <span className="text-[9px] uppercase text-stone-500">{item.vibe}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Combined Vibes */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {result.combinedVibes.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 border border-stone-200 bg-stone-50 rounded-full text-[10px] uppercase tracking-wide text-stone-600">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Mixing Instructions */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                    <div className="font-bold text-blue-900 mb-3 flex items-center">
                      <span className="text-lg mr-2">🧪</span>
                      Application Guide ({result.mixingRatio})
                    </div>
                    <div className="space-y-2 text-sm text-blue-700">
                      {result.applicationTips.map((tip: string, i: number) => (
                        <div key={i} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={resetSelection}
                      className="px-5 py-2 border border-stone-300 rounded-full text-xs font-bold uppercase tracking-wide text-stone-600 hover:bg-stone-50 transition"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={() => setStep('select-top')}
                      className="px-5 py-2 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-wide hover:bg-stone-800 transition"
                    >
                      Try Different Top
                    </button>
                    <button
                      onClick={saveCombination}
                      className="px-5 py-2 bg-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-wide hover:bg-blue-700 transition"
                    >
                      Save Mix
                    </button>
                  </div>

                  {/* Saved Combinations */}
                  {savedCombinations.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-sm font-bold text-stone-700 mb-3">Recent Mixes</h3>
                      <div className="grid gap-2">
                        {savedCombinations.map((combo) => (
                          <button
                            key={combo.id}
                            onClick={() => loadCombination(combo)}
                            className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition text-left"
                          >
                            <div className="flex-1">
                              <div className="text-xs font-medium">{combo.result.mixName}</div>
                              <div className="text-[10px] text-stone-500">
                                {combo.base.name} + {combo.top.name}
                              </div>
                            </div>
                            <div className={`text-xs font-bold ${
                              combo.result.safety > 80 ? 'text-green-600' :
                              combo.result.safety > 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {combo.result.safety}%
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
          
                  {/* Tutorial Modal */}
                  {showTutorial && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl p-6 max-w-md max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="font-serif text-2xl">Layering Guide</h2>
                          <button
                            onClick={() => setShowTutorial(false)}
                            className="text-stone-400 hover:text-stone-600 text-xl"
                          >
                            ×
                          </button>
                        </div>
                        
                        <div className="space-y-4 text-sm text-stone-600">
                          <div>
                            <h3 className="font-bold text-stone-900 mb-2">🎯 How to Layer Perfumes</h3>
                            <p>Start with heavier base notes and layer lighter top notes over them. Apply in this order:</p>
                            <ol className="list-decimal list-inside mt-2 space-y-1">
                              <li>Apply base perfume to pulse points</li>
                              <li>Wait 2-3 minutes for it to settle</li>
                              <li>Apply top perfume over the same areas</li>
                              <li>Blend gently with wrists</li>
                            </ol>
                          </div>
          
                          <div>
                            <h3 className="font-bold text-stone-900 mb-2">⚖️ Mixing Ratios</h3>
                            <ul className="space-y-1">
                              <li><strong>70/30:</strong> Base dominant, top as accent</li>
                              <li><strong>50/50:</strong> Balanced blend</li>
                              <li><strong>30/70:</strong> Top dominant, base as foundation</li>
                            </ul>
                          </div>
          
                          <div>
                            <h3 className="font-bold text-stone-900 mb-2">💡 Pro Tips</h3>
                            <ul className="space-y-1">
                              <li>Test on skin before committing</li>
                              <li>Consider longevity - layer shorter-lasting scents over longer-lasting ones</li>
                              <li>Start with small amounts and build up</li>
                              <li>Don't mix more than 2-3 perfumes at once</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}