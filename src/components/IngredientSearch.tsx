'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Note {
  id: string;
  name: string;
  description: string;
  family: string;
  color_hex: string;
}

interface IngredientSearchProps {
  onIngredientsChange: (ingredients: string[]) => void;
  selectedIngredients: string[];
}

export default function IngredientSearch({ onIngredientsChange, selectedIngredients }: IngredientSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Logic (Debounced)
  useEffect(() => {
    const fetchResults = async () => {
      // Always show popular ingredients when input is empty, regardless of selected ingredients
      if (query.length === 0) {
        setLoading(true);
        try {
          const res = await fetch('/api/notes/popular');
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
          setSelectedIndex(-1);
        } catch (err) {
          console.error('Failed to fetch popular ingredients:', err);
          setResults([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        setSelectedIndex(-1);
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch(`/api/notes/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 200); // Reduced debounce time for better responsiveness
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          addIngredient(results[selectedIndex].name);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          e.preventDefault();
          addIngredient(results[selectedIndex].name);
        }
        break;
    }
  }, [isOpen, results, selectedIndex]);

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

  const addIngredient = (ingredient: string) => {
    if (!selectedIngredients.includes(ingredient)) {
      onIngredientsChange([...selectedIngredients, ingredient]);
    }
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const removeIngredient = (ingredient: string) => {
    onIngredientsChange(selectedIngredients.filter(item => item !== ingredient));
  };

  return (
    <div ref={searchRef} className="relative w-full">
      
      {/* Selected Ingredients */}
      {selectedIngredients.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedIngredients.map((ingredient) => (
            <div
              key={ingredient}
              className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-3 py-1 text-sm"
            >
              <span className="text-stone-700">{ingredient}</span>
              <button
                onClick={() => removeIngredient(ingredient)}
                className="text-stone-400 hover:text-stone-600 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          placeholder="Add an ingredient..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-white border border-stone-200 text-stone-800 text-sm px-4 py-3 pl-10 rounded-full outline-none focus:border-stone-400 focus:shadow-sm transition-all placeholder:text-stone-400"
          aria-autocomplete="list"
          aria-controls="ingredient-results"
          aria-expanded={isOpen}
        />
        {/* Search Icon */}
        <svg className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Results Dropdown */}
     {isOpen && (results.length > 0 || loading) && (
       <div
         id="ingredient-results"
         className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden z-50 max-h-64 overflow-y-auto"
         role="listbox"
       >
         
         {loading && (
           <div className="p-4 text-center text-xs text-stone-400 tracking-widest">SEARCHING...</div>
         )}

         {!loading && query.length === 0 && results.length > 0 && (
           <div className="p-3 border-b border-stone-100 bg-stone-50 sticky top-0">
             <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
               {selectedIngredients.length === 0 ? 'Popular Ingredients' : 'Search Ingredients'}
             </div>
           </div>
         )}

         {!loading && results.length === 0 && query.length > 0 && (
           <div className="p-4 text-center text-xs text-stone-400 italic">No ingredients found.</div>
         )}

         {!loading && results.map((note, index) => (
           <button
             key={note.id}
             onClick={() => addIngredient(note.name)}
             onMouseEnter={() => setSelectedIndex(index)}
             className={`w-full flex items-center gap-3 p-3 transition border-b border-stone-50 last:border-0 text-left ${
               index === selectedIndex
                 ? 'bg-stone-100 border-stone-200'
                 : 'hover:bg-stone-50'
             }`}
             role="option"
             aria-selected={index === selectedIndex}
           >
             {/* Color indicator */}
             <div
               className="w-4 h-4 rounded-full border-2 border-stone-100"
               style={{ backgroundColor: note.color_hex || '#ddd' }}
             ></div>
             
             {/* Text Info */}
             <div className="flex-1">
               <div className="text-sm font-serif text-stone-800 capitalize">
                 {query.length >= 2 ? highlightMatch(note.name, query) : note.name}
               </div>
               <div className="text-xs text-stone-400 capitalize">{note.family} Family</div>
             </div>
           </button>
         ))}
       </div>
     )}
    </div>
  );
}