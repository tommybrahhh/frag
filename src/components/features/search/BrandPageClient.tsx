'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import FilterBar from '@/components/features/search/FilterBar';
import PageTransition from '@/components/layout/PageTransition';
import FragranceCard from '@/components/features/perfume/FragranceCard';
import { Perfume } from '@/types';

interface BrandPageClientProps {
  brand: string;
  initialPerfumes: any[];
  tier?: string;
  website_url?: string;
  brand_color?: string;
}

export default function BrandPageClient({ 
  brand, 
  initialPerfumes, 
  tier, 
  website_url, 
  brand_color 
}: BrandPageClientProps) {
  const [perfumes, setPerfumes] = useState<any[]>(initialPerfumes);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPerfumes.length >= 20);
  const [filters, setFilters] = useState<any>({
    price: [], gender: [], longevity: [], season: [], concentration: [], tier: [], moment: [], occasion: [], vibe: [], year: [], brand: [brand]
  });

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
          setPerfumes(prev => page === 1 ? data : [...prev, ...data]);
          setHasMore(perfumes.length + data.length < (count || 0));
        }
      } catch (err) {
        console.error('Failed to fetch collection', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfumes();
  }, [page, filters, brand]);

  const handleFilterChange = (newFilters: any) => {
    // Ensure brand filter stays locked to this brand
    const brandLockedFilters = { ...newFilters, brand: [brand] };
    setFilters(brandLockedFilters);
    setPage(1);
    setPerfumes([]); 
    setHasMore(true);
  };

  return (
    <PageTransition>
      <main className="min-h-screen bg-white text-stone-800 pb-24 pt-20">
        <div className="max-w-[1400px] mx-auto px-6 mb-12">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-8">
                <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
                <span>/</span>
                <span className="text-stone-900">{brand}</span>
            </nav>

            <div className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                    <div 
                      className="w-14 h-14 rounded-full text-white flex items-center justify-center font-serif text-2xl shadow-sm"
                      style={{ backgroundColor: brand_color || '#1c1917' }}
                    >
                        {brand.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-1">
                      {tier && (
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                          {tier} House
                        </span>
                      )}
                      {website_url && (
                        <a 
                          href={website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-1"
                        >
                          Official Website
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      )}
                    </div>
                    <div className="h-px flex-1 bg-stone-100" />
                </div>
                <h1 className="font-serif text-5xl md:text-7xl text-stone-900 mb-4">{brand}</h1>
                <p className="text-stone-500 max-w-2xl text-lg font-light leading-relaxed">
                    Explore the unique olfactory signature of {brand}. 
                    From iconic masterpieces to contemporary creations, find your next signature scent within this curated collection.
                </p>
            </div>
        </div>

        {/* Filter Section - Sticky for better UX */}
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-y border-stone-100 py-4 mb-12 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all">
            <FilterBar onFilterChange={handleFilterChange} initialFilters={{ brand: [brand] }} />
        </div>

        <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex items-end justify-between mb-8 border-b border-stone-100 pb-6">
                <h3 className="font-serif text-3xl text-stone-900">Collection</h3>
                <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">{perfumes.length} Scents</span>
            </div>
            
            {perfumes.length === 0 && !loading && (
              <div className="text-center py-24 text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <p className="mb-2">We couldn't find a scent that matches those exact filters from {brand}.</p>
                <button onClick={() => window.location.reload()} className="text-stone-900 text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-stone-600">
                Reset Filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {perfumes.map((p, index) => {
                if (!p) return null;
                const isLast = index === perfumes.length - 1;
                return (
                  <div key={`${p.id}-${index}`} ref={isLast ? lastPerfumeElementRef : null}>
                    <FragranceCard
                      perfume={{
                        ...p,
                        brand: p.brand && typeof p.brand === 'object' ? p.brand.name : (p.brand || brand),
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {(loading || (perfumes.length > 0 && hasMore)) && (
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
    </PageTransition>
  );
}
