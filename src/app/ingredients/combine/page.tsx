'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import IngredientSearch from '@/components/IngredientSearch';
import { analyzeIngredientCombination, classifyNoteVolatility } from '@/lib/alchemy';

interface Perfume {
  id: string;
  name: string;
  image_url: string;
  price_tier?: string;
  brand: {
    name: string;
  };
  ingredient_positions?: Record<string, string>;
}

interface Note {
  id: string;
  name: string;
  description: string;
  family: string;
  color_hex: string;
}

export default function CombineIngredientsPage() {
  const router = useRouter();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientsData, setIngredientsData] = useState<Note[]>([]);
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alchemyAnalysis, setAlchemyAnalysis] = useState<{
    warnings: string[];
    tips: string[];
    hasClash: boolean;
    hasHarmony: boolean;
  }>({
    warnings: [],
    tips: [],
    hasClash: false,
    hasHarmony: false
  });

  // Group ingredients by volatility
  const groupedIngredients = ingredientsData.reduce((acc, note) => {
    const volatility = classifyNoteVolatility(note.name);
    if (!acc[volatility]) {
      acc[volatility] = [];
    }
    acc[volatility].push(note);
    return acc;
  }, {} as Record<string, typeof ingredientsData>);

  useEffect(() => {
    const fetchCombinedPerfumes = async () => {
      if (selectedIngredients.length === 0) {
        setPerfumes([]);
        setIngredientsData([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const ingredientsParam = selectedIngredients.map(encodeURIComponent).join(',');
        const res = await fetch(`/api/ingredients/combine?ingredients=${ingredientsParam}`);
        
        if (!res.ok) throw new Error('Failed to fetch combined ingredients data');
        
        const data = await res.json();

        if (data.ingredients) {
          setIngredientsData(data.ingredients);
          setPerfumes(data.perfumes || []);
          
          // Run alchemy analysis on the ingredients
          const analysis = analyzeIngredientCombination(data.ingredients);
          setAlchemyAnalysis(analysis);
        } else {
          setPerfumes(data.perfumes || []);
          setAlchemyAnalysis({
            warnings: [],
            tips: [],
            hasClash: false,
            hasHarmony: false
          });
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchCombinedPerfumes, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [selectedIngredients]);

  const handleIngredientsChange = (ingredients: string[]) => {
    setSelectedIngredients(ingredients);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 pb-20 font-sans">
      {/* Nav */}
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-16 z-20">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">Ingredient Combiner</span>
        <div className="w-8"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        
        {/* Search Section */}
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm mb-12">
          <h1 className="font-serif text-3xl text-stone-900 mb-6 text-center">
            Find Fragrances with Multiple Ingredients
          </h1>
          
          <p className="text-stone-600 text-center mb-8 max-w-2xl mx-auto">
            Search and add ingredients to discover perfumes that contain all of them. Perfect for finding fragrances with specific note combinations.
          </p>

          <div className="max-w-2xl mx-auto">
            <IngredientSearch
              onIngredientsChange={handleIngredientsChange}
              selectedIngredients={selectedIngredients}
              resolvedNotes={ingredientsData}
            />
          </div>
        </div>

        {/* Selected Ingredients Display */}
        {ingredientsData.length > 0 && (
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm mb-12">
            <h2 className="font-serif text-2xl text-stone-900 mb-6 text-center">
              Selected Ingredients
            </h2>
            
            {/* Alchemy Analysis Warnings */}
            {alchemyAnalysis.hasClash && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">⚠️ Potential Clash Warning</h3>
                <div className="text-red-700 text-sm">
                  {alchemyAnalysis.warnings.map((warning, index) => (
                    <div key={index} className="mb-1">• {warning}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Alchemy Analysis Tips */}
            {alchemyAnalysis.hasHarmony && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✨ Harmony Detected</h3>
                <div className="text-green-700 text-sm">
                  {alchemyAnalysis.tips.map((tip, index) => (
                    <div key={index} className="mb-1">• {tip}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Educational Section */}
            <div className="mb-8 p-6 bg-stone-50 border border-stone-200 rounded-2xl">
              <h3 className="font-serif text-xl text-stone-900 mb-4">Understanding Scent Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">Top Notes</div>
                  <p className="text-sm text-stone-600">First impression, evaporates quickly (15-30 min). Citrus, fresh, light aromatics.</p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">Heart Notes</div>
                  <p className="text-sm text-stone-600">Core character, lasts 2-4 hours. Floral, spice, green, fruity notes.</p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">Base Notes</div>
                  <p className="text-sm text-stone-600">Foundation, lasts 4-8+ hours. Woody, musk, amber, vanilla, deep notes.</p>
                </div>
              </div>
            </div>

            {/* Grouped Ingredients by Volatility */}
            <div className="space-y-6">
              {['Top', 'Heart', 'Base'].map((volatility) => (
                groupedIngredients[volatility]?.length > 0 && (
                  <div key={volatility} className="border border-stone-200 rounded-2xl p-6">
                    <h3 className="font-serif text-xl text-stone-900 mb-4">
                      {volatility} Notes
                      <span className="ml-2 text-sm font-normal text-stone-400">
                        ({groupedIngredients[volatility].length} ingredients)
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedIngredients[volatility].map((note) => (
                        <div key={note.id} className="flex items-center p-3 bg-stone-50 rounded-xl">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-stone-100 mr-3"
                            style={{ backgroundColor: note.color_hex || '#e5e7eb' }}
                          ></div>
                          <div className="flex-1">
                            <div className="font-medium text-stone-900 capitalize">{note.name}</div>
                            <div className="text-xs text-stone-500">{note.family} Family</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Results Section */}
        {selectedIngredients.length > 0 && (
          <div className="border-t border-stone-200 pt-10">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-stone-400 italic">Finding perfumes with {selectedIngredients.length} ingredients...</div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-400">{error}</div>
            ) : (
              <>
                <h3 className="font-serif text-2xl text-stone-900 mb-8 text-center">
                  {perfumes.length} Fragrances Found with All {selectedIngredients.length} Ingredients
                </h3>
                
                {perfumes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-stone-400 italic">
                      No perfumes found containing all {selectedIngredients.length} ingredients.
                    </div>
                    <p className="text-stone-500 text-sm mt-2">
                      Try selecting fewer ingredients or different combinations.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {perfumes.map((p) => (
                      <Link key={p.id} href={`/perfume/${p.id}`} className="group block bg-white rounded-xl p-4 hover:shadow-xl transition duration-500 border border-transparent hover:border-stone-100">
                        {/* Price badge */}
                        {p.price_tier && (
                          <div className="absolute top-3 right-3 bg-stone-900 text-white px-2 py-1 rounded-full text-[10px] font-bold tracking-widest">
                            {p.price_tier}
                          </div>
                        )}
                        
                        <div className="h-48 mb-4 overflow-hidden flex items-center justify-center p-2">
                          {p.image_url ? (
                            <img src={p.image_url} className="h-full object-contain group-hover:scale-110 transition duration-700" />
                          ) : (
                            <div className="text-stone-300 text-xs">No Image</div>
                          )}
                        </div>
                        
                        <div className="text-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/brands/${encodeURIComponent(p.brand?.name || 'Unknown House')}`);
                            }}
                            className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 hover:text-stone-600 transition-colors"
                          >
                            {p.brand?.name}
                          </button>
                          
                          <div className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition mb-2">
                            {p.name}
                          </div>
                          
                          {/* Ingredient positions */}
                          {p.ingredient_positions && Object.entries(p.ingredient_positions).map(([ingredient, position]) => (
                            <div key={ingredient} className="text-xs text-stone-500 mb-1">
                              <span className="font-medium capitalize">{ingredient}</span>
                              <span className="text-stone-400 ml-1">({position})</span>
                            </div>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {selectedIngredients.length === 0 && (
          <div className="text-center py-20">
            <div className="text-stone-400 italic mb-4">
              Add some ingredients to discover fragrances that contain them all
            </div>
            <div className="text-stone-500 text-sm">
              Try searching for notes like "Vanilla", "Sandalwood", or "Bergamot"
            </div>
          </div>
        )}

      </div>
    </div>
  );
}