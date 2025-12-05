'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface NotePickerProps {
  label: string;
  selectedNotes: string[];
  onAddNote: (note: string) => void;
  onRemoveNote: (note: string) => void;
  colorTheme?: 'green' | 'red'; // Green for 'Include', Red for 'Exclude'
}

export default function NotePicker({ label, selectedNotes, onAddNote, onRemoveNote, colorTheme = 'green' }: NotePickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (query.length < 2) return;
    
    const fetchNotes = async () => {
      const { data } = await supabase
        .from('notes')
        .select('name, color_hex')
        .ilike('name', `%${query}%`)
        .limit(5);
      setResults(data || []);
      setIsOpen(true);
    };

    const timer = setTimeout(fetchNotes, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="w-full">
      <label className={`text-[10px] font-bold uppercase tracking-widest mb-2 block ${colorTheme === 'green' ? 'text-green-700' : 'text-red-700'}`}>
        {label}
      </label>
      
      {/* Active Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedNotes.map(note => (
          <span key={note} className={`text-xs px-3 py-1 rounded-full flex items-center gap-2 border ${colorTheme === 'green' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {note}
            <button onClick={() => onRemoveNote(note)} className="hover:font-bold">×</button>
          </span>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder={`Type an ingredient to ${label.toLowerCase()}...`}
          className="w-full p-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-stone-400 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        
        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-xl shadow-xl z-50 overflow-hidden">
            {results.map((n) => (
              <button
                key={n.name}
                className="w-full text-left px-4 py-3 hover:bg-stone-50 flex items-center gap-3 text-sm"
                onClick={() => {
                  onAddNote(n.name);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: n.color_hex }}></span>
                {n.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}