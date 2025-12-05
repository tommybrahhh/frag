'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { ratingToHourRange } from '@/lib/longevity-utils';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [perfumeA, setPerfumeA] = useState<any>(null);
  const [perfumeB, setPerfumeB] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingOpponent, setSelectingOpponent] = useState(false);
  const [allPerfumes, setAllPerfumes] = useState<any[]>([]);

  useEffect(() => {
    const idA = searchParams.get('a');
    const idB = searchParams.get('b');

    if (idA && !idB) {
      setSelectingOpponent(true);
      fetchPerfumeAAndAllOthers(idA);
      return;
    }

    if (!idA || !idB) {
      setError("Battle requires two perfumes. Please select a second option.");
      setLoading(false);
      return;
    }

    fetchBattleData(idA, idB);
  }, [searchParams]);

  const fetchPerfumeAAndAllOthers = async (idA: string) => {
    try {
      const supabase = createClient();
      const { data: perfumeAData } = await supabase
        .from('perfumes')
        .select('id, name, image_url, brand:brands!perfumes_brand_id_fkey(name)')
        .eq('id', idA)
        .single();
      setPerfumeA(perfumeAData);

      const { data: candidates } = await supabase
        .from('perfumes')
        .select('id, name, image_url, brand:brands!perfumes_brand_id_fkey(name)')
        .neq('id', idA)
        .order('name');
      setAllPerfumes(candidates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBattleData = async (idA: string, idB: string) => {
    const supabase = createClient();
    // EXPANDED QUERY: Perfumer, Year, Notes, Profile, Scenario
    const queryStr = `
      id, name, image_url, price_tier, 
      longevity_rating, sillage_rating, 
      best_season, vibe_tags, perfumer, release_year,
      scenario, scent_profile,
      brand:brands!perfumes_brand_id_fkey(name),
      perfume_notes(
        type,
        note:notes(name, color_hex)
      )
    `;

    try {
      const [resA, resB] = await Promise.all([
        supabase.from('perfumes').select(queryStr).eq('id', idA).single(),
        supabase.from('perfumes').select(queryStr).eq('id', idB).single()
      ]);

      if (resA.error || resB.error) throw new Error("Failed to fetch fighters");

      setPerfumeA(resA.data);
      setPerfumeB(resB.data);
      setSelectingOpponent(false);
    } catch (err) {
      console.error(err);
      setError("Could not retrieve fighter data.");
    } finally {
      setLoading(false);
    }
  };

  const selectOpponent = (opponentId: string) => {
    const idA = searchParams.get('a');
    router.push(`/compare?a=${idA}&b=${opponentId}`);
  };

  if (loading) return <div className="pt-40 text-center text-stone-400 uppercase tracking-widest">Preparing Analysis...</div>;

  // --- VIEW: SELECT OPPONENT ---
  if (selectingOpponent && perfumeA) {
    return (
      <div className="max-w-4xl mx-auto px-6 mt-12 pb-20">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-stone-900 mb-2">Select Opponent</h1>
          <p className="text-stone-500 text-sm">Comparing against <span className="font-bold">{perfumeA.name}</span></p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allPerfumes.map((perfume) => (
            <button
              key={perfume.id}
              onClick={() => selectOpponent(perfume.id)}
              className="group bg-white rounded-2xl p-5 border border-stone-200 hover:border-stone-400 hover:shadow-lg transition-all duration-500 text-left h-full flex flex-col"
            >
              <div className="h-40 mb-4 flex items-center justify-center p-4 bg-stone-50/50 rounded-xl group-hover:bg-stone-50 transition-colors">
                {perfume.image_url ? (
                  <img
                    src={perfume.image_url}
                    className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700"
                    alt={perfume.name}
                  />
                ) : (
                  <span className="text-xs text-stone-300">No Image</span>
                )}
              </div>
              <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase truncate mb-1">{perfume.brand?.name}</div>
              <div className="font-serif text-lg text-stone-900 leading-tight truncate flex-grow">{perfume.name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (error || !perfumeA || !perfumeB) return <div className="pt-40 text-center text-stone-500">{error}</div>;

  // Comparison Helpers
  const getProfileKeys = () => {
    const keysA = perfumeA.scent_profile ? Object.keys(perfumeA.scent_profile) : [];
    const keysB = perfumeB.scent_profile ? Object.keys(perfumeB.scent_profile) : [];
    return Array.from(new Set([...keysA, ...keysB]));
  };

  const getNotes = (p: any, type: string) => {
    return p.perfume_notes?.filter((n: any) => n.type === type) || [];
  };

  // Helper function to convert price tier string to numeric value
  const getPriceTierValue = (priceTier: string | null): number => {
    if (!priceTier) return 0;
    // Count the number of $ signs to determine price level
    return priceTier.split('$').length - 1;
  };

  // Comparison Logic Helpers
  const getWinnerClass = (valA: number | null, valB: number | null, isA: boolean) => {
    if (valA === null || valB === null) return 'text-stone-400';
    if (valA > valB) return isA ? 'text-stone-900 font-bold text-xl' : 'text-stone-300 text-lg';
    if (valB > valA) return !isA ? 'text-stone-900 font-bold text-xl' : 'text-stone-300 text-lg';
    return 'text-stone-600 font-medium'; // Tie
  };

  return (
    <div className="max-w-6xl mx-auto px-4 mt-12 mb-20">
      
      {/* 1. HEAD-TO-HEAD HEADER */}
      <div className="grid grid-cols-2 gap-4 md:gap-12 items-end mb-16 border-b border-stone-200 pb-12">
        {[perfumeA, perfumeB].map((p, i) => (
           <div key={i} className="text-center">
             <div className="bg-white rounded-2xl p-6 border border-stone-100 mb-6 h-56 md:h-72 flex items-center justify-center relative">
                {p.image_url ? <img src={p.image_url} className="h-full object-contain mix-blend-multiply" /> : "No Image"}
             </div>
             <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2">{p.brand?.name}</div>
             <Link href={`/perfume/${p.id}`}>
               <h2 className="font-serif text-xl md:text-4xl text-stone-900 leading-tight mb-2 hover:text-stone-600 cursor-pointer transition-colors">{p.name}</h2>
             </Link>
             <div className="flex justify-center gap-4 text-xs text-stone-500 italic">
               <span>{p.perfumer || 'Unknown Nose'}</span>
               <span>•</span>
               <span>{p.release_year || 'N/A'}</span>
             </div>
           </div>
        ))}
      </div>

      {/* 2. BASIC METRICS COMPARISON */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm mb-16">
        
        {/* Price */}
        <div className="grid grid-cols-3 border-b border-stone-100 py-6 items-center hover:bg-stone-50 transition">
           <div className={`text-center text-lg ${getPriceTierValue(perfumeA.price_tier) < getPriceTierValue(perfumeB.price_tier) ? 'text-stone-900 font-bold text-xl' : 'text-stone-300 text-lg'}`}>{perfumeA.price_tier || '-'}</div>
           <div className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">Price</div>
           <div className={`text-center text-lg ${getPriceTierValue(perfumeB.price_tier) < getPriceTierValue(perfumeA.price_tier) ? 'text-stone-900 font-bold text-xl' : 'text-stone-300 text-lg'}`}>{perfumeB.price_tier || '-'}</div>
        </div>

        {/* Longevity */}
        <div className="grid grid-cols-3 border-b border-stone-100 py-6 items-center hover:bg-stone-50 transition">
           <div className={`text-center ${getWinnerClass(perfumeA.longevity_rating, perfumeB.longevity_rating, true)}`}>
             {perfumeA.longevity_rating ? ratingToHourRange(perfumeA.longevity_rating) : '-'}
           </div>
           <div className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">Longevity</div>
           <div className={`text-center ${getWinnerClass(perfumeA.longevity_rating, perfumeB.longevity_rating, false)}`}>
             {perfumeB.longevity_rating ? ratingToHourRange(perfumeB.longevity_rating) : '-'}
           </div>
        </div>

        {/* Sillage */}
        <div className="grid grid-cols-3 border-b border-stone-100 py-6 items-center hover:bg-stone-50 transition">
           <div className={`text-center ${getWinnerClass(perfumeA.sillage_rating, perfumeB.sillage_rating, true)}`}>{perfumeA.sillage_rating}/5</div>
           <div className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">Sillage</div>
           <div className={`text-center ${getWinnerClass(perfumeA.sillage_rating, perfumeB.sillage_rating, false)}`}>{perfumeB.sillage_rating}/5</div>
        </div>

        {/* Seasons */}
        <div className="grid grid-cols-3 py-8 items-center hover:bg-stone-50 transition">
           <div className="flex justify-center gap-1 flex-wrap px-4">
             {perfumeA.best_season?.map((s:string) => <span key={s} className="text-[10px] border border-stone-200 px-2 py-1 rounded text-stone-500 uppercase">{s}</span>)}
           </div>
           <div className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">Seasons</div>
           <div className="flex justify-center gap-1 flex-wrap px-4">
             {perfumeB.best_season?.map((s:string) => <span key={s} className="text-[10px] border border-stone-200 px-2 py-1 rounded text-stone-500 uppercase">{s}</span>)}
           </div>
        </div>

      </div>

      {/* 3. THE STORY BATTLE */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {[perfumeA, perfumeB].map((p, i) => (
          <div key={i} className="bg-stone-50 p-8 rounded-2xl border border-stone-100">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">The Vibe</h4>
             <p className="font-serif text-lg text-stone-800 italic leading-relaxed">"{p.scenario || 'No description available.'}"</p>
          </div>
        ))}
      </div>

      {/* 3. SCENT DNA ANALYSIS (Radar Bars) */}
      <div className="mb-16">
        <h3 className="font-serif text-2xl text-stone-900 mb-8 text-center">Olfactory DNA</h3>
        <div className="bg-white rounded-2xl border border-stone-200 p-8">
          {getProfileKeys().map((key) => {
            const valA = perfumeA.scent_profile?.[key] || 0;
            const valB = perfumeB.scent_profile?.[key] || 0;
            return (
              <div key={key} className="mb-6 last:mb-0">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  <span>{valA}/10</span>
                  <span className="text-stone-900">{key}</span>
                  <span>{valB}/10</span>
                </div>
                <div className="flex gap-1 h-2">
                  {/* Left Bar (Right Aligned) */}
                  <div className="flex-1 flex justify-end bg-stone-50 rounded-l-full overflow-hidden">
                    <div className="h-full bg-stone-400" style={{ width: `${valA * 10}%` }}></div>
                  </div>
                  {/* Center Divider */}
                  <div className="w-0.5 bg-stone-200"></div>
                  {/* Right Bar (Left Aligned) */}
                  <div className="flex-1 flex justify-start bg-stone-50 rounded-r-full overflow-hidden">
                    <div className="h-full bg-stone-900" style={{ width: `${valB * 10}%` }}></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. NOTE-FOR-NOTE BREAKDOWN */}
      <div className="mb-20">
        <h3 className="font-serif text-2xl text-stone-900 mb-8 text-center">Composition Battle</h3>
        <div className="grid gap-4">
           {['Top', 'Heart', 'Base'].map((type) => (
             <div key={type} className="grid grid-cols-3 border-b border-stone-200 pb-6 last:border-0">
                {/* Perfume A Notes */}
                <div className="flex flex-wrap gap-2 justify-end content-start">
                  {getNotes(perfumeA, type).map((n: any) => (
                    <Link
                      key={n.note.name}
                      href={`/ingredients/${encodeURIComponent(n.note.name.toLowerCase())}`}
                      className="flex items-center gap-1 px-2 py-1 bg-stone-50 border border-stone-100 rounded text-[10px] text-stone-600 hover:bg-stone-100 hover:border-stone-300 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: n.note.color_hex }}></span>
                      <span>{n.note.name}</span>
                    </Link>
                  ))}
                </div>
                
                {/* Label */}
                <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 pt-1">
                  {type}
                </div>

                {/* Perfume B Notes */}
                <div className="flex flex-wrap gap-2 justify-start content-start">
                  {getNotes(perfumeB, type).map((n: any) => (
                    <Link
                      key={n.note.name}
                      href={`/ingredients/${encodeURIComponent(n.note.name.toLowerCase())}`}
                      className="flex items-center gap-1 px-2 py-1 bg-stone-50 border border-stone-100 rounded text-[10px] text-stone-600 hover:bg-stone-100 hover:border-stone-300 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: n.note.color_hex }}></span>
                      <span>{n.note.name}</span>
                    </Link>
                  ))}
                </div>
             </div>
           ))}
        </div>
      </div>

    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-stone-50 text-gray-800 font-sans">
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest hover:opacity-60 transition">← Collection</Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Perfume Intuition</span>
      </div>
      <Suspense fallback={<div className="pt-40 text-center text-stone-400">Loading...</div>}>
        <CompareContent />
      </Suspense>
    </div>
  );
}