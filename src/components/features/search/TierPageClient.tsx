'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import FilterBar from '@/components/features/search/FilterBar';
import PageTransition from '@/components/layout/PageTransition';
import Spinner from '@/components/ui/Spinner';
import { Search as SearchIcon } from 'lucide-react';
import { getPerfumeImage } from '@/lib/perfume-utils';

interface Perfume {
  id: string;
  name: string;
  slug?: string | null;
  brand: { name: string; tier?: string } | string; 
  image_url: string;
  rating?: number;
  vibe_tags?: string[];
  scent_profile?: Record<string, number>;
}

interface TierPageClientProps {
  tierName: string;
  initialPerfumes: Perfume[];
}

export default function TierPageClient({ tierName, initialPerfumes }: TierPageClientProps) {
  const [perfumes, setPerfumes] = useState<Perfume[]>(initialPerfumes);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPerfumes.length >= 20);
  const [filters, setFilters] = useState<any>({
    price: [], gender: [], longevity: [], season: [], concentration: [], tier: [tierName], moment: [], occasion: [], vibe: []
  });

  const isInitialMount = useRef(true);

  const observer = useRef<IntersectionObserver | null>(null);
  // ... (keep lastPerfumeElementRef as is)
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
  }, [page, filters, tierName]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
    setPerfumes([]); 
    setHasMore(true);
  };

  return (
    <PageTransition>
      <main className="min-h-screen bg-white text-stone-800 pb-24 pt-20">
        <div className="max-w-[1400px] mx-auto px-6 mb-12">
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-8">
                <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
                <span>/</span>
                <Link href="/#tiers" className="hover:text-stone-900 transition-colors">Tiers</Link>
                <span>/</span>
                <span className="text-stone-900">{tierName}</span>
            </nav>

            <div className="mb-12">
                <h1 className="font-serif text-5xl md:text-6xl text-stone-900 mb-4">{tierName} Fragrances</h1>
                <p className="text-stone-500 max-w-2xl text-lg font-light leading-relaxed">
                    Explore our curated selection of {tierName.toLowerCase()} masterpieces. 
                    From iconic houses to hidden gems, find your next signature scent.
                </p>
            </div>
        </div>

        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-y border-stone-100 py-4 mb-12 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all">
            <FilterBar onFilterChange={handleFilterChange} initialFilters={{ tier: [tierName] }} />
        </div>

        <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
                <h3 className="font-serif text-3xl text-stone-900">Collection</h3>
                <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">{perfumes.length} Scents</span>
            </div>
            
            {perfumes.length === 0 && !loading && (
            <div className="text-center py-24 text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <p className="mb-2">We couldn't find a scent that matches those exact filters in the {tierName} category.</p>
                <button onClick={() => window.location.reload()} className="text-stone-900 text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-stone-600">
                Reset Filters
                </button>
            </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {perfumes.map((p, index) => {
                if (!p) return null;
                const isLast = index === perfumes.length - 1;
                const brandName = p.brand && typeof p.brand === 'object' ? p.brand.name : (p.brand || 'Unknown Brand');
                
                return (
                <div key={`${p.id}-${index}`} ref={isLast ? lastPerfumeElementRef : null}>
                    <Link href={`/perfume/${p.slug || p.id}`} className="group block h-full bg-white rounded-2xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="h-64 flex items-center justify-center mb-4 bg-stone-50 rounded-xl group-hover:bg-white transition-colors relative overflow-hidden">
                        {p.image_url ? (
                        <Image src={getPerfumeImage(p.image_url)} alt={p.name} fill className="object-contain mix-blend-multiply brightness-[1.05] group-hover:scale-105 transition duration-700 ease-in-out" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw" />
                        ) : (
                        <div className="text-stone-300 text-xs font-bold uppercase tracking-widest">No Image</div>
                        )}
                        
                        {p.rating && (
                        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-[10px] font-bold text-stone-900 shadow-sm z-10">
                            ★ {p.rating.toFixed(1)}
                        </div>
                        )}

                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-center gap-4 z-20">
                        {p.scent_profile && (
                            <div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">Scent Profile</div>
                            <div className="space-y-2">
                                {Object.entries(p.scent_profile).sort(([,a], [,b]): number => (b as number) - (a as number)).slice(0, 3).map(([accord, score], i, arr) => {
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
                        {p.vibe_tags && p.vibe_tags.length > 0 && (
                            <div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">Vibe Check</div>
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
                        {brandName || 'Unknown Brand'}
                        </div>
                        <h4 className="font-serif text-lg text-stone-900 leading-tight truncate px-2 mb-2 group-hover:text-stone-600 transition-colors">
                        {p.name}
                        </h4>
                    </div>
                    </Link>
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