'use client';

import { useState, useEffect, useRef } from 'react';

import { Note } from '@/types';

interface NoteSearchBarProps {
  onNoteSelected: (note: Note) => void;
}

export default function NoteSearchBar({ onNoteSelected }: NoteSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Fetch Logic (Debounced)
  useEffect(() => {
    const controller = new AbortController();

    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/notes/search?q=${query}`, {
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

  const showDropdown = isOpen && (results.length > 0 || loading);

  const handleSelectNote = (note: Note) => {
    setQuery('');
    setIsOpen(false);
    onNoteSelected(note);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto z-50">
      <div className="relative group">
        <input
          type="text"
          placeholder="Search for a note..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-white border border-stone-200 text-stone-800 text-sm px-4 py-3 pl-10 rounded-full outline-none focus:border-stone-400 focus:shadow-sm transition-all placeholder:text-stone-400"
        />
        <svg className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden z-50 max-h-60 overflow-y-auto">
          {loading && <div className="p-4 text-center text-xs text-stone-400 tracking-widest">SEARCHING...</div>}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-xs text-stone-400 italic">No notes found.</div>
          )}
          {!loading && results.length > 0 && (
            <>
              {results.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className="flex items-center gap-4 p-3 hover:bg-stone-50 transition border-b border-stone-50 last:border-0 group cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-serif text-stone-800">{note.name}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
