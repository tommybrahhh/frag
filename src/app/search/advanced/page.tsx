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
      } as any);

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
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-24 font-sans selection:bg-stone-900 selection:text-white">
      
      {/* Nav */}
      <div className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">Search By Notes</span>
        <div className="w-8"></div>
      </div>
      
      {/* Header */}
      <div className="px-6 pt-8 pb-12 text-center max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-6">Note Laboratory</h1>
        <p className="text-stone-500 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
          Construct your perfect scent profile by filtering the database for specific ingredients.
        </p>
      </div>

      {/* Controls Card */}
      <div className="max-w-4xl mx-auto px-6 mb-16">
        <div className="bg-white rounded-[32px] shadow-xl border border-white overflow-hidden relative">
          
           {/* Header / Toolbar */}
          <div className="bg-stone-50 px-8 py-6 border-b border-stone-100 flex justify-between items-center">
            <div>
              <h2 className="font-serif text-2xl text-stone-900">Composition Filter</h2>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">Include & Exclude Specific Notes</p>
            </div>
          </div>

          <div className="p-8 md:p-12 relative">
             <div className="absolute inset-0 bg-stone-50/30 opacity-50 pointer-events-none"></div>
             
             <div className="relative z-10 grid md:grid-cols-2 gap-12">
                <NotePicker 
                  label="Must Contain" 
                  colorTheme="green"
                  selectedNotes={included}
                  onAddNote={(n) => setIncluded([...included, n])}
                  onRemoveNote={(n) => setIncluded(included.filter(x => x !== n))}
                />
                
                <div className="relative">
                   <div className="absolute top-8 bottom-8 -left-6 w-px bg-stone-200 hidden md:block"></div>
                   <NotePicker 
                    label="Must Avoid" 
                    colorTheme="red"
                    selectedNotes={excluded}
                    onAddNote={(n) => setExcluded([...excluded, n])}
                    onRemoveNote={(n) => setExcluded(excluded.filter(x => x !== n))}
                  />
                </div>
             </div>

             <div className="text-center mt-12 pt-8 border-t border-stone-100">
                <button 
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-stone-900 text-white px-12 py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-stone-700 transition shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Analyzing...' : 'Run Analysis'}
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin mb-4"></div>
              <div className="text-xs font-bold uppercase tracking-widest text-stone-400">Scanning Database...</div>
           </div>
        ) : hasSearched && results.length === 0 ? (
           <div className="text-center py-20 opacity-60">
              <div className="w-24 h-24 mx-auto mb-6 bg-stone-50 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center">
                <span className="text-4xl text-stone-300">🔍</span>
              </div>
              <h3 className="font-serif text-2xl text-stone-400 mb-2">No Matches Found</h3>
              <p className="text-sm text-stone-400 max-w-xs mx-auto">Try adjusting your filters to be less specific.</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map((p) => (
              <Link key={p.id} href={`/perfume/${p.id}`} className="group block bg-stone-50 rounded-2xl p-4 transition-colors hover:bg-stone-100">
                <div className="h-48 mb-4 flex items-center justify-center p-2 relative">
                   <div className="absolute inset-0 bg-white/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   {p.image_url ? <img src={p.image_url} className="relative z-10 h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-700" /> : <div className="text-stone-300 text-xs">No Image</div>}
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold tracking-widest text-stone-400 uppercase mb-1 truncate">{p.brand_name}</div>
                  <div className="font-serif text-lg text-stone-900 mb-3 leading-tight truncate group-hover:text-stone-600 transition">{p.name}</div>
                  
                  {/* Show Matched Notes & Positions */}
                  {p.matched_notes && Object.keys(p.matched_notes).length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {Object.entries(p.matched_notes || {}).map(([note, pos]) => (
                        <div key={note} className="flex items-center text-[9px] bg-white border border-stone-200 px-2 py-0.5 rounded-full shadow-sm">
                          <span className="font-bold text-stone-600 mr-1">{note}</span>
                          <span className="text-[7px] text-stone-400 uppercase tracking-wide">{String(pos)}</span>
                        </div>
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