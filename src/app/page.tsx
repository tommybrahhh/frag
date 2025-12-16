'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VisualGrid from '@/components/VisualGrid';
import LatestDrop from '@/components/LatestDrop';
import CommunityBuzz from '@/components/CommunityBuzz';
import HorizontalScrollRow from '@/components/HorizontalScrollRow';
import SectionHeader from '@/components/SectionHeader';
import FilterBar from '@/components/FilterBar';
import { createClient } from '@/utils/supabase/client';

interface Perfume {
  id: string;
  name: string;
  brand: { name: string };
  image_url: string;
  rating?: number;
}

export default function Home() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [newArrivals, setNewArrivals] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<any>({
    price: [], gender: [], longevity: [], season: [], concentration: [], tier: [], moment: [], occasion: []
  });

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

  // Fetch New Arrivals
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const res = await fetch('/api/perfumes?limit=8&page=1');
        const data = await res.json();
        setNewArrivals(data.perfumes || []);
      } catch (err) {
        console.error('Failed to fetch new arrivals', err);
      }
    };
    fetchNewArrivals();
  }, []);

  // Fetch Main Collection
  useEffect(() => {
    const fetchPerfumes = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '24'); 

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

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
    setPerfumes([]); 
    setHasMore(true);
  };

  const router = useRouter();

  return (
    <main className="min-h-screen bg-white text-stone-800 pb-24">
      <VisualGrid />
      <LatestDrop perfume={newArrivals[0]} />
      
      <SectionHeader title="Just Arrived" linkText="View All" linkHref="/search/advanced?sort=newest" />
      <HorizontalScrollRow items={newArrivals.slice(1, 8)} />
      
      <CommunityBuzz />

      <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-sm border-y border-stone-100 py-4 mb-12 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
         <FilterBar onFilterChange={handleFilterChange} />
      </div>

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-end justify-between mb-8">
           <h3 className="font-serif text-3xl text-stone-900">The Collection</h3>
           <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">{perfumes.length} Scents</span>
        </div>
        
        {perfumes.length === 0 && !loading && (
          <div className="text-center py-24 text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <p className="mb-2">No perfumes found matching your criteria.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-stone-900 text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-stone-600"
            >
              Clear Filters
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-16">
          {perfumes.map((p, index) => {
            const isLast = index === perfumes.length - 1;
            return (
              <div key={`${p.id}-${index}`} ref={isLast ? lastPerfumeElementRef : null}>
                <Link href={`/perfume/${p.id}`} className="group block h-full">
                  <div className="bg-[#F9F9F9] rounded-xl h-72 flex items-center justify-center p-8 relative overflow-hidden mb-5 group-hover:bg-[#F0F0F0] transition-colors duration-500">
                    {p.image_url ? (
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700 ease-in-out" 
                      />
                    ) : (
                      <div className="text-stone-300 text-xs font-bold uppercase tracking-widest">No Image</div>
                    )}
                    
                    {p.rating && (
                      <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded text-[10px] font-bold text-stone-900 shadow-sm">
                        {p.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-[9px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2 truncate">
                      {p.brand?.name || 'Unknown Brand'}
                    </div>
                    <h4 className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition-colors line-clamp-2">
                      {p.name}
                    </h4>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="py-20 flex justify-center">
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