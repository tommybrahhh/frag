'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

interface PerfumePickerProps {
  label: string;
  onSelect: (perfume: any) => void;
  selected?: any;
  placeholder?: string;
  filterOptions?: any[];
}

export default function PerfumePicker({ label, onSelect, selected, placeholder, filterOptions }: PerfumePickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Logic
  useEffect(() => {
    if (filterOptions && filterOptions.length > 0) {
      // Use filtered options if provided
      const filtered = filterOptions.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.brand_name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered.slice(0, 5));
      setIsOpen(query.length > 0);
    } else if (query.length < 2) {
      setResults([]);
      return;
    } else {
      // Fetch from database
      const fetchResults = async () => {
        const supabase = createClient();
        const { data } = await supabase.rpc('search_perfumes', { keyword: query }).limit(5);
        setResults(data || []);
        setIsOpen(true);
      };
      
      const timer = setTimeout(fetchResults, 300);
      return () => clearTimeout(timer);
    }
  }, [query, filterOptions]);

  // If a perfume is already selected, show the "Loaded" card
  if (selected) {
    return (
      <div className="w-full relative group cursor-pointer" onClick={() => onSelect(null)}>
        <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 z-10">{label}</div>
        <div className="border border-stone-300 rounded-xl p-4 flex items-center gap-4 bg-white shadow-sm hover:border-red-300 transition">
          <div className="w-12 h-16 bg-stone-50 rounded-md flex items-center justify-center">
             {selected.image_url ? <img src={selected.image_url} className="h-full object-contain" /> : null}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-stone-400">{selected.brand_name}</div>
            <div className="font-serif text-lg leading-none">{selected.name}</div>
          </div>
          <div className="ml-auto text-stone-300 text-xl group-hover:text-red-400">×</div>
        </div>
      </div>
    );
  }

  // Otherwise show the Search Input
  return (
    <div className="relative w-full" ref={pickerRef}>
      <div className="absolute -top-3 left-4 bg-[#FDFBF7] px-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 z-10">{label}</div>
      <input
        type="text"
        placeholder={placeholder || "Search perfume..."}
        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-4 outline-none focus:border-stone-800 transition"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      />
      
      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((p) => (
            <div key={p.id} 
              className="flex items-center gap-3 p-3 hover:bg-stone-50 cursor-pointer border-b border-stone-50 last:border-0"
              onClick={() => {
                onSelect(p); // Pass the full perfume object back
                setQuery('');
                setIsOpen(false);
              }}
            >
               <div className="w-8 h-8 bg-stone-100 rounded flex items-center justify-center">
                 {p.image_url && <img src={p.image_url} className="h-full object-contain" />}
               </div>
               <div>
                 <div className="text-xs font-bold text-stone-900">{p.name}</div>
                 <div className="text-[9px] uppercase text-stone-400">{p.brand_name}</div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}