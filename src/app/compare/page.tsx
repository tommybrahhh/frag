'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image'; // Import Image component
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface Brand {
  name: string;
}

interface PerfumeLite {
  id: string;
  name: string;
  image_url: string | null;
  brand: Brand | null;
}

interface Perfume extends PerfumeLite {
  price_tier: string | null;
  longevity_rating: number | null;
  sillage_rating: number | null;
  best_season: string[] | null;
  vibe_tags: string[] | null;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [perfumeA, setPerfumeA] = useState<Perfume | null>(null);
  const [perfumeB, setPerfumeB] = useState<Perfume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Opponent Selection State
  const [selectingOpponent, setSelectingOpponent] = useState(false);
  const [allPerfumes, setAllPerfumes] = useState<PerfumeLite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const idA = searchParams.get('a');
    const idB = searchParams.get('b');

    // Case 1: User clicked "Compare" on a detail page (Only ID A exists)
    if (idA && !idB) {
      setSelectingOpponent(true);
      fetchPerfumeAAndAllOthers(idA);
      return;
    }

    // Case 2: Missing ID A (Invalid URL)
    if (!idA) {
      setError("Invalid comparison link.");
      setLoading(false);
      return;
    }

    // Case 3: Both IDs exist (Render Battle)
    fetchBattleData(idA, idB!);
  }, [searchParams]);

  const fetchPerfumeAAndAllOthers = async (idA: string) => {
    try {
      const supabase = createClient();
      
      // 1. Fetch Fighter A
      const { data: perfumeAData, error: aError } = await supabase
        .from('perfumes')
        .select('id, name, image_url, brand:brands!perfumes_brand_id_fkey(name)')
        .eq('id', idA)
        .single();

      if (aError) throw aError;
      setPerfumeA(perfumeAData);

      // 2. Fetch Candidates (Lightweight query)
      const { data: candidates, error: cError } = await supabase
        .from('perfumes')
        .select('id, name, image_url, brand:brands!perfumes_brand_id_fkey(name)')
        .neq('id', idA)
        .order('name');

      if (cError) throw cError;
      setAllPerfumes(candidates || []);

    } catch (err) {
      console.error(err);
      setError("Could not load selection list.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBattleData = async (idA: string, idB: string) => {
    const supabase = createClient();
    const queryStr = 'id, name, image_url, price_tier, longevity_rating, sillage_rating, best_season, vibe_tags, brand:brands!perfumes_brand_id_fkey(name)';

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

  // Filter perfumes for the search bar
  const filteredCandidates = allPerfumes.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="pt-40 text-center text-stone-400 uppercase tracking-widest">Preparing Battle Arena...</div>;

  // --- VIEW: SELECT OPPONENT ---
  if (selectingOpponent && perfumeA) {
    return (
      <div className="max-w-4xl mx-auto px-6 mt-12 pb-20">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-stone-900 mb-2">Choose Opponent</h1>
          <p className="text-stone-500 text-sm">Who will battle against <span className="font-bold">{perfumeA.name}</span>?</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-10">
          <input 
            type="text" 
            placeholder="Search perfume or brand..." 
            className="w-full p-3 rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:border-stone-400 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCandidates.map((perfume) => (
            <button
              key={perfume.id}
              onClick={() => selectOpponent(perfume.id)}
              className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-300 transition-all text-left group"
            >
              <div className="h-24 mb-3 flex items-center justify-center p-2">
                  {perfume.image_url ? (
                    <Image src={perfume.image_url} width={96} height={96} className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500" alt={perfume.name || 'Perfume image'} />
                  ) : (
                    <div className="text-stone-300 text-[10px]">No Image</div>
                  )}
                </div>
              
              {/* FIX: Removed <Link>, just text now */}
              <div className="text-[9px] font-bold tracking-widest text-stone-400 uppercase truncate">
                {perfume.brand?.name}
              </div>
              <div className="font-serif text-sm text-stone-900 truncate">{perfume.name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- VIEW: BATTLE ARENA ---
  if (error || !perfumeA || !perfumeB) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
      <h2 className="font-serif text-2xl text-stone-800">Arena Empty</h2>
      <p className="text-stone-500 max-w-md text-sm">{error}</p>
      <Link href="/" className="px-6 py-2 bg-stone-900 text-white rounded-full text-xs uppercase font-bold tracking-widest">
        Return Home
      </Link>
    </div>
  );

  // Helper function to convert price tier string to numeric value
  const getPriceTierValue = (priceTier: string | null): number => {
    if (!priceTier) return 0;
    // Count the number of $ signs to determine price level
    return priceTier.split('$').length - 1;
  };

  // Comparison Logic Helpers
  const getWinnerClass = (valA: number | null, valB: number | null, isA: boolean) => {
    if (valA === null || valB === null) return 'text-stone-400';
    if (valA > valB) return isA ? 'text-green-600 font-bold' : 'text-stone-300';
    if (valB > valA) return !isA ? 'text-green-600 font-bold' : 'text-stone-300';
    return 'text-stone-800 font-medium'; // Tie
  };

  return (
    <div className="max-w-5xl mx-auto px-4 mt-12 mb-20">
      {/* THE FIGHTERS */}
      <div className="grid grid-cols-2 gap-4 md:gap-12 items-end mb-12">
        {[perfumeA, perfumeB].map((p, i) => (
         <div key={i} className="text-center">
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-4 h-48 md:h-64 flex items-center justify-center">
              {p.image_url ? <Image src={p.image_url} width={200} height={200} className="h-full object-contain mix-blend-multiply" alt={p.name || 'Perfume image'} /> : "No Image"}
           </div>
           <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1">{p.brand?.name}</div>
           <h2 className="font-serif text-lg md:text-3xl text-stone-900 leading-tight">{p.name}</h2>
         </div>
      ))}
      </div>

      {/* THE STATS TABLE */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        
        {/* Price */}
        <div className="grid grid-cols-3 border-b border-stone-100 py-6 items-center hover:bg-stone-50 transition">
           <div className={`text-center text-lg ${getPriceTierValue(perfumeA.price_tier) < getPriceTierValue(perfumeB.price_tier) ? 'text-green-600 font-bold' : 'text-stone-400'}`}>{perfumeA.price_tier || '-'}</div>
           <div className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">Price</div>
           <div className={`text-center text-lg ${getPriceTierValue(perfumeB.price_tier) < getPriceTierValue(perfumeA.price_tier) ? 'text-green-600 font-bold' : 'text-stone-400'}`}>{perfumeB.price_tier || '-'}</div>
        </div>

        {/* Longevity */}
        <div className="grid grid-cols-3 border-b border-stone-100 py-6 items-center hover:bg-stone-50 transition">
           <div className={`text-center text-xl ${getWinnerClass(perfumeA.longevity_rating, perfumeB.longevity_rating, true)}`}>{perfumeA.longevity_rating}/5</div>
           <div className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">Longevity</div>
           <div className={`text-center text-xl ${getWinnerClass(perfumeA.longevity_rating, perfumeB.longevity_rating, false)}`}>{perfumeB.longevity_rating}/5</div>
        </div>

        {/* Sillage */}
        <div className="grid grid-cols-3 border-b border-stone-100 py-6 items-center hover:bg-stone-50 transition">
           <div className={`text-center text-xl ${getWinnerClass(perfumeA.sillage_rating, perfumeB.sillage_rating, true)}`}>{perfumeA.sillage_rating}/5</div>
           <div className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">Sillage</div>
           <div className={`text-center text-xl ${getWinnerClass(perfumeA.sillage_rating, perfumeB.sillage_rating, false)}`}>{perfumeB.sillage_rating}/5</div>
        </div>

        {/* Seasons */}
        <div className="grid grid-cols-3 py-8 items-center hover:bg-stone-50 transition">
           <div className="flex justify-center gap-1 flex-wrap px-4">
             {perfumeA.best_season?.map((s:string) => <span key={s} className="text-[9px] border border-stone-200 px-2 py-1 rounded text-stone-600 bg-white">{s}</span>)}
           </div>
           <div className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">Seasons</div>
           <div className="flex justify-center gap-1 flex-wrap px-4">
             {perfumeB.best_season?.map((s:string) => <span key={s} className="text-[9px] border border-stone-200 px-2 py-1 rounded text-stone-600 bg-white">{s}</span>)}
           </div>
        </div>

      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-0 z-10">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">Scent Battle</span>
        <div className="w-8"></div>
      </div>
      <Suspense fallback={<div className="pt-40 text-center text-stone-400">Loading...</div>}>
        <CompareContent />
      </Suspense>
    </div>
  );
}