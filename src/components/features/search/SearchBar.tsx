'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]); // New state
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch initial suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        // Renamed variable to avoid potential conflict if any, though scope should be fine.
        // The error suggests likely block scope collision or I copied/pasted wrong.
        const response = await fetch(`/api/search?q=a`); 
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to load search suggestions", e);
      }
    };
    fetchSuggestions();
  }, []);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Logic (Debounced slightly by manual typing speed)
  useEffect(() => {
    const controller = new AbortController();

    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        setLoading(false); // Ensure loading is off
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${query}`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchResults, 300); // 300ms delay
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  // Determine display list
  const displayList = query.length >= 2 ? results : suggestions;
  const showDropdown = isOpen && (displayList.length > 0 || loading);

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto z-50">
      
      {/* Search Input */}
      <div className="relative group">
        <input
          type="text"
          placeholder="Search by name, vibe..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)} // Open on focus to show suggestions
          className="w-full bg-white border border-stone-200 text-stone-800 text-sm px-4 py-3 pl-10 rounded-full outline-none focus:border-stone-400 focus:shadow-sm transition-all placeholder:text-stone-400"
        />
        {/* Search Icon */}
        <svg className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden">
          
          {loading && (
            <div className="p-4 text-center text-xs text-stone-400 tracking-widest">SEARCHING...</div>
          )}

          {!loading && displayList.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-xs text-stone-400 italic">No perfumes found.</div>
          )}

          {!loading && displayList.length > 0 && (
            <>
              {query.length < 2 && (
                 <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                   Trending
                 </div>
              )}
              {displayList.map((perfume) => {
                if (!perfume.slug && !perfume.id) {
                  console.error("Perfume object missing both slug and id:", perfume);
                  // Optionally, you might want to return null or a placeholder here
                  // if a perfume without identifier shouldn't be displayed.
                  return null; 
                }
                return (
                  <Link 
                    key={perfume.id} 
                    href={`/perfume/${perfume.slug || perfume.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-3 hover:bg-stone-50 transition border-b border-stone-50 last:border-0 group"
                  >
                  {/* Tiny Image */}
                  <div className="w-10 h-10 bg-white rounded-md border border-stone-100 flex items-center justify-center overflow-hidden">
                    {perfume.image_url ? (
                      <img src={perfume.image_url} className="h-full object-contain" />
                    ) : (
                      <div className="w-2 h-2 bg-stone-200 rounded-full"></div>
                    )}
                  </div>

                  {/* Text Info */}
                  <div>
                    <div className="text-sm font-serif text-stone-800">{perfume.name}</div>
                    
                    {/* FIX: Changed nested Link to Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(false);
                        router.push(`/brands/${encodeURIComponent(perfume.brand?.name || 'Unknown House')}`);
                      }}
                      className="text-[10px] font-bold tracking-widest text-stone-400 uppercase hover:text-stone-600 transition-colors text-left"
                    >
                      {perfume.brand?.name}
                    </button>
                  </div>
                </Link>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}