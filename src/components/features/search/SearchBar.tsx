'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PerfumeImage from '@/components/ui/PerfumeImage';
import Spinner from '@/components/ui/Spinner';

interface SearchBarProps {
  onSearch?: () => void;
  className?: string;
}

export default function SearchBar({ onSearch, className }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Handle Search Fetching
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
        setSelectedIndex(0);
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 250);
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (results[selectedIndex]) {
        const item = results[selectedIndex];
        router.push(`/perfume/${item.slug || item.id}`);
        setIsOpen(false);
        setQuery('');
      } else if (query) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Search Input Container */}
      <div className={`relative flex items-center bg-stone-50 border transition-all duration-500 rounded-full px-5 py-2.5 ${isOpen ? 'border-stone-300 bg-white shadow-lg' : 'border-stone-100'}`}>
        <svg className={`w-4 h-4 mr-3 transition-colors ${isOpen ? 'text-stone-900' : 'text-stone-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        <input
          ref={inputRef}
          type="text"
          placeholder="Search Scentia..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-300 font-serif"
        />

        {loading && <Spinner size="sm" />}
        
        {!loading && query && (
          <button onClick={() => setQuery('')} className="ml-2 text-stone-300 hover:text-stone-900 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-[1000] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-h-[60vh] overflow-y-auto scrollbar-hide py-2">
            {results.length > 0 ? (
              <div className="px-2 space-y-0.5">
                {results.map((perfume, index) => (
                  <Link
                    key={perfume.id}
                    href={`/perfume/${perfume.slug || perfume.id}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center gap-4 p-2.5 px-4 rounded-xl transition-all duration-200 ${
                      selectedIndex === index ? 'bg-stone-50 translate-x-1' : 'opacity-80'
                    }`}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg border border-stone-100 p-1 flex items-center justify-center shrink-0 relative">
                      <PerfumeImage 
                        src={perfume.image_url} 
                        alt={perfume.name} 
                        fill
                        className="object-contain mix-blend-multiply" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 truncate">
                        {perfume.brand?.name || perfume.brand_name}
                      </div>
                      <div className="text-sm font-serif text-stone-900 truncate">
                        {perfume.name}
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* View All Option */}
                <div className="pt-2 mt-2 border-t border-stone-50">
                   <Link 
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 transition-colors"
                   >
                     View all results →
                   </Link>
                </div>
              </div>
            ) : !loading && query.length >= 2 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-stone-900 font-serif text-sm mb-1">No matches found</p>
                <p className="text-stone-400 text-[11px] italic">Try a different name or brand.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
