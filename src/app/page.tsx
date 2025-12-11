'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';

// --- Components ---

const HeroSection = () => (
  <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center bg-[#FDFBF7] overflow-hidden mb-16">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-50/50 via-transparent to-transparent opacity-60" />
    
    <div className="relative z-10 text-center max-w-4xl px-6">
      <span className="inline-block mb-4 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">
        Discover Your Signature
      </span>
      <h1 className="text-5xl md:text-7xl font-serif font-medium text-stone-900 mb-8 leading-[1.1]">
        Perfume Intuition
      </h1>
      <p className="text-stone-600 max-w-lg mx-auto mb-10 text-lg font-light leading-relaxed">
        Explore a curated universe of fragrances. From niche masterpieces to timeless classics, find the scent that speaks to your soul.
      </p>
      
      <div className="max-w-md mx-auto">
        <SearchBar />
      </div>
    </div>
  </section>
);

const SectionHeader = ({ title, linkText = "View All", linkHref = "#" }: { title: string, linkText?: string, linkHref?: string }) => (
  <div className="flex justify-between items-end mb-8 px-6 max-w-[1400px] mx-auto w-full">
    <h3 className="font-serif text-3xl text-stone-900">{title}</h3>
    <Link href={linkHref} className="text-[10px] font-bold tracking-widest text-stone-400 uppercase hover:text-stone-900 transition-colors">
      {linkText}
    </Link>
  </div>
);

const HorizontalScrollRow = ({ items }: { items: any[] }) => (
  <div className="w-full overflow-x-auto pb-12 mb-16 scrollbar-hide">
    <div className="flex gap-6 px-6 max-w-[1400px] mx-auto">
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/perfume/${p.id}`}
          className="min-w-[220px] w-[220px] group flex-shrink-0"
        >
          <div className="bg-white rounded-2xl h-72 flex items-center justify-center p-6 border border-transparent shadow-sm group-hover:shadow-md transition-all duration-500 relative mb-4">
             {p.image_url ? (
               <img
                 src={p.image_url}
                 alt={p.name}
                 className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-700"
               />
             ) : (
               <span className="text-xs text-stone-300">No Image</span>
             )}
             <div className="absolute top-4 left-4">
                <span className="px-2 py-1 bg-stone-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-full">New</span>
             </div>
          </div>
          <div className="px-2">
             <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase truncate mb-1">
               {p.brand?.name}
             </div>
             <div className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition truncate">
               {p.name}
             </div>
          </div>
        </Link>
      ))}
      
      {/* "See More" Card */}
      <div className="min-w-[150px] flex items-center justify-center">
         <Link href="/search/advanced" className="w-16 h-16 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-900 hover:text-stone-900 transition">
           →
         </Link>
      </div>
    </div>
  </div>
);

// --- Main Page Component ---

export default function Home() {
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters State
  const [filters, setFilters] = useState<any>({
    price: [], gender: [], longevity: [], season: [], concentration: [], tier: [], moment: [], occasion: []
  });

  // Intersection Observer for Infinite Scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPerfumeElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch New Arrivals (Once on Mount)
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const res = await fetch('/api/perfumes?limit=10&page=1');
        const data = await res.json();
        setNewArrivals(data.perfumes || []);
      } catch (err) {
        console.error('Failed to fetch new arrivals', err);
      }
    };
    fetchNewArrivals();
  }, []);

  // Fetch Main Collection (Dependent on Page & Filters)
  useEffect(() => {
    const fetchPerfumes = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '24'); // Fetch 24 items per page

        // Append active filters
        Object.keys(filters).forEach(key => {
          if (filters[key].length > 0) {
            params.append(key, filters[key].join(','));
          }
        });

        const res = await fetch(`/api/perfumes?${params.toString()}`);
        const data = await res.json();
        
        if (data.perfumes) {
          setPerfumes(prev => page === 1 ? data.perfumes : [...prev, ...data.perfumes]);
          setHasMore(data.hasMore);
        }
      } catch (err) {
        console.error('Failed to fetch collection', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfumes();
  }, [page, filters]);

  // Reset pagination when filters change
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
    setPerfumes([]); // Clear current list to avoid weird jumps
    setHasMore(true);
  };

  const router = useRouter();

  return (
    <main className="min-h-screen bg-white text-stone-800 pb-24">
      
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. New Arrivals (Horizontal Scroll) */}
      <SectionHeader title="Just Arrived" linkText="View All" linkHref="/search/advanced?sort=newest" />
      <HorizontalScrollRow items={newArrivals} />

      {/* 3. Filter Bar */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100 py-4 mb-12">
         <FilterBar onFilterChange={handleFilterChange} />
      </div>

      {/* 4. Main Infinite Grid */}
      <div className="max-w-[1400px] mx-auto px-6">
        <h3 className="font-serif text-3xl text-stone-900 mb-8 text-center md:text-left">The Collection</h3>
        
        {perfumes.length === 0 && !loading && (
          <div className="text-center py-24 text-stone-400">
            <p>No perfumes found matching your criteria.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 text-stone-900 underline underline-offset-4"
            >
              Clear all filters
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
          {perfumes.map((p, index) => {
            const isLast = index === perfumes.length - 1;
            return (
              <div key={`${p.id}-${index}`} ref={isLast ? lastPerfumeElementRef : null}>
                <Link href={`/perfume/${p.id}`} className="group block h-full">
                  <div className="bg-stone-50 rounded-xl h-64 flex items-center justify-center p-6 relative overflow-hidden mb-4 group-hover:bg-stone-100 transition-colors duration-500">
                    {p.image_url ? (
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700 ease-in-out" 
                      />
                    ) : (
                      <div className="text-stone-300 text-xs font-bold uppercase tracking-widest">No Image</div>
                    )}
                    
                    {/* Rating Badge */}
                    {p.rating && (
                      <div className="absolute top-3 right-3 bg-white/80 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold text-stone-900 shadow-sm">
                        ★ {p.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center md:text-left">
                    <div className="text-[9px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2 truncate">
                      {p.brand?.name || 'Unknown Brand'}
                    </div>
                    <h4 className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition-colors line-clamp-2 min-h-[1.25em]">
                      {p.name}
                    </h4>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="py-12 flex justify-center">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

    </main>
  );
}