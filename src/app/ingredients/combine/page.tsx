'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import IngredientSearch from '@/components/IngredientSearch';

interface Perfume {
  id: string;
  name: string;
  image_url: string;
  brand: {
    name: string;
  };
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
        } else {
          setPerfumes(data.perfumes || []);
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
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-0 z-20">
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
            />
          </div>
        </div>

        {/* Selected Ingredients Display */}
        {ingredientsData.length > 0 && (
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm mb-12">
            <h2 className="font-serif text-2xl text-stone-900 mb-6 text-center">
              Selected Ingredients
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ingredientsData.map((note) => (
                <div key={note.id} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-full shadow-inner border-4 border-stone-50"
                      style={{ backgroundColor: note.color_hex || '#ddd' }}
                    ></div>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-1">
                    {note.family} Family
                  </div>
                  <h3 className="font-serif text-lg text-stone-900 capitalize mb-2">
                    {note.name}
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {note.description || 'No description available.'}
                  </p>
                </div>
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
                          <div className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition">{p.name}</div>
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