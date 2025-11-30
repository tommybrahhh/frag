'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import VibeSelector from '@/components/VibeSelector';
import SearchBar from '@/components/SearchBar';

// Helper for horizontal rows
const PerfumeRow = ({ title, items }: { title: string, items: any[] }) => (
  <div className="mb-16">
    <div className="flex justify-between items-end mb-6 px-6">
      <h3 className="font-serif text-2xl text-stone-900">{title}</h3>
      <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase cursor-pointer hover:text-stone-900">View All</span>
    </div>
    
    <div className="flex gap-6 overflow-x-auto pb-8 px-6 scrollbar-hide">
      {items.map((p) => (
        <Link 
          key={p.id} 
          href={`/perfume/${p.id}`} 
          className="min-w-[200px] w-[200px] group flex-shrink-0"
        >
          <div className="bg-white rounded-xl h-64 flex items-center justify-center p-6 border border-transparent group-hover:border-stone-200 transition-all duration-500 relative mb-4">
             {p.image_url ? (
               <img 
                 src={p.image_url} 
                 alt={p.name} 
                 className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700" 
               />
             ) : (
               <span className="text-xs text-stone-300">No Image</span>
             )}
          </div>
          <div className="text-center px-2">
             <Link 
               href={`/brands/${encodeURIComponent(p.brand?.name || 'Unknown House')}`}
               className="text-[9px] font-bold tracking-widest text-stone-400 uppercase truncate mb-1 hover:text-stone-600 transition-colors"
               onClick={(e) => e.stopPropagation()}
             >
               {p.brand?.name}
             </Link>
             <div className="font-serif text-md text-stone-900 leading-tight group-hover:text-stone-600 transition truncate">{p.name}</div>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

interface Perfume {
  id: string;
  name: string;
  image_url: string | null;
  rating: number | null;
  vibe_tags: string[] | null;
  brand: { name: string } | null;
  best_season?: string[];
  occasions?: string[];
}

export default function Home() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState('All');
  const [featuredPerfume, setFeaturedPerfume] = useState<Perfume | null>(null);

  useEffect(() => {
    const fetchPerfumes = async () => {
      try {
        const res = await fetch('/api/perfumes');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setPerfumes(data);
        
        // Set a featured perfume (e.g., first one with image)
        const withImage = data.find((p: Perfume) => p.image_url);
        setFeaturedPerfume(withImage || data[0]);
      } catch (err) {
        console.error('Error fetching perfumes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfumes();
  }, []);

  // Filter Logic
  const filteredPerfumes = selectedVibe === 'All'
    ? perfumes
    : perfumes.filter(p => p.vibe_tags?.includes(selectedVibe));

  // Curated Collections
  const winterPerfumes = perfumes.filter(p => p.best_season?.includes('Winter'));
  const dateNightPerfumes = perfumes.filter(p => p.occasions?.includes('Date'));

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-400 text-sm tracking-widest">LOADING COLLECTION...</div>;

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans selection:bg-stone-900 selection:text-white">
      
      {/* NAVBAR */}
      <nav className="px-6 py-6 flex justify-between items-center max-w-[1400px] mx-auto">
        <div className="text-xl font-serif font-bold tracking-tighter">PI.</div>
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          <Link href="/layering" className="hover:text-stone-900 transition">Layering Lab</Link>
          <Link href="/quiz" className="hover:text-stone-900 transition text-stone-900">Scent Quiz</Link>
        </div>
      </nav>

      {/* HERO SECTION - Split Screen */}
      <section className="min-h-[80vh] grid md:grid-cols-2 gap-8 px-6 py-12 max-w-[1400px] mx-auto">
        {/* Left: Big Typography */}
        <div className="flex flex-col justify-center">
          <h6 className="text-[10px] font-bold tracking-[0.3em] text-stone-400 uppercase mb-4">Featured Essence</h6>
          <h1 className="text-5xl md:text-7xl font-serif text-stone-900 mb-6 leading-tight">
            {featuredPerfume?.name || 'Angels\' Share'}
          </h1>
          <p className="text-lg text-stone-600 mb-8 leading-relaxed">
            A captivating blend of warmth and mystery. The perfect signature scent for those who appreciate depth and sophistication.
          </p>
          <Link 
            href="/quiz" 
            className="inline-block bg-stone-900 text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-colors shadow-lg hover:shadow-xl"
          >
            Discover Your Scent
          </Link>
        </div>

        {/* Right: Large Bottle Image */}
        <div className="flex items-center justify-center p-8">
          {featuredPerfume?.image_url ? (
            <img
              src={featuredPerfume.image_url}
              alt={featuredPerfume.name}
              className="h-96 w-full object-contain mix-blend-multiply drop-shadow-2xl"
            />
          ) : (
            <div className="w-full h-96 bg-stone-100 rounded-xl flex items-center justify-center">
              <span className="text-stone-300 text-sm">Featured Image</span>
            </div>
          )}
        </div>
      </section>

      {/* FEATURE NAVIGATION - 3 Column Grid */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="font-serif text-3xl text-stone-900 text-center mb-12">Explore Our Tools</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Find Your Signature */}
            <Link href="/quiz" className="group">
              <div className="bg-[#FDFBF7] border border-stone-200 rounded-2xl p-8 text-center hover:border-stone-400 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl">✨</span>
                </div>
                <h3 className="font-serif text-xl text-stone-900 mb-3">Find Your Signature</h3>
                <p className="text-stone-600 text-sm">Discover scents that match your personality and lifestyle</p>
              </div>
            </Link>

            {/* Card 2: The Layering Lab */}
            <Link href="/layering" className="group">
              <div className="bg-[#FDFBF7] border border-stone-200 rounded-2xl p-8 text-center hover:border-stone-400 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl">🧪</span>
                </div>
                <h3 className="font-serif text-xl text-stone-900 mb-3">The Layering Lab</h3>
                <p className="text-stone-600 text-sm">Create unique scent combinations and discover perfect pairs</p>
              </div>
            </Link>

            {/* Card 3: Smart Search */}
            <div className="group cursor-pointer">
              <div className="bg-[#FDFBF7] border border-stone-200 rounded-2xl p-8 text-center hover:border-stone-400 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl">🔍</span>
                </div>
                <h3 className="font-serif text-xl text-stone-900 mb-3">Smart Search</h3>
                <p className="text-stone-600 text-sm">Find exactly what you're looking for with advanced filters</p>
                <div className="mt-4">
                  <SearchBar />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CURATED COLLECTIONS */}
      <section className="px-6 py-16 bg-[#FDFBF7]">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Winter Essentials Row */}
          {winterPerfumes.length > 0 && (
            <PerfumeRow title="Winter Essentials" items={winterPerfumes.slice(0, 6)} />
          )}

          {/* Date Night Row */}
          {dateNightPerfumes.length > 0 && (
            <PerfumeRow title="Date Night" items={dateNightPerfumes.slice(0, 6)} />
          )}

          {/* All Collections Grid with Vibe Selector */}
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-serif text-2xl text-stone-900">All Collections</h2>
              <VibeSelector selectedVibe={selectedVibe} onSelectVibe={setSelectedVibe} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPerfumes.map((perfume) => (
                <Link key={perfume.id} href={`/perfume/${perfume.id}`} className="group block">
                  <div className="bg-white rounded-xl h-80 flex items-center justify-center p-6 border border-transparent group-hover:border-stone-200 transition-all duration-500 group-hover:shadow-xl">
                    {perfume.image_url ? (
                      <img src={perfume.image_url} alt={perfume.name} className="h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="text-stone-300 text-xs uppercase tracking-widest">No Image</div>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <Link 
                      href={`/brands/${encodeURIComponent(perfume.brand?.name || 'Unknown House')}`}
                      className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 hover:text-stone-600 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {perfume.brand?.name || 'Unknown House'}
                    </Link>
                    <h3 className="font-serif text-lg text-stone-900 group-hover:text-stone-600 transition-colors">
                      {perfume.name}
                    </h3>
                    <div className="flex justify-center gap-2 mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                      {perfume.vibe_tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[9px] text-stone-500 border border-stone-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {filteredPerfumes.length === 0 && (
              <div className="text-center py-20 text-stone-400 italic">
                No perfumes found matching this vibe.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
