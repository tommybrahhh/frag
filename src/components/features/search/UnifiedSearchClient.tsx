'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import NoteSearchBar from '@/components/features/search/NoteSearchBar';
import SearchResults from '@/components/features/search/SearchResults';
import ActiveFilters from '@/components/features/search/ActiveFilters';
import FilterBar from '@/components/features/search/FilterBar'; 
import { Note, Perfume } from '@/types';
import { FilterValues } from '@/components/features/search/filterTypes';
import { Search, SlidersHorizontal, X } from 'lucide-react';

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

      setResults(prev => isAppend ? [...prev, ...(data || [])] : (data || []));
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 min-h-screen bg-[#FAFAF9]">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl md:text-6xl font-serif text-stone-900 mb-6 tracking-tight">
          Discovery Engine
        </h1>
        <p className="text-stone-500 max-w-2xl mx-auto text-sm md:text-base font-light italic px-4">
          Uncover your next signature scent by blending notes, brands, and sensory characteristics.
        </p>
      </div>

      {/* MAIN SEARCH BAR */}
      <div className="max-w-3xl mx-auto mb-12 relative z-50">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-14 pr-14 py-5 bg-white border border-stone-200 rounded-[2.5rem] shadow-sm hover:shadow-md focus:shadow-xl focus:ring-0 focus:border-stone-300 transition-all text-stone-900 placeholder:text-stone-300 font-serif text-xl outline-none"
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
      </div>

      {/* FILTERS INTEGRATION */}
      <div className="space-y-6 mb-16">
        
        {/* Note Search & Active Note Chips */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-stone-100 shadow-sm max-w-4xl mx-auto transition-all hover:shadow-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-[1px] w-8 bg-stone-200" />
            <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400 whitespace-nowrap">
              Olfactory Palette
            </label>
            <div className="h-[1px] w-8 bg-stone-200" />
          </div>
          
          <div className="max-w-md mx-auto">
            <NoteSearchBar onNoteSelected={handleNoteSelected} />
          </div>

          <ActiveFilters 
            selectedNotes={selectedNotes} 
            onRemoveNote={handleRemoveNote} 
            onClearAll={handleClearAllNotes} 
          />
          
          {selectedNotes.length === 0 && (
            <p className="text-center text-[11px] text-stone-300 mt-6 italic">
              Try adding 'Vanilla', 'Tobacco', or 'Bergamot' to refine your search.
            </p>
          )}
        </div>

        {/* Sensory & Technical Filters */}
        <div className="relative">
            <FilterBar key={filterKey} onFilterChange={handleFilterChange} />
        </div>
      </div>

      {/* RESULTS SUMMARY & CLEAR ALL */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b border-stone-100 gap-4">
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
                Reset All Filters
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
            <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-stone-200">
                <div className="inline-block p-8 rounded-full bg-stone-50 mb-6">
                    <SlidersHorizontal className="w-12 h-12 text-stone-200" />
                </div>
                <h3 className="font-serif text-2xl text-stone-800 mb-2">No matches found</h3>
                <p className="text-stone-400 text-sm max-w-xs mx-auto italic">
                    Your unique combination of notes and filters yielded no results. Try broadening your criteria.
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
  );
};

export default UnifiedSearchClient;
