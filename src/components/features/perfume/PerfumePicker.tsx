'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { usePerfumeSearch } from '@/hooks/usePerfumeSearch';
import { getPerfumeImage } from '@/lib/perfume-utils';

interface PerfumePickerProps {
  label: string;
  onSelect: (perfume: any) => void;
  selected?: any;
  placeholder?: string;
  showFilters?: boolean;
  compact?: boolean;
}

export default function PerfumePicker({ label, onSelect, selected, placeholder, showFilters, compact = false }: PerfumePickerProps) {
  // Use the Custom Hook for all logic
  const { 
    query, 
    setQuery, 
    displayList, 
    listLabel, 
    isLoading 
  } = usePerfumeSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || displayList.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < displayList.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : displayList.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < displayList.length) {
          handleSelect(displayList[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < displayList.length) {
          e.preventDefault();
          handleSelect(displayList[selectedIndex]);
        }
        break;
    }
  }, [isOpen, displayList, selectedIndex]);

  const handleSelect = (perfume: any) => {
    onSelect(perfume);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Highlight matched text
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-100 text-stone-900 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  }, []);

  // If a perfume is already selected, show the "Loaded" card
  if (selected) {
    return (
      <div className="w-full relative group" onClick={() => onSelect(null)}>
        <div className="flex justify-between items-baseline mb-2 px-1">
             <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{label}</span>
             <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300 group-hover:text-red-400 transition cursor-pointer">Remove</span>
        </div>
        
        <div className={`bg-white rounded-2xl flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-stone-50 ${compact ? 'p-2' : 'p-4 gap-5'}`}>
          <div className={`${compact ? 'w-10 h-12' : 'w-16 h-20'} flex-shrink-0 flex items-center justify-center bg-stone-50 rounded-lg`}>
             {selected.image_url ? (
               <img src={getPerfumeImage(selected.image_url)} className="h-full w-full object-contain mix-blend-multiply opacity-90" /> 
             ) : (
               <div className="w-8 h-8 rounded-full border border-stone-200"></div>
             )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1 truncate">{selected.brand?.name || selected.brand_name}</div>
            <div className={`font-serif text-stone-800 leading-tight truncate pr-2 ${compact ? 'text-sm' : 'text-xl'}`}>{selected.name}</div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise show the Search Input
  return (
    <div className="relative w-full" ref={pickerRef}>
      <div className="mb-2 px-1">
           <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{label}</span>
      </div>
      
      <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder || "Search perfume..."}
            className={`w-full bg-white border border-stone-200 rounded-2xl pl-5 pr-10 outline-none focus:border-stone-800 focus:ring-1 focus:ring-stone-800 transition placeholder:text-stone-300 text-sm shadow-sm font-serif ${compact ? 'py-2' : 'py-4'}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={() => setIsOpen(true)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300">
             {isLoading ? (
               <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
             ) : query.length > 0 ? (
               <button 
                onClick={() => {
                    setQuery('');
                    if (inputRef.current) inputRef.current.focus();
                }}
                className="hover:text-stone-600 transition-colors"
               >
                 ✕
               </button>
             ) : (
               <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
             )}
          </div>
      </div>
      
      {/* Dropdown Results */}
      {isOpen && (displayList.length > 0 || query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-50 border border-stone-100 overflow-hidden">
          <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 text-[9px] font-bold uppercase tracking-widest text-stone-400">
            {listLabel}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {displayList.length > 0 ? (
              displayList.map((p, index) => (
              <div key={p.id}
                className={`flex items-center gap-3 p-3 hover:bg-stone-50 cursor-pointer border-b border-stone-50 last:border-0 transition ${index === selectedIndex ? 'bg-stone-50' : ''}`}
                onClick={() => {
                  handleSelect(p);
                }}
              >
                 <div className="w-10 h-12 bg-stone-50 rounded flex items-center justify-center shrink-0">
                   {p.image_url ? <img src={getPerfumeImage(p.image_url)} className="h-full object-contain mix-blend-multiply" /> : <div className="w-full h-full bg-stone-100 rounded"></div>}
                 </div>
                 <div>
                   <div className="text-sm font-serif text-stone-900 leading-tight">{highlightMatch(p.name, query)}</div>
                   <div className="text-[9px] uppercase tracking-wider text-stone-400 mt-0.5">{p.brand?.name}</div>
                 </div>
              </div>
            ))
            ) : (
              <div className="p-4 text-center text-stone-400 text-sm italic">
                No perfumes found matching "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
