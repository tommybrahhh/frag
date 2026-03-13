'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import NoteSearchBar from '@/components/features/search/NoteSearchBar';
import SearchResults from '@/components/features/search/SearchResults';
import ActiveFilters from '@/components/features/search/ActiveFilters';
import FilterBar from '@/components/features/search/FilterBar'; 
import { Note, Perfume } from '@/types';
import { FilterValues } from '@/components/features/search/filterTypes';
import { Search, SlidersHorizontal, X, Filter } from 'lucide-react';

const UnifiedSearchClient: React.FC = () => {
  const searchParams = useSearchParams();
  
  // --- STATE ---
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [filters, setFilters] = useState<FilterValues>({
    price: [],
    gender: [],
    longevity: [],
    season: [],
    concentration: [],
    tier: [],
    moment: [],
    occasion: [],
    year: []
  });

  const [results, setResults] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filterKey, setFilterKey] = useState(0);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const limit = 12;

  // Refs for debouncing and initial load
  const isInitialMount = useRef(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- FETCH LOGIC ---
  const fetchPerfumes = useCallback(async (page: number, currentQuery: string, currentNotes: Note[], currentFilters: FilterValues, isAppend: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/perfumes', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      
      if (currentQuery) url.searchParams.set('q', currentQuery);
      if (currentNotes.length > 0) {
        url.searchParams.set('noteIds', currentNotes.map(n => n.id).join(','));
      }
      
      // Add other filters
      Object.entries(currentFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
          url.searchParams.set(key, values.join(','));
        }
      });

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Search failed (${response.status})`);
      
      const { data, count } = await response.json();

      setResults(prev => {
        const newData = data || [];
        if (!isAppend) return newData;
        
        // Deduplicate to prevent issues with unstable database sorting or race conditions
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewData = newData.filter((p: any) => !existingIds.has(p.id));
        
        return [...prev, ...uniqueNewData];
      });
      setTotalPages(Math.ceil((count || 0) / limit));
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('❌ Search Error:', err);
      setError(err.message || 'An error occurred while searching.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Handle Search Trigger (Debounced)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchPerfumes(1, query, selectedNotes, filters, false);
    }, isInitialMount.current ? 0 : 500);

    isInitialMount.current = false;
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, selectedNotes, filters, fetchPerfumes]);

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

  // Handle Load More
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPerfumes(nextPage, query, selectedNotes, filters, true);
  };

  // --- HANDLERS ---
  const handleNoteSelected = (note: Note) => {
    if (!selectedNotes.find(n => n.id === note.id)) {
      setSelectedNotes(prev => [...prev, note]);
    }
  };

  const handleRemoveNote = (noteId: string) => {
    setSelectedNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const handleClearAllNotes = () => setSelectedNotes([]);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const clearAllSearch = () => {
    setQuery('');
    setSelectedNotes([]);
    setFilters({
      price: [], gender: [], longevity: [], season: [], concentration: [],
      tier: [], moment: [], occasion: [], year: []
    });
    setFilterKey(prev => prev + 1);
  };

  const hasActiveFilters = query || selectedNotes.length > 0 || Object.values(filters).some(v => v.length > 0);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-screen bg-[#FAFAF9]">
      
      {/* HEADER SECTION */}
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-serif text-stone-900 mb-4 tracking-tight">
          Discovery Engine
        </h1>
        <p className="text-stone-500 max-w-2xl text-sm md:text-base font-light italic">
          Uncover your next signature scent by blending notes, brands, and sensory characteristics.
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
            Filters & Notes
          </button>
          
          <div className="text-xs font-serif text-stone-500">
            {totalCount} Results
          </div>
        </div>

        {/* LEFT SIDEBAR (FILTERS & NOTES) */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-[100] lg:z-auto
          w-full sm:w-80 lg:w-72 xl:w-80 bg-white lg:bg-transparent
          transform transition-transform duration-300 ease-in-out
          ${isMobileFiltersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-full lg:h-auto overflow-hidden lg:overflow-visible
          border-r lg:border-none border-stone-100 shadow-2xl lg:shadow-none
        `}>
          
          {/* Mobile Sidebar Header */}
          <div className="lg:hidden flex items-center justify-between p-6 border-b border-stone-100 bg-white shrink-0">
            <h2 className="font-serif text-xl text-stone-900">Refine Search</h2>
            <div className="flex items-center gap-4">
              {hasActiveFilters ? (
                <button 
                  onClick={clearAllSearch}
                  className="text-[10px] font-bold uppercase tracking-widest text-red-500 underline underline-offset-4"
                >
                  Clear All
                </button>
              ) : (
                <button 
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                >
                  Close
                </button>
              )}
              <button 
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-900 transition-colors bg-stone-50 rounded-full"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto lg:overflow-visible p-6 lg:p-0 overscroll-contain touch-pan-y scroll-smooth">
            <div className="flex flex-col gap-10 pb-20 lg:pb-0">
              {/* Note Explorer */}
              <div className="bg-white lg:bg-transparent rounded-3xl lg:rounded-none">
                <div className="mb-4">
                  <h3 className="font-serif text-xl text-stone-900 mb-2">Olfactory Notes</h3>
                  <p className="text-xs text-stone-400 italic">Search and blend specific ingredients.</p>
                </div>
                
                <NoteSearchBar onNoteSelected={handleNoteSelected} />

                <ActiveFilters 
                  selectedNotes={selectedNotes} 
                  onRemoveNote={handleRemoveNote} 
                  onClearAll={handleClearAllNotes} 
                />
              </div>

              {/* Advanced Filters */}
              <div className="border-t border-stone-200 lg:border-stone-300 pt-10">
                <FilterBar 
                  key={filterKey} 
                  onFilterChange={handleFilterChange} 
                  onClose={() => setIsMobileFiltersOpen(false)}
                />
              </div>
            </div>
          </div>
          
          {/* Mobile Sidebar Footer */}
          <div className="lg:hidden p-6 border-t border-stone-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0 pb-safe">
            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full bg-stone-900 text-white rounded-full py-5 text-sm font-bold uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all"
            >
              {loading ? 'Updating...' : `Show ${totalCount} Results`}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileFiltersOpen && (
          <div 
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[90] lg:hidden transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
            aria-hidden="true"
          />
        )}


        {/* RIGHT MAIN CONTENT */}
        <div className="flex-1 min-w-0 flex flex-col gap-8">
          
          {/* Main Search Bar */}
          <div className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by perfume name or brand..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-14 pr-14 py-4 md:py-5 bg-white border border-stone-200 rounded-[2rem] shadow-sm hover:shadow-md focus:shadow-xl focus:ring-0 focus:border-stone-300 transition-all text-stone-900 placeholder:text-stone-300 font-serif text-lg md:text-xl outline-none"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-6 flex items-center text-stone-300 hover:text-stone-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Results Header */}
          <div className="hidden lg:flex items-center justify-between pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl text-stone-900">
                {loading && currentPage === 1 ? 'Curating...' : `Found ${totalCount} Scents`}
              </h2>
              {loading && <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin" />}
            </div>
            
            {hasActiveFilters && (
              <button 
                onClick={clearAllSearch}
                className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-red-500 transition-all"
              >
                <X className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                Clear All Criteria
              </button>
            )}
          </div>

          {/* RESULTS GRID */}
          <div className="min-h-[600px] relative">
            {error ? (
              <div className="text-center py-20 bg-red-50 rounded-[2rem] border border-red-100">
                  <p className="text-red-800 font-serif mb-4">Something went wrong while searching.</p>
                  <button onClick={() => fetchPerfumes(1, query, selectedNotes, filters)} className="px-6 py-2 bg-red-800 text-white rounded-full text-xs font-bold uppercase tracking-widest">Retry</button>
              </div>
            ) : (
              <SearchResults
                loading={loading}
                error={null}
                results={results}
                currentPage={currentPage}
                totalPages={totalPages}
                onLoadMore={handleLoadMore}
              />
            )}

            {/* Empty State */}
            {!loading && results.length === 0 && (
              <div className="text-center py-32 bg-white rounded-[2rem] border border-dashed border-stone-200 mt-4">
                  <div className="inline-block p-8 rounded-full bg-stone-50 mb-6">
                      <SlidersHorizontal className="w-12 h-12 text-stone-200" />
                  </div>
                  <h3 className="font-serif text-2xl text-stone-800 mb-2">No matches found</h3>
                  <p className="text-stone-400 text-sm max-w-xs mx-auto italic">
                      Your unique combination of criteria yielded no results.
                  </p>
                  <button 
                      onClick={clearAllSearch}
                      className="mt-8 text-stone-900 font-bold border-b-2 border-stone-900 pb-1 hover:opacity-60 transition-opacity text-[10px] uppercase tracking-[0.2em]"
                  >
                      Start Fresh
                  </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSearchClient;
