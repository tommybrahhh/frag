'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function IngredientPage() {
  const params = useParams();
  const router = useRouter();
  
  const [note, setNote] = useState<Note | null>(null);
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const slug = params?.slug || params?.ingredient;
    if (!slug) return;

    const fetchData = async () => {
      try {
        const term = decodeURIComponent(slug as string);
        
        const res = await fetch(`/api/ingredients/${term}`);
        
        if (!res.ok) throw new Error('Failed to fetch ingredient data');
        
        const data = await res.json();

        if (data.note) {
          setNote(data.note);
          setPerfumes(data.perfumes || []);
        } else if (Array.isArray(data)) {
          setPerfumes(data);
        } else {
          throw new Error('Invalid API response format');
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-400">Loading ingredient...</div>;
  if (error) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 pb-20 font-sans">
      {/* Nav */}
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-0 z-20">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">Ingredient Library</span>
        <div className="w-8"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        
        {/* HERO: Note Details */}
        {note && (
          <div className="bg-white rounded-3xl p-10 border border-stone-100 shadow-sm mb-16 text-center max-w-3xl mx-auto">
             <div className="flex justify-center mb-6">
               <div 
                 className="w-16 h-16 rounded-full shadow-inner border-4 border-stone-50"
                 style={{ backgroundColor: note.color_hex || '#ddd' }}
               ></div>
             </div>
             <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">
               {note.family} Family
             </div>
             <h1 className="font-serif text-5xl text-stone-900 mb-6 capitalize">
               {note.name}
             </h1>
             <p className="text-lg text-stone-600 font-serif leading-relaxed italic">
               "{note.description || 'No description available for this note.'}"
             </p>
          </div>
        )}

        {/* PERFUME GRID */}
        <div className="border-t border-stone-200 pt-10">
          <h3 className="font-serif text-2xl text-stone-900 mb-8">Found in {perfumes.length} Fragrances</h3>
          
          {perfumes.length === 0 ? (
            <div className="text-stone-400 italic">No perfumes found with this note yet.</div>
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
                    {/* FIX: Changed from Link to button to prevent hydration error */}
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
        </div>

      </div>
    </div>
  );
}