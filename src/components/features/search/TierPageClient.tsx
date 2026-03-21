'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import FilterBar from '@/components/features/search/FilterBar';
import PageTransition from '@/components/layout/PageTransition';
import FragranceCard from '@/components/features/perfume/FragranceCard';
import { Search as SearchIcon, Filter, X, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { Perfume } from '@/types';

interface TierPageClientProps {
  tierName: string;
  initialPerfumes: Perfume[];
}

export default function TierPageClient({ tierName, initialPerfumes }: TierPageClientProps) {
  const [perfumes, setPerfumes] = useState<Perfume[]>(initialPerfumes);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPerfumes.length >= 20);
  const [totalCount, setTotalCount] = useState(initialPerfumes.length);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<any>({
    price: [], gender: [], longevity: [], season: [], concentration: [], tier: [tierName], moment: [], occasion: [], vibe: [], year: [], brand: [], family: []
  });

  // Prevent scroll when mobile filters open
  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileFiltersOpen]);

  const isInitialMount = useRef(true);

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

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    const fetchPerfumes = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '20'); 

        Object.keys(filters).forEach(key => {
          if (filters[key] && filters[key].length > 0) {
            params.append(key, filters[key].join(','));
          }
        });

        const res = await fetch(`/api/perfumes?${params.toString()}`);
        const { data, count } = await res.json();
        
        if (data) {
          setPerfumes(prev => {
            if (page === 1) return data;
            
            // Deduplicate
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewData = data.filter((p: any) => !existingIds.has(p.id));
            return [...prev, ...uniqueNewData];
          });
          setHasMore((page * 20) < (count || 0));
          setTotalCount(count || 0);
        }
      } catch (err) {
        console.error('Failed to fetch collection', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfumes();
  }, [page, filters, tierName]);

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...newFilters, tier: [tierName] });
    setPage(1);
    setPerfumes([]); 
    setHasMore(true);
  };

  return (
    <PageTransition>
      <main className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-24 pt-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-8">
                <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
                <span>/</span>
                <Link href="/#discovery" className="hover:text-stone-900 transition-colors">Discovery</Link>
                <span>/</span>
                <span className="text-stone-900">{tierName}</span>
            </nav>

            <div className="mb-12">
                <h1 className="font-serif text-5xl md:text-7xl text-stone-900 mb-4">{tierName} Houses</h1>
                <p className="text-stone-500 max-w-2xl text-lg font-light leading-relaxed italic">
                    Explore our curated selection of {tierName.toLowerCase()} masterpieces. 
                    From iconic legacies to avant-garde creations.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                
                {/* MOBILE FILTER TOGGLE */}
                <div className="lg:hidden flex items-center justify-between mb-4">
                  <button
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm"
                  >
                    <Filter size={16} />
                    Filters
                  </button>
                  <div className="text-xs font-serif text-stone-500">
                    {totalCount} Results
                  </div>
                </div>

                {/* SIDEBAR FILTERS */}
                <aside className={`
                  fixed lg:static inset-y-0 left-0 z-[100] lg:z-auto
                  w-full sm:w-80 lg:w-72 xl:w-80 bg-white lg:bg-transparent
                  transform transition-transform duration-300 ease-in-out
                  ${isMobileFiltersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                  flex flex-col h-full lg:h-auto overflow-hidden lg:overflow-visible
                  border-r lg:border-none border-stone-100 shadow-2xl lg:shadow-none
                `}>
                  <div className="lg:hidden flex items-center justify-between p-6 border-b border-stone-100 bg-white shrink-0">
                    <h2 className="font-serif text-xl text-stone-900">Filters</h2>
                    <button 
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="p-2 text-stone-400 hover:text-stone-900 transition-colors bg-stone-50 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto lg:overflow-visible p-6 lg:p-0 hide-scrollbar">
                    <FilterBar 
                      onFilterChange={handleFilterChange} 
                      initialFilters={{ tier: [tierName] }} 
                      onClose={() => setIsMobileFiltersOpen(false)}
                    />
                  </div>

                  <div className="lg:hidden p-6 border-t border-stone-100 bg-white shrink-0">
                    <button
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="w-full bg-stone-900 text-white rounded-full py-4 text-xs font-bold uppercase tracking-widest"
                    >
                      Show Results
                    </button>
                  </div>
                </aside>

                {/* MAIN CONTENT */}
                <div className="flex-1 min-w-0">
                    <div className="hidden lg:flex items-center justify-between mb-8 pb-4 border-b border-stone-100">
                        <h3 className="font-serif text-3xl text-stone-900">Collection</h3>
                        <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">{totalCount} Scents Found</span>
                    </div>
                    
                    {perfumes.length === 0 && !loading && (
                      <div className="text-center py-32 bg-white rounded-[2rem] border border-dashed border-stone-200 mt-4">
                          <div className="inline-block p-8 rounded-full bg-stone-50 mb-6">
                              <SlidersHorizontal className="w-12 h-12 text-stone-200" />
                          </div>
                          <h3 className="font-serif text-2xl text-stone-800 mb-2">No matches found</h3>
                          <p className="text-stone-400 text-sm max-w-xs mx-auto italic">
                              Try adjusting your filters to find more scents in the {tierName} category.
                          </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {perfumes.map((p, index) => {
                        if (!p) return null;
                        const isLast = index === perfumes.length - 1;
                        
                        return (
                          <FragranceCard 
                            key={p.id} 
                            perfume={p} 
                            ref={isLast ? lastPerfumeElementRef : null} 
                          />
                        );
                    })}
                    </div>

                    {(loading || (perfumes.length > 0 && hasMore)) && (
                    <div className="py-24 flex justify-center">
                        <div className="flex gap-2">
                        <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
      </main>
    </PageTransition>
  );
}
