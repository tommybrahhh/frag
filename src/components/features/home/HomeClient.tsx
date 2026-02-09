'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CommunityHero from '@/components/features/home/CommunityHero';
import TrendingScents from '@/components/features/home/TrendingScents';
import FilterBar from '@/components/features/search/FilterBar';
import VisualCategoryNav from '@/components/features/search/VisualCategoryNav'; 
import PageTransition from '@/components/layout/PageTransition';
import { ActivityItem, CommunityStats } from '@/lib/services/communityService';
import JoinCommunityCTA from '@/components/features/home/JoinCommunityCTA';
import DailyBattle from '@/components/features/home/DailyBattle';
import Spinner from '@/components/ui/Spinner';
import { Search as SearchIcon, ArrowDown } from 'lucide-react';

import TierNav from '@/components/features/search/TierNav';

interface Perfume {
  id: string;
  name: string;
  slug?: string | null;
  brand: { name: string } | string; 
  image_url: string;
  rating?: number;
  vibe_tags?: string[];
  scent_profile?: Record<string, number>;
}

interface HomeClientProps {
  initialActivity?: ActivityItem[];
  trendingPerfumes?: any[];
  initialPerfumes?: Perfume[];
  dailyBattle?: any;
  communityStats?: CommunityStats;
}

export default function HomeClient({ 
  initialActivity = [], 
  trendingPerfumes = [],
  initialPerfumes = [],
  dailyBattle,
  communityStats
}: HomeClientProps) {
  const searchParams = useSearchParams();
  const [perfumes, setPerfumes] = useState<Perfume[]>(initialPerfumes);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeTier, setActiveTier] = useState<string>('');
  const [filters, setFilters] = useState<any>({
    price: [], gender: [], longevity: [], season: [], concentration: [], tier: [], moment: [], occasion: [], vibe: []
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

  const [showLibrary, setShowLibrary] = useState(false);
  const libraryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInitialMount.current && searchParams.toString().length > 0) {
       setShowLibrary(true);
       setTimeout(() => {
          libraryRef.current?.scrollIntoView({ behavior: 'smooth' });
       }, 500);
    }

    const hasSearchParams = searchParams.toString().length > 0;
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialPerfumes.length > 0 && !hasSearchParams) {
        return; 
      }
    }

    const fetchPerfumes = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '24'); 

        Object.keys(filters).forEach(key => {
          if (filters[key] && filters[key].length > 0) {
            params.append(key, filters[key].join(','));
          }
        });

        const urlTier = searchParams.get('tier');
        const urlYear = searchParams.get('year');
        const urlFamily = searchParams.get('family');
        const urlVibe = searchParams.get('vibe');
        const urlGender = searchParams.get('gender');

        if (urlTier && (!filters.tier || filters.tier.length === 0)) params.set('tier', urlTier);
        if (urlYear) params.append('year', urlYear);
        if (urlFamily) params.append('family', urlFamily);
        if (urlVibe && filters.vibe.length === 0) params.append('vibe', urlVibe);
        if (urlGender && filters.gender.length === 0) params.set('gender', urlGender);

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
  }, [page, filters, searchParams]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
    setPerfumes([]); 
    setHasMore(true);
  };

  const handleCategorySelect = (slug: string) => {
    setActiveCategory(slug);
    if (slug === '') {
       setFilters((prev: any) => ({ ...prev, vibe: [] }));
    } else {
       setFilters((prev: any) => ({ ...prev, vibe: [slug] }));
    }
    setPage(1);
    setPerfumes([]);
    setHasMore(true);
    
    // Auto-reveal library when category is selected
    if (!showLibrary) {
      setShowLibrary(true);
      setTimeout(() => {
        libraryRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleTierSelect = (tier: string) => {
    const newTier = activeTier === tier ? '' : tier;
    setActiveTier(newTier);
    
    if (newTier === '') {
        setFilters((prev: any) => ({ ...prev, tier: [] }));
    } else {
        setFilters((prev: any) => ({ ...prev, tier: [newTier] }));
    }
    
    setPage(1);
    setPerfumes([]);
    setHasMore(true);

    if (!showLibrary) {
      setShowLibrary(true);
      setTimeout(() => {
        libraryRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleShowLibrary = () => {
    setShowLibrary(true);
    setTimeout(() => {
      libraryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <PageTransition>
      <main className="min-h-screen bg-white text-stone-800 pb-24">
        <CommunityHero activity={initialActivity} stats={communityStats} />
        
        <TrendingScents perfumes={trendingPerfumes} />

        <DailyBattle battle={dailyBattle} />

        <TierNav onSelectTier={handleTierSelect} activeTier={activeTier} />

        <VisualCategoryNav onSelectCategory={handleCategorySelect} activeCategory={activeCategory} />

        {!showLibrary ? (
          <div className="py-16 text-center">
             <button 
                onClick={handleShowLibrary}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-stone-800 transition-all hover:scale-105 active:scale-95 shadow-xl"
             >
                <SearchIcon className="w-4 h-4" />
                <span>Open Fragrance Library</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
             </button>
             <p className="mt-4 text-stone-400 text-sm font-light">
                Browse {perfumes.length > 0 ? perfumes.length + '+' : ''} perfumes by notes, brands, and vibes.
             </p>
          </div>
        ) : (
          <div ref={libraryRef} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-y border-stone-100 py-4 mb-12 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all">
               <FilterBar onFilterChange={handleFilterChange} />
            </div>

            <div className="max-w-[1400px] mx-auto px-6">
              <div className="flex items-end justify-between mb-8">
                 <h3 className="font-serif text-3xl text-stone-900">Explore the Library</h3>
                 <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">{perfumes.length} Scents</span>
              </div>
              
              {perfumes.length === 0 && !loading && (
                <div className="text-center py-24 text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <p className="mb-2">We couldn't find a scent that matches those exact filters.</p>
                  <button onClick={() => window.location.reload()} className="text-stone-900 text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-stone-600">
                    Reset & Explore All
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {perfumes.map((p, index) => {
                  const isLast = index === perfumes.length - 1;
                  const brandName = typeof p.brand === 'object' ? p.brand.name : p.brand;
                  
                  return (
                    <div key={`${p.id}-${index}`} ref={isLast ? lastPerfumeElementRef : null}>
                      <Link href={`/perfume/${p.slug || p.id}`} className="group block h-full bg-white rounded-2xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="h-64 flex items-center justify-center mb-4 bg-stone-50 rounded-xl group-hover:bg-white transition-colors relative overflow-hidden">
                          {p.image_url ? (
                            <Image src={p.image_url} alt={p.name} fill className="object-contain mix-blend-multiply brightness-[1.05] group-hover:scale-105 transition duration-700 ease-in-out" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw" />
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
          </div>
        )}
        
        <JoinCommunityCTA />
      </main>
    </PageTransition>
  );
}