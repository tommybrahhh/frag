'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VibeSelector from '@/components/VibeSelector';
import SearchBar from '@/components/SearchBar';
import { getAllHourRanges } from '@/lib/longevity-utils';
import { useAuth } from '@/context/AuthContext';

// Helper for horizontal rows
const PerfumeRow = ({ title, items, router }: { title: string, items: any[], router: any }) => (
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
             {/* Clickable Brand Name */}
             <button
               onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 router.push(`/brands/${encodeURIComponent(p.brand?.name || '')}`);
               }}
               className="text-[9px] font-bold tracking-widest text-stone-400 uppercase truncate mb-1 hover:text-stone-900 hover:underline relative z-10"
             >
               {p.brand?.name}
             </button>
             <div className="font-serif text-md text-stone-900 leading-tight group-hover:text-stone-600 transition truncate">
               {p.name}
             </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

// Filter Panel Component
const FilterPanel = ({ onFilterChange }: { onFilterChange: (filters: any) => void }) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    price: string[];
    gender: string[];
    longevity: string[];
    season: string[];
    concentration: string[];
    tier: string[];
    moment: string[];
    occasion: string[];
  }>({
    price: [],
    gender: [],
    longevity: [],
    season: [],
    concentration: [],
    tier: [],
    moment: [],
    occasion: []
  });

  const filterOptions = {
    price: ['$', '$$', '$$$', '$$$$'],
    gender: ['Male', 'Female', 'Unisex'],
    longevity: getAllHourRanges(),
    season: ['Spring', 'Summer', 'Fall', 'Winter'],
    concentration: ['EDT', 'EDP', 'Parfum', 'Extrait'],
    tier: ['Designer', 'Niche'],
    moment: ['Day', 'Night'],
    occasion: ['Date', 'Office', 'Party', 'Daily']
  };

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    const newFilters = { ...selectedFilters };
    
    if (newFilters[category].includes(value)) {
      newFilters[category] = newFilters[category].filter(v => v !== value);
    } else {
      newFilters[category] = [...newFilters[category], value];
    }

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      price: [],
      gender: [],
      longevity: [],
      season: [],
      concentration: [],
      tier: [],
      moment: [],
      occasion: []
    };
    setSelectedFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <>
      {/* FILTER TOGGLE */}
      <div className="flex justify-end mb-4 max-w-[1400px] mx-auto px-6">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition flex items-center gap-2"
        >
          <span>Refine Collection</span>
          <span>{isFiltersOpen ? '−' : '+'}</span>
        </button>
      </div>

      {/* COLLAPSIBLE FILTER PANEL */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isFiltersOpen ? 'max-h-[500px] opacity-100 mb-12' : 'max-h-0 opacity-0'}`}>
        <div className="bg-stone-50 rounded-2xl p-8 max-w-[1400px] mx-auto mx-6 border border-stone-100">
          {/* The 2x4 Grid Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
            
            {/* --- ROW 1: IDENTITY --- */}
            
            {/* 1. Price */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Price Point</h4>
              <div className="flex flex-col gap-2">
                {['$', '$$', '$$$', '$$$$'].map((p) => (
                  <button key={p} onClick={() => toggleFilter('price', p)} className={`text-left text-sm transition-colors ${selectedFilters.price.includes(p) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Gender */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Gender</h4>
              <div className="flex flex-col gap-2">
                {['Male', 'Female', 'Unisex'].map((g) => (
                  <button key={g} onClick={() => toggleFilter('gender', g)} className={`text-left text-sm transition-colors ${selectedFilters.gender.includes(g) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Concentration (New) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Intensity</h4>
              <div className="flex flex-col gap-2">
                {['EDT', 'EDP', 'Parfum', 'Extrait'].map((c) => (
                  <button key={c} onClick={() => toggleFilter('concentration', c)} className={`text-left text-sm transition-colors ${selectedFilters.concentration.includes(c) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Market Tier (New) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Market</h4>
              <div className="flex flex-col gap-2">
                {['Designer', 'Niche', 'Indie'].map((t) => (
                  <button key={t} onClick={() => toggleFilter('tier', t)} className={`text-left text-sm transition-colors ${selectedFilters.tier.includes(t) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* --- ROW 2: CONTEXT --- */}
            
            {/* 5. Longevity */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Longevity</h4>
              <div className="flex flex-col gap-2">
                {['1-2 hours', '3-4 hours', '5-6 hours', '7-8 hours', '8+ hours'].map((l) => (
                  <button key={l} onClick={() => toggleFilter('longevity', l)} className={`text-left text-sm transition-colors ${selectedFilters.longevity.includes(l) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Season */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Season</h4>
              <div className="flex flex-col gap-2">
                {['Spring', 'Summer', 'Fall', 'Winter'].map((s) => (
                  <button key={s} onClick={() => toggleFilter('season', s)} className={`text-left text-sm transition-colors ${selectedFilters.season.includes(s) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Moment (New) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Time of Day</h4>
              <div className="flex flex-col gap-2">
                {['Day', 'Night', 'All Day'].map((m) => (
                  <button key={m} onClick={() => toggleFilter('moment', m)} className={`text-left text-sm transition-colors ${selectedFilters.moment.includes(m) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Occasion (New) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Occasion</h4>
              <div className="flex flex-col gap-2">
                {['Office', 'Date', 'Party', 'Daily'].map((o) => (
                  <button key={o} onClick={() => toggleFilter('occasion', o)} className={`text-left text-sm transition-colors ${selectedFilters.occasion.includes(o) ? 'font-bold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

          </div>
          
          {/* CLEAR FILTERS BUTTON */}
          <div className="flex justify-end mt-8 pt-4 border-t border-stone-100">
            <button
              onClick={clearFilters}
              className="text-xs font-bold tracking-widest text-stone-400 uppercase hover:text-stone-900 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </>
  );
};


export default function Home() {
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [filteredPerfumes, setFilteredPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState('All');
  const [filters, setFilters] = useState<{
    price: string[];
    gender: string[];
    longevity: string[];
    season: string[];
    concentration: string[];
    tier: string[];
    moment: string[];
    occasion: string[];
  }>({
    price: [],
    gender: [],
    longevity: [],
    season: [],
    concentration: [],
    tier: [],
    moment: [],
    occasion: []
  });

  // Memoize the filter parameters to prevent useEffect dependency issues
  const filterParams = useMemo(() => {
    return {
      price: filters.price.join(','),
      gender: filters.gender.join(','),
      longevity: filters.longevity.join(','),
      season: filters.season.join(','),
      concentration: filters.concentration.join(','),
      tier: filters.tier.join(','),
      moment: filters.moment.join(','),
      occasion: filters.occasion.join(',')
    };
  }, [filters]);
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const fetchPerfumes = async () => {
      try {
        const params = new URLSearchParams();
        
        if (filterParams.price) params.append('price', filterParams.price);
        if (filterParams.gender) params.append('gender', filterParams.gender);
        if (filterParams.longevity) params.append('longevity', filterParams.longevity);
        if (filterParams.season) params.append('season', filterParams.season);
        if (filterParams.concentration) params.append('concentration', filterParams.concentration);
        if (filterParams.tier) params.append('tier', filterParams.tier);
        if (filterParams.moment) params.append('moment', filterParams.moment);
        if (filterParams.occasion) params.append('occasion', filterParams.occasion);

        const url = params.toString() ? `/api/perfumes?${params}` : '/api/perfumes';
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setPerfumes(data);
      } catch (err) {
        console.error('Failed to fetch perfumes:', err);
        // Set empty array instead of leaving it undefined
        setPerfumes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPerfumes();
  }, [filterParams]);

  // Filter Logic (now handled by API, but we still need client-side filtering for vibe and special collections)
  const winterPerfumes = perfumes.filter(p => p.best_season?.includes('Winter'));
  const datePerfumes = perfumes.filter(p => p.occasions?.includes('Date') || p.occasions?.includes('Date Night'));
  const filteredGrid = selectedVibe === 'All'
    ? perfumes
    : perfumes.filter(p => p.vibe_tags?.includes(selectedVibe));

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center text-stone-400 uppercase tracking-widest">Loading Collection...</div>;

  return (
    <main className="min-h-screen bg-white text-stone-800 font-sans selection:bg-stone-900 selection:text-white pb-24">
      
      {/* Authentication Header */}
      <div className="absolute top-6 right-6 z-50">
        {user ? (
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900">
              My Shelf
            </Link>
            <button onClick={signOut} className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-red-500">
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition shadow-lg"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* 1. CENTERED HEADER SECTION */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-serif font-medium text-stone-900 mb-8 leading-tight">
          Perfume Intuition
        </h1>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12">
          <SearchBar />
        </div>

        {/* New Premium Filter Panel */}
        <FilterPanel onFilterChange={(filters) => setFilters(filters)} />
        
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
                 {/* Clickable Brand Name */}
                 <button
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     router.push(`/brands/${encodeURIComponent(p.brand?.name || '')}`);
                   }}
                   className="text-[9px] font-bold tracking-widest text-stone-400 uppercase truncate mb-1 hover:text-stone-900 hover:underline relative z-10"
                 >
                   {p.brand?.name}
                 </button>
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