'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

interface NotePickerProps {
  label: string;
  selectedNotes: string[];
  onAddNote: (note: string) => void;
  onRemoveNote: (note: string) => void;
  colorTheme?: 'green' | 'red'; // Green for 'Include', Red for 'Exclude'
}

const DEFAULT_POPULAR_NOTES = [
  { name: 'Bergamot', color_hex: '#C8E6C9' },
  { name: 'Rose', color_hex: '#F8BBD0' },
  { name: 'Vanilla', color_hex: '#FFF9C4' },
  { name: 'Oud', color_hex: '#D7CCC8' },
  { name: 'Jasmine', color_hex: '#FFFFFF' },
  { name: 'Sandalwood', color_hex: '#FFE0B2' },
  { name: 'Patchouli', color_hex: '#8D6E63' },
  { name: 'Musk', color_hex: '#ECEFF1' }
];

export default function NotePicker({ label, selectedNotes, onAddNote, onRemoveNote, colorTheme = 'green' }: NotePickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch Suggestions on Mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/notes/popular');
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.length > 0 ? data : DEFAULT_POPULAR_NOTES);
        } else {
          setSuggestions(DEFAULT_POPULAR_NOTES);
        }
      } catch (e) {
        setSuggestions(DEFAULT_POPULAR_NOTES);
      }
    };
    fetchSuggestions();
  }, []);

  // Search Logic
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchNotes = async () => {
      setLoading(true); // Only set loading when we actually start fetching
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('name, color_hex')
          .ilike('name', `%${query}%`)
          .limit(8)
          .abortSignal(signal);
          
        if (!error && data) {
          setResults(data);
          setIsOpen(true);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
           console.error('Note search error:', error);
        }
      } finally {
        if (!signal.aborted) {
           setLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchNotes, 300);
    
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, supabase]);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayList = query.length >= 2 ? results : suggestions;
  const showDropdown = isOpen && (displayList.length > 0 || loading);

  return (
    <div className="w-full" ref={wrapperRef}>
      <label className={`text-[10px] font-bold uppercase tracking-widest mb-3 block ${colorTheme === 'green' ? 'text-emerald-700' : 'text-rose-700'}`}>
        {label}
      </label>
      
      {/* Selected Tags Display */}
      <div className="mb-4 min-h-[32px]">
        {selectedNotes.length === 0 ? (
          <p className="text-xs text-stone-400 italic pl-1">No ingredients selected</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedNotes.map(note => (
              <span
                key={note}
                className={`
                  flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border shadow-sm transition-all duration-200 animate-in fade-in zoom-in-95
                  ${colorTheme === 'green'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                  }
                `}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest">{note}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveNote(note);
                  }}
                  className={`
                    w-5 h-5 flex items-center justify-center rounded-full transition-colors
                    ${colorTheme === 'green'
                      ? 'hover:bg-emerald-200 text-emerald-600'
                      : 'hover:bg-rose-200 text-rose-600'
                    }
                  `}
                >
                  <svg width="8" height="8" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 1L1 13M1 1l12 12"/>
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative group">
        <input
          type="text"
          placeholder={`Type to add...`}
          className="w-full p-4 rounded-2xl border border-stone-200 bg-white focus:outline-none focus:border-stone-400 focus:shadow-sm text-sm transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        
        {/* Loading Indicator */}
        {loading && (
           <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
           </div>
        )}
        
        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-xl shadow-xl z-50 overflow-hidden">
            {query.length < 2 && (
               <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 text-[9px] font-bold uppercase tracking-widest text-stone-400">
                 Popular Ingredients
               </div>
            )}
            
            <div className="max-h-60 overflow-y-auto">
              {displayList.map((n) => (
                <button
                  key={n.name}
                  disabled={selectedNotes.includes(n.name)}
                  className={`w-full text-left px-4 py-3 hover:bg-stone-50 flex items-center gap-3 text-sm transition-colors border-b border-stone-50 last:border-0 ${selectedNotes.includes(n.name) ? 'opacity-50 cursor-not-allowed bg-stone-50' : ''}`}
                  onClick={() => {
                    if (!selectedNotes.includes(n.name)) {
                      onAddNote(n.name);
                      setQuery('');
                      setIsOpen(false);
                    }
                  }}
                >
                  <span className="w-6 h-6 rounded-full border border-stone-100 flex-shrink-0" style={{ backgroundColor: n.color_hex || '#eee' }}></span>
                  <span className="font-medium text-stone-700">{n.name}</span>
                  {selectedNotes.includes(n.name) && <span className="ml-auto text-xs text-stone-400 italic">Selected</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}