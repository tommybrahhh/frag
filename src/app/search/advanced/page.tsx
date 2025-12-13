'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import NotePicker from '@/components/NotePicker';
import Link from 'next/link';

interface SearchResult {
  id: string;
  name: string;
  image_url: string;
  brand_name: string;
  matched_notes: Record<string, string>;
}

export default function AdvancedSearch() {
  const [included, setIncluded] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    const supabase = createClient();
    
    try {
      // First try the RPC function
      const { data, error } = await supabase.rpc('search_by_notes', {
        include_notes: included,
        exclude_notes: excluded
      });

      if (error) {
        console.warn('RPC function not available, falling back to client-side search:', error.message);
        // Fallback to client-side implementation
        await handleClientSideSearch();
      } else {
        setResults(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to client-side implementation
      await handleClientSideSearch();
    } finally {
      setLoading(false);
    }
  };

  const handleClientSideSearch = async () => {
    const supabase = createClient();
    
    const { data: perfumes, error } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url,
        brand:brands!perfumes_brand_id_fkey(name),
        perfume_notes(type, note:notes(name))
      `);

    if (error) {
      console.error('Error fetching perfumes:', error);
      setResults([]);
      return;
    }

    const processedResults = perfumes
      .map((perfume: any) => {
        // Flatten notes for easier checking
        const notesList = perfume.perfume_notes?.map((pn: any) => ({
          name: pn.note?.name?.toLowerCase(),
          originalName: pn.note?.name,
          type: pn.type || 'Note'
        })) || [];

        const noteNames = notesList.map((n: any) => n.name);

        // 1. Check Included
        const hasAllIncluded = included.length === 0 || included.every(req =>
          noteNames.includes(req.toLowerCase())
        );

        // 2. Check Excluded
        const hasNoExcluded = excluded.length === 0 || excluded.every(req =>
          !noteNames.includes(req.toLowerCase())
        );

        if (!hasAllIncluded || !hasNoExcluded) return null;

        // 3. Find positions of matched ingredients
        const matchedPositions: Record<string, string> = {};
        if (included.length > 0) {
           notesList.forEach((n: any) => {
             if (included.some(inc => inc.toLowerCase() === n.name)) {
               matchedPositions[n.originalName] = n.type;
             }
           });
        }

        let brandName = 'Unknown Brand';
        if (Array.isArray(perfume.brand) && perfume.brand.length > 0) {
          brandName = perfume.brand[0].name;
        } else if (perfume.brand && typeof perfume.brand === 'object') {
          brandName = perfume.brand.name;
        }

        return {
          id: perfume.id,
          name: perfume.name,
          image_url: perfume.image_url,
          brand_name: brandName,
          matched_notes: matchedPositions
        };
      })
      .filter((item) => item !== null) as SearchResult[];

    setResults(processedResults);
  };

  return (
    <div className="min-h-screen bg-white text-stone-800 pb-20 font-sans">
      
      {/* Header */}
      <div className="px-6 py-12 text-center max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl mb-4">Note Laboratory</h1>
        <p className="text-stone-500">Construct your perfect scent profile by selecting exactly what you want—and what you don't.</p>
      </div>

      {/* Controls */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="grid md:grid-cols-2 gap-12 bg-stone-50 p-8 rounded-3xl border border-stone-100">
          <NotePicker 
            label="Must Contain" 
            colorTheme="green"
            selectedNotes={included}
            onAddNote={(n) => setIncluded([...included, n])}
            onRemoveNote={(n) => setIncluded(included.filter(x => x !== n))}
          />
          <NotePicker 
            label="Must Avoid" 
            colorTheme="red"
            selectedNotes={excluded}
            onAddNote={(n) => setExcluded([...excluded, n])}
            onRemoveNote={(n) => setExcluded(excluded.filter(x => x !== n))}
          />
        </div>
        
        <div className="text-center mt-8">
          <button 
            onClick={handleSearch}
            className="bg-stone-900 text-white px-10 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:scale-105 transition"
          >
            Run Analysis
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-6">
        {loading ? (
          <div className="text-center text-stone-400 animate-pulse">Scanning database...</div>
        ) : hasSearched && results.length === 0 ? (
          <div className="text-center text-stone-400">No perfumes found matching this exact profile.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {results.map((p) => (
              <Link key={p.id} href={`/perfume/${p.id}`} className="group block bg-white rounded-xl p-4 border border-stone-100 hover:shadow-xl transition">
                <div className="h-48 mb-4 flex items-center justify-center p-2">
                   {p.image_url ? <img src={p.image_url} className="h-full object-contain group-hover:scale-110 transition duration-700" /> : null}
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold tracking-widest text-stone-400 uppercase mb-1">{p.brand_name}</div>
                  <div className="font-serif text-lg text-stone-900 mb-2 leading-tight">{p.name}</div>
                  
                  {/* Show Matched Notes & Positions */}
                  {p.matched_notes && Object.keys(p.matched_notes).length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center mt-3">
                      {Object.entries(p.matched_notes || {}).map(([note, pos]) => (
                        <span key={note} className="text-[10px] bg-stone-50 border border-stone-100 px-2 py-1 rounded-md text-stone-500">
                          <span className="font-bold text-stone-700">{note}</span>
                          <span className="text-stone-400 ml-1">({String(pos)})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}