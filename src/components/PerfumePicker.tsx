'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

interface PerfumePickerProps {
  label: string;
  onSelect: (perfume: any) => void;
  selected?: any;
  placeholder?: string;
  filterOptions?: any[];
  showFilters?: boolean;
}

export default function PerfumePicker({ label, onSelect, selected, placeholder, filterOptions, showFilters }: PerfumePickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
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
      let filtered = filterOptions;
      
      // Apply vibe filter if selected
      if (selectedFilter !== 'all') {
        filtered = filtered.filter(p =>
          p.vibe_tags?.includes(selectedFilter)
        );
      }
      
      // Apply text search
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.brand_name.toLowerCase().includes(query.toLowerCase())
      );
      
      setResults(filtered.slice(0, 5));
      setIsOpen(query.length > 0 || selectedFilter !== 'all');
    } else if (query.length < 2 && selectedFilter === 'all') {
      setResults([]);
      return;
    } else {
      // Fetch from database with filters
      const fetchResults = async () => {
        const supabase = createClient();
        let queryBuilder = supabase.from('perfumes').select('*');
        
        if (query.length >= 2) {
          queryBuilder = queryBuilder.or(`name.ilike.%${query}%,brand_name.ilike.%${query}%`);
        }
        
        if (selectedFilter !== 'all') {
          queryBuilder = queryBuilder.contains('vibe_tags', [selectedFilter]);
        }
        
        const { data } = await queryBuilder.limit(5);
        setResults(data || []);
        setIsOpen(true);
      };
      
      const timer = setTimeout(fetchResults, 300);
      return () => clearTimeout(timer);
    }
  }, [query, filterOptions, selectedFilter]);

  // If a perfume is already selected, show the "Loaded" card
  if (selected) {
    return (
      <div className="w-full relative group cursor-pointer" onClick={() => onSelect(null)}>
        <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 z-10">{label}</div>
        <div className="border border-stone-300 rounded-xl p-4 flex items-center gap-4 bg-white shadow-sm hover:border-red-300 transition">
          <div className="w-12 h-16 bg-stone-50 rounded-md flex items-center justify-center">
             {selected.image_url ? <img src={selected.image_url} className="h-full object-contain mix-blend-multiply" /> : null}
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
      <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 z-10">{label}</div>
      
      {/* Filter Bar */}
      {showFilters && (
        <div className="flex gap-1 mb-2">
          {['all', 'Floral', 'Woody', 'Oriental', 'Fresh', 'Gourmand'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border transition ${
                selectedFilter === filter
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400'
              }`}
            >
              {filter === 'all' ? 'All' : filter}
            </button>
          ))}
        </div>
      )}
      
      <input
        type="text"
        placeholder={placeholder || "Search perfume..."}
        className="w-full bg-transparent border-0 border-b border-stone-300 px-4 py-3 outline-none focus:border-stone-800 transition placeholder:text-stone-400"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      />
      
      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl z-50 overflow-hidden border border-stone-100">
          {results.map((p) => (
            <div key={p.id}
              className="flex items-center gap-3 p-3 hover:bg-stone-50 cursor-pointer border-b border-stone-50 last:border-0 transition"
              onClick={() => {
                onSelect(p); // Pass the full perfume object back
                setQuery('');
                setIsOpen(false);
              }}
            >
               <div className="w-8 h-10 bg-white rounded flex items-center justify-center">
                 {p.image_url && <img src={p.image_url} className="h-full object-contain mix-blend-multiply" />}
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