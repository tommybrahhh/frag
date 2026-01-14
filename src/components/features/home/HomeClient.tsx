'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BlogHero from '@/components/features/blog/BlogHero';
import LatestDrop from '@/components/features/home/LatestDrop';
import CommunityBuzz from '@/components/features/community/CommunityBuzz';
import HorizontalScrollRow from '@/components/ui/HorizontalScrollRow';
import SectionHeader from '@/components/layout/SectionHeader';
import FilterBar from '@/components/features/search/FilterBar';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database';

type BlogPost = Database['public']['Tables']['blog_posts']['Row'];

interface HomeClientProps {
  initialBlogPosts: BlogPost[];
}

interface Perfume {
  id: string;
  name: string;
  slug?: string | null; // <--- ADD THIS LINE
  brand: { name: string };
  image_url: string;
  rating?: number;
  vibe_tags?: string[];
  scent_profile?: Record<string, number>;
}

export default function HomeClient({ initialBlogPosts }: HomeClientProps) {
  const searchParams = useSearchParams();
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

        // Add filters from state
        Object.keys(filters).forEach(key => {
          if (filters[key].length > 0) {
            params.append(key, filters[key].join(','));
          }
        });

        // Add filters from URL (for links from other pages)
        const urlTier = searchParams.get('tier');
        const urlYear = searchParams.get('year');
        const urlFamily = searchParams.get('family');
        const urlVibe = searchParams.get('vibe');
        const urlGender = searchParams.get('gender');

        if (urlTier) params.set('tier', urlTier); // Override or append? Set overrides if key exists.
        if (urlYear) params.append('year', urlYear);
        if (urlFamily) params.append('family', urlFamily);
        if (urlVibe) params.append('vibe', urlVibe);
        if (urlGender && filters.gender.length === 0) params.set('gender', urlGender); // Only use URL gender if state filter is empty

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
  }, [page, filters, searchParams]); // Added searchParams to dependency array

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
    setPerfumes([]); 
    setHasMore(true);
    // Optional: Clear URL params when manual filters change?
    // For now, let's keep it simple.
  };

  const router = useRouter();

  return (
    <main className="min-h-screen bg-white text-stone-800 pb-24">
      <BlogHero posts={initialBlogPosts} />
      
      {/* Hero Split: Latest Drop & Community Buzz */}
      <div className="max-w-[1400px] mx-auto px-6 mb-20 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-full">
          <LatestDrop perfume={newArrivals[0]} />
        </div>
        <div className="lg:col-span-2 h-full">
          <CommunityBuzz />
        </div>
      </div>
      
              <SectionHeader title="Just Arrived" linkText="View All" linkHref="/search?sort=newest" />      <HorizontalScrollRow items={newArrivals.slice(1, 8)} />

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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {perfumes.map((p, index) => {
            const isLast = index === perfumes.length - 1;
            return (
              <div key={`${p.id}-${index}`} ref={isLast ? lastPerfumeElementRef : null}>
                <Link href={`/perfume/${p.slug || p.id}`} className="group block h-full bg-white rounded-2xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-64 flex items-center justify-center mb-4 bg-stone-50 rounded-xl group-hover:bg-white transition-colors relative overflow-hidden">
                    {p.image_url ? (
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="h-full w-full object-contain mix-blend-multiply brightness-[1.05] group-hover:scale-105 transition duration-700 ease-in-out" 
                      />
                    ) : (
                      <div className="text-stone-300 text-xs font-bold uppercase tracking-widest">No Image</div>
                    )}
                    
                    {p.rating && (
                      <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-[10px] font-bold text-stone-900 shadow-sm z-10">
                        ★ {p.rating.toFixed(1)}
                      </div>
                    )}

                    {/* HOVER OVERLAY: Stats (Restored) */}
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-center gap-4 z-20">
                      
                      {/* Main Accords Chart */}
                      {p.scent_profile && (
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">Main Accords</div>
                          <div className="space-y-2">
                            {Object.entries(p.scent_profile)
                              .sort(([,a], [,b]): number => (b as number) - (a as number))
                              .slice(0, 3)
                              .map(([accord, score], i, arr) => {
                                const total = arr.reduce((sum, [,val]) => sum + (val as number), 0);
                                const pct = Math.round(((score as number) / total) * 100);
                                return (
                                  <div key={accord} className="flex items-center gap-2 text-[10px]">
                                    <span className="w-12 font-medium text-stone-600 capitalize truncate">{accord}</span>
                                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-stone-800 rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <span className="text-stone-400 w-6 text-right">{pct}%</span>
                                  </div>
                                );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Vibe Tags */}
                      {p.vibe_tags && p.vibe_tags.length > 0 && (
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">The Vibe</div>
                          <div className="flex flex-wrap gap-1.5">
                            {p.vibe_tags.slice(0, 3).map((tag: string) => (
                              <span key={tag} className="text-[10px] px-2 py-1 bg-stone-100 text-stone-600 rounded border border-stone-200 uppercase tracking-wide">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1 truncate">
                      {p.brand?.name || 'Unknown Brand'}
                    </div>
                    <h4 className="font-serif text-lg text-stone-900 leading-tight truncate px-2 mb-2 group-hover:text-stone-600 transition-colors">
                      {p.name}
                    </h4>
                    
                    {/* Optional: Minimal Vibe Tags */}
                    {p.vibe_tags && p.vibe_tags.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        {p.vibe_tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[9px] uppercase tracking-wider text-stone-500 px-1.5 py-0.5 bg-stone-50 rounded border border-stone-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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