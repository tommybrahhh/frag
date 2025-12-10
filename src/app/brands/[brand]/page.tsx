'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Perfume {
  id: string;
  name: string;
  image_url: string;
  brand: {
    name: string;
  };
  perfumer: string;
  rating?: number;
  vibe_tags?: string[];
  best_season?: string[];
  price_tier?: string;
}

export default function BrandPage() {
  const params = useParams();
  
  // State for the brand name and the list of perfumes
  const [brand, setBrand] = useState<string>('');
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the async params safely
    const slug = params?.brand;
    if (!slug) return;

    const fetchData = async () => {
      try {
        // Decode the URL (e.g. "Chanel%20Paris" -> "Chanel Paris")
        const brandName = decodeURIComponent(slug as string);
        
        const res = await fetch(`/api/brands/${brandName}`);
        
        if (!res.ok) throw new Error('Failed to fetch brand data');
        
        const data = await res.json();

        setBrand(data.brand);
        setPerfumes(data.perfumes || []);

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-400">Loading brand...</div>;
  if (error) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 pb-20 font-sans">
      {/* Nav */}
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-16 z-20">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">Brand Library</span>
        <div className="w-8"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        
        {/* HERO: Brand Details */}
        <div className="bg-white rounded-3xl p-10 border border-stone-100 shadow-sm mb-16 text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <div 
              className="w-16 h-16 rounded-full shadow-inner border-4 border-stone-50 bg-stone-200 flex items-center justify-center"
            >
              <span className="text-stone-600 text-2xl font-serif font-medium">
                {brand.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <h1 className="font-serif text-5xl text-stone-900 mb-6">
            {brand}
          </h1>
          <p className="text-lg text-stone-600 font-serif leading-relaxed italic">
            Perfume House & Brand
          </p>
        </div>

        {/* PERFUME GRID */}
        <div className="border-t border-stone-200 pt-10">
          <h3 className="font-serif text-2xl text-stone-900 mb-8">{perfumes.length} Fragrances</h3>
          
          {perfumes.length === 0 ? (
            <div className="text-stone-400 italic">No perfumes found from this brand yet.</div>
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
                    <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1">{p.perfumer}</div>
                    <div className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition">{p.name}</div>
                    {p.rating && (
                      <div className="text-xs text-stone-400 mt-1">⭐ {p.rating}/5</div>
                    )}
                    {p.price_tier && (
                      <div className="text-[10px] text-stone-400 uppercase tracking-wider mt-1">
                        {p.price_tier}
                      </div>
                    )}
                    {p.best_season && p.best_season.length > 0 && (
                      <div className="text-[9px] text-stone-400 mt-1">
                        {p.best_season.join(', ')}
                      </div>
                    )}
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