'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VibeSelector from '@/components/VibeSelector';
import SearchBar from '@/components/SearchBar';
import { getAllHourRanges } from '@/lib/longevity-utils';

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
  }>({
    price: [],
    gender: [],
    longevity: [],
    season: []
  });

  const filterOptions = {
    price: ['$', '$$', '$$$', '$$$$'],
    gender: ['Male', 'Female', 'Unisex'],
    longevity: getAllHourRanges(),
    season: ['Spring', 'Summer', 'Fall', 'Winter']
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
      season: []
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
          <div className="grid md:grid-cols-4 gap-8">
            
            {/* PRICE GROUP */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Price</h4>
              <div className="flex flex-col gap-2">
                 {filterOptions.price.map((price) => (
                   <button
                     key={price}
                     onClick={() => toggleFilter('price', price)}
                     className={`text-left text-sm ${selectedFilters.price.includes(price) ? 'font-bold text-stone-900 underline decoration-1 underline-offset-4' : 'text-stone-400 hover:text-stone-600 cursor-pointer'}`}
                   >
                     {price}
                   </button>
                 ))}
              </div>
            </div>

            {/* GENDER GROUP */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Gender</h4>
              <div className="flex flex-col gap-2">
                 {filterOptions.gender.map((gender) => (
                   <button
                     key={gender}
                     onClick={() => toggleFilter('gender', gender)}
                     className={`text-left text-sm ${selectedFilters.gender.includes(gender) ? 'font-bold text-stone-900 underline decoration-1 underline-offset-4' : 'text-stone-400 hover:text-stone-600 cursor-pointer'}`}
                   >
                     {gender}
                   </button>
                 ))}
              </div>
            </div>

            {/* LONGEVITY GROUP */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Longevity</h4>
              <div className="flex flex-col gap-2">
                 {filterOptions.longevity.map((longevity) => (
                   <button
                     key={longevity}
                     onClick={() => toggleFilter('longevity', longevity)}
                     className={`text-left text-sm ${selectedFilters.longevity.includes(longevity) ? 'font-bold text-stone-900 underline decoration-1 underline-offset-4' : 'text-stone-400 hover:text-stone-600 cursor-pointer'}`}
                   >
                     {longevity}
                   </button>
                 ))}
              </div>
            </div>

            {/* SEASON GROUP */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Season</h4>
              <div className="flex flex-col gap-2">
                 {filterOptions.season.map((season) => (
                   <button
                     key={season}
                     onClick={() => toggleFilter('season', season)}
                     className={`text-left text-sm ${selectedFilters.season.includes(season) ? 'font-bold text-stone-900 underline decoration-1 underline-offset-4' : 'text-stone-400 hover:text-stone-600 cursor-pointer'}`}
                   >
                     {season}
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
  }>({
    price: [],
    gender: [],
    longevity: [],
    season: []
  });

  // Memoize the filter parameters to prevent useEffect dependency issues
  const filterParams = useMemo(() => {
    return {
      price: filters.price.join(','),
      gender: filters.gender.join(','),
      longevity: filters.longevity.join(','),
      season: filters.season.join(',')
    };
  }, [filters]);
  const router = useRouter();

  useEffect(() => {
    const fetchPerfumes = async () => {
      try {
        const params = new URLSearchParams();
        
        if (filterParams.price) params.append('price', filterParams.price);
        if (filterParams.gender) params.append('gender', filterParams.gender);
        if (filterParams.longevity) params.append('longevity', filterParams.longevity);
        if (filterParams.season) params.append('season', filterParams.season);

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
        
        {/* Tool Cards */}
        <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <Link href="/quiz" className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:bg-stone-50 transition text-center group">
            <h3 className="font-serif text-xl mb-1">Find Your Perfume</h3>
            <p className="text-xs text-stone-400">Discover your perfect scent based on your preferences.</p>
          </Link>
          
          <Link href="/layering" className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:bg-stone-50 transition text-center group">
            <h3 className="font-serif text-xl mb-1">Layering Lab</h3>
            <p className="text-xs text-stone-400">Mix two perfumes to create something unique.</p>
          </Link>

          <Link href="/ingredients/combine" className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:bg-stone-50 transition text-center group">
            <h3 className="font-serif text-xl mb-1">Ingredient Mix</h3>
            <p className="text-xs text-stone-400">Find perfumes with multiple specific notes.</p>
          </Link>

          <Link href="/search/advanced" className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:bg-stone-50 transition text-center group">
            <h3 className="font-serif text-xl mb-1">Note Laboratory</h3>
            <p className="text-xs text-stone-400">Advanced search with include/exclude filters.</p>
          </Link>
        </div>
      </div>

      {/* 4. CURATED ROWS */}
      <div className="max-w-[1400px] mx-auto">
        <PerfumeRow title="Winter Essentials" items={winterPerfumes} router={router} />
        <PerfumeRow title="Date Night Weapons" items={datePerfumes} router={router} />
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