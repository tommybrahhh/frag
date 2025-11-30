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
             {/* FIX: This is now a DIV, not a Link */}
             <div className="text-[9px] font-bold tracking-widest text-stone-400 uppercase truncate mb-1">
               {p.brand?.name}
             </div>
             <div className="font-serif text-md text-stone-900 leading-tight group-hover:text-stone-600 transition truncate">
               {p.name}
             </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default function Home() {
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState('All');

  useEffect(() => {
    const fetchPerfumes = async () => {
      try {
        const res = await fetch('/api/perfumes');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setPerfumes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerfumes();
  }, []);

  // Filter Logic
  const winterPerfumes = perfumes.filter(p => p.best_season?.includes('Winter'));
  const datePerfumes = perfumes.filter(p => p.occasions?.includes('Date') || p.occasions?.includes('Date Night'));
  const filteredGrid = selectedVibe === 'All' 
    ? perfumes 
    : perfumes.filter(p => p.vibe_tags?.includes(selectedVibe));

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-400 uppercase tracking-widest">Loading Collection...</div>;

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans selection:bg-stone-900 selection:text-white pb-24">
      
      {/* 1. NAVBAR */}
      <nav className="px-6 py-6 flex justify-between items-center max-w-[1400px] mx-auto">
        <div className="text-xl font-serif font-bold tracking-tighter">PI.</div>
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          <Link href="/layering" className="hover:text-stone-900 transition">Layering Lab</Link>
          <Link href="/quiz" className="hover:text-stone-900 transition text-stone-900">Scent Quiz</Link>
        </div>
      </nav>

      {/* 2. HERO SPOTLIGHT */}
      <div className="max-w-[1400px] mx-auto px-6 py-12 mb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
           <div className="order-2 md:order-1 text-center md:text-left">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-4 block">Featured Essence</span>
              <h1 className="text-5xl md:text-7xl font-serif text-stone-900 mb-6 leading-none">Black Opium Over Red</h1>
              <p className="text-stone-500 max-w-md mb-8 leading-relaxed mx-auto md:mx-0">
                A captivating blend of warmth and mystery. The perfect signature scent for those who appreciate depth and sophistication.
              </p>
              <Link 
                href="/perfume/search?q=Black%20Opium" 
                className="inline-block bg-stone-900 text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition shadow-lg"
              >
                Discover Your Scent
              </Link>
           </div>
           
           {/* Dynamic Hero Image */}
           <div className="order-1 md:order-2 h-[400px] md:h-[500px] flex items-center justify-center relative">
              {perfumes.find(p => p.name.includes('Black Opium')) && (
                <img 
                  src={perfumes.find(p => p.name.includes('Black Opium'))?.image_url} 
                  className="h-full w-full object-contain mix-blend-multiply drop-shadow-2xl" 
                />
              )}
           </div>
        </div>
      </div>

      {/* 3. TOOLS NAVIGATION */}
      <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-6 mb-24">
         <Link href="/quiz" className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition text-center group">
            <div className="text-3xl mb-4 group-hover:scale-110 transition">🧬</div>
            <h3 className="font-serif text-xl mb-2">Scent Quiz</h3>
            <p className="text-xs text-stone-400">Find your signature scent based on your personality.</p>
         </Link>
         
         <Link href="/layering" className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition text-center group">
            <div className="text-3xl mb-4 group-hover:scale-110 transition">⚗️</div>
            <h3 className="font-serif text-xl mb-2">Layering Lab</h3>
            <p className="text-xs text-stone-400">Mix two perfumes to create something unique.</p>
         </Link>

         <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition text-center group relative overflow-visible">
            <div className="text-3xl mb-4 group-hover:scale-110 transition">🔍</div>
            <h3 className="font-serif text-xl mb-2">Smart Search</h3>
            <div className="absolute left-4 right-4 bottom-4">
               {/* Search bar is visual here, real functionality is in header/overlay usually */}
            </div>
            <p className="text-xs text-stone-400">Search by notes, brands, or vibes instantly.</p>
         </div>
      </div>

      {/* 4. CURATED ROWS */}
      <div className="max-w-[1400px] mx-auto">
        <PerfumeRow title="Winter Essentials" items={winterPerfumes} />
        <PerfumeRow title="Date Night Weapons" items={datePerfumes} />
      </div>

      {/* 5. MAIN COLLECTION */}
      <div id="collection" className="max-w-[1400px] mx-auto px-6 mt-20">
        <div className="text-center mb-10">
           <h3 className="font-serif text-3xl mb-6">The Collection</h3>
           <div className="flex justify-center">
             <VibeSelector selectedVibe={selectedVibe} onSelectVibe={setSelectedVibe} />
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
          {filteredGrid.map((p) => (
            <Link key={p.id} href={`/perfume/${p.id}`} className="group block">
               <div className="bg-white rounded-xl h-56 flex items-center justify-center p-4 border border-transparent group-hover:border-stone-200 transition-all duration-500 relative mb-4">
                 {p.image_url ? (
                   <img src={p.image_url} alt={p.name} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700" />
                 ) : (
                   <div className="text-stone-300 text-xs">No Image</div>
                 )}
               </div>
               <div className="text-center px-1">
                 {/* FIX: Just text, no nested Link */}
                 <div className="text-[9px] font-bold tracking-widest text-stone-400 uppercase truncate mb-1">
                   {p.brand?.name}
                 </div>
                 <div className="font-serif text-sm text-stone-900 leading-tight group-hover:text-stone-600 transition truncate">
                   {p.name}
                 </div>
               </div>
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}