'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Added imports
import NoteSearchBar from '@/components/features/search/NoteSearchBar';
import SearchResults from '@/components/features/search/SearchResults';
import ActiveFilters from '@/components/features/search/ActiveFilters';
import { Note, Perfume } from '@/types';


const UnifiedSearchClient: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSort = searchParams.get('sort');
  const initialQuery = searchParams.get('q');
  const initialVibe = searchParams.get('vibe');
  const initialTier = searchParams.get('tier');

  const [searchMode, setSearchMode] = useState<'notes' | 'general' | 'newest' | 'filter'>(
    initialSort === 'newest' ? 'newest' : 
    (initialQuery ? 'general' : 
    (initialVibe || initialTier ? 'filter' : 'notes'))
  );

  // State for Filters (for notes search)
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  
  // State for General Search Query
  const [generalSearchQuery, setGeneralSearchQuery] = useState<string>(initialQuery || '');

  // State for Results
  const [results, setResults] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 12;

  // Effect to handle initial load or URL changes
  useEffect(() => {
    // Sync state with URL parameters
    const newMode = initialSort === 'newest' ? 'newest' : 
                   (initialQuery ? 'general' : 
                   (initialVibe || initialTier ? 'filter' : 'notes'));
    
    setSearchMode(newMode);
    if (initialQuery !== null) {
      setGeneralSearchQuery(initialQuery);
    }

    // Reset pagination and results when search mode or parameters change
    setCurrentPage(1);
    setResults([]);
  }, [initialSort, initialQuery, initialVibe, initialTier]);

  // Effect for fetching perfumes when in 'newest', 'general', or 'filter' mode
  useEffect(() => {
    const fetchPerfumes = async () => {
      if (searchMode === 'notes') return;

      setLoading(true);
      setError(null);

      try {
        // Construct URL for the API route
        const url = new URL('/api/perfumes', window.location.origin);
        url.searchParams.set('page', currentPage.toString());
        url.searchParams.set('limit', limit.toString());
        
        // Pass all current search params to the API
        searchParams.forEach((value, key) => {
          url.searchParams.set(key, value);
        });

        const response = await fetch(url.toString());
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        const { data, count } = await response.json();

        setResults(prevResults => {
          const newData = data || [];
          if (currentPage === 1) return newData;
          
          // Deduplicate by ID
          const combined = [...prevResults, ...newData];
          return combined.filter((perfume, index, self) => 
            index === self.findIndex((p) => p.id === perfume.id)
          );
        });
        setTotalPages(Math.ceil((count || 0) / limit));

      } catch (err: any) {
        console.error('❌ Detailed Perfumes Fetch Error:', err);
        setError(err.message || 'An error occurred while fetching perfumes.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerfumes();
  }, [searchMode, currentPage, limit, generalSearchQuery, searchParams]); // Added searchParams as dependency

  // Search Logic (for notes search mode)
  useEffect(() => {
    if (searchMode !== 'notes') return; // Only run if in 'notes' mode

    // Debounce search to avoid rapid API calls
    const searchTimeout = setTimeout(() => {
      const handleSearch = async () => {
        if (selectedNotes.length === 0) {
          setResults([]);
          setTotalPages(0);
          return;
        }

        setLoading(true);
        setError(null);

        // Debug Payload
        const payload = { 
          noteIds: selectedNotes.map(n => n.id),
          page: currentPage,
          limit: limit
        };
        console.log('🔍 Debug: Sending Note Search Payload:', payload);

        try {
          const response = await fetch('/api/perfumes/by-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          
          if (response.ok) {
            const resJson = await response.json();
            const newData = resJson.data || [];
            
            setResults(prevResults => {
              if (currentPage === 1) return newData;
              const combined = [...prevResults, ...newData];
              return combined.filter((perfume, index, self) => 
                index === self.findIndex((p) => p.id === perfume.id)
              );
            });
            setTotalPages(Math.ceil(resJson.count / limit));
          } else {
            // --- NEW DEBUG LOGIC ---
            const errorText = await response.text(); // Get raw text in case JSON parse fails
            console.error('❌ API Error Response:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            });
            throw new Error(`Server Error (${response.status}): ${errorText.substring(0, 100)}`);
          }
        } catch (err: any) {
          console.error('❌ Detailed Search Error:', err);
          setError(err.message || 'An error occurred while searching.');
        } finally {
          setLoading(false);
        }
      };

      handleSearch();
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [selectedNotes, currentPage, searchMode]);

  // Handlers
  const handleNoteSelected = (note: Note) => {
    if (!selectedNotes.find(selected => selected.id === note.id)) {
      setSelectedNotes([...selectedNotes, note]);
      setCurrentPage(1);
    }
  };

  const handleRemoveNote = (noteId: string) => {
    setSelectedNotes(selectedNotes.filter(note => note.id !== noteId));
    setCurrentPage(1);
  };

  const handleClearAllNotes = () => {
    setSelectedNotes([]);
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const getPageTitle = () => {
    if (searchMode === 'newest') return 'Latest Fragrances';
    if (searchMode === 'general') return `Search Results for "${generalSearchQuery}"`;
    if (searchMode === 'filter') {
      const vibe = searchParams.get('vibe');
      const tier = searchParams.get('tier');
      if (vibe) return `${vibe.charAt(0).toUpperCase() + vibe.slice(1)} Fragrances`;
      if (tier) return `${tier.charAt(0).toUpperCase() + tier.slice(1)} Collection`;
      return 'Discovery';
    }
    return 'Fragrance Finder';
  };

  const getPageSubtitle = () => {
    if (searchMode === 'newest') return 'Discover the newest additions to our library.';
    if (searchMode === 'general') return 'Explore perfumes matching your search.';
    if (searchMode === 'filter') return 'Curated selection based on your preference.';
    return 'Search by the notes you love (or hate) to find your perfect match.';
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 md:py-12 min-h-screen bg-[#FAFAF9]">
            {searchMode !== 'notes' ? (
              <>
                <div className="mb-8 md:mb-12 text-center">
                  <h1 className="text-3xl md:text-5xl font-serif text-stone-900 mb-2 md:mb-4 capitalize">
                    {getPageTitle()}
                  </h1>
                  <p className="text-xs md:text-sm text-stone-500 max-w-lg mx-auto italic px-4">
                    {getPageSubtitle()}
                  </p>
                </div>
                <SearchResults
                  loading={loading}
                  error={error}
                  results={results}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onLoadMore={handleLoadMore}
                />
              </>
            ) : (
              <>
                <div className="mb-8 md:mb-12 text-center">
                  <h1 className="text-3xl md:text-5xl font-serif text-stone-900 mb-2 md:mb-4">Fragrance Finder</h1>
                  <p className="text-xs md:text-sm text-stone-500 max-w-lg mx-auto italic px-4">
                    Search by the notes you love (or hate) to find your perfect match.
                  </p>
                </div>
      
                <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 p-6 md:p-8 mb-8 md:mb-10 max-w-2xl mx-auto">
                  <div className="w-full">
                    <label className="block text-[9px] md:text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 text-center">
                      What does it smell like?
                    </label>
                    <NoteSearchBar onNoteSelected={handleNoteSelected} />
                  </div>
      
                  {/* Selected Notes Display - Modern Chips */}
                  <ActiveFilters 
                    selectedNotes={selectedNotes} 
                    onRemoveNote={handleRemoveNote} 
                    onClearAll={handleClearAllNotes} 
                  />
                </div>
      
                {/* Results Section for Note Search */}
                <div className="min-h-[400px]">
                  {!loading && results.length === 0 && selectedNotes.length > 0 ? (
                       <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-200">
                          <p className="text-stone-400 mb-4">No perfumes found with this specific combination of notes.</p>
                          <button 
                            onClick={handleClearAllNotes}
                            className="text-stone-900 font-bold border-b-2 border-stone-900 pb-0.5 hover:opacity-70 text-sm uppercase tracking-widest"
                          >
                            Start Over
                          </button>
                       </div>
                  ) : selectedNotes.length === 0 ? (
                      <div className="text-center py-20">
                          <div className="inline-block p-6 rounded-full bg-stone-50 mb-4">
                              <svg className="w-12 h-12 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.283a2 2 0 01-1.186.127l-2.903-.581a2 2 0 00-2.136 1.847l-.145 1.45a2 2 0 01-1.393 1.706l-1.096.365a2 2 0 01-1.782-.23L4 18.232m12.428-2.804l2.804-2.804a2 2 0 00.586-1.414V5.572a2 2 0 00-.586-1.414L16.428 1.354A2 2 0 0015.014.768H8.986a2 2 0 00-1.414.586L4.768 4.158A2 2 0 004.182 5.572v7.442a2 2 0 00.586 1.414l2.804 2.804m8.442 0L13 20.354A2 2 0 0111.586 21H5.414A2 2 0 014 19.586v-1.172a2 2 0 01.586-1.414l2.804-2.804" />
                              </svg>
                          </div>
                          <h3 className="text-stone-400 font-serif text-xl italic">Add notes like 'Vanilla', 'Oud', or 'Rose' to start hunting.</h3>
                      </div>
                  ) : (
                       <SearchResults
                          loading={loading}
                          error={error}
                          results={results}
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onLoadMore={handleLoadMore}
                        />
                  )}
                </div>
              </>
            )}    </div>
  );
};

export default UnifiedSearchClient;