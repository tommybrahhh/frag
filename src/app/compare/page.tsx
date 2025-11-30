'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

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

    console.log('URL Parameters:', { idA, idB });

    // If only one perfume is provided, show opponent selection
    if (idA && !idB) {
      console.log('Showing opponent selection for perfume:', idA);
      setSelectingOpponent(true);
      fetchPerfumeAAndAllOthers(idA);
      return;
    }

    if (!idA || !idB) {
      console.log('Missing parameters - showing error');
      setError("Battle requires two perfumes. Please select a second option.");
      setLoading(false);
      return;
    }

    console.log('Fetching battle data for:', idA, idB);
    fetchBattleData(idA, idB);
  }, [searchParams]);

  const fetchPerfumeAAndAllOthers = async (idA: string) => {
    try {
      const supabase = createClient();
      
      // First fetch perfume A details using the same syntax as API route
      const { data: perfumeAData, error: perfumeAError } = await supabase
        .from('perfumes')
        .select('id, name, image_url, brand:brands!perfumes_brand_id_fkey(name)')
        .eq('id', idA)
        .single();

      console.log('Perfume A fetch result:', { perfumeAData, perfumeAError });
      
      if (perfumeAError) {
        console.error('Error fetching perfume A:', perfumeAError);
        throw perfumeAError;
      }
      setPerfumeA(perfumeAData);

      // Then fetch all other perfumes
      const { data: allPerfumesData, error: allPerfumesError } = await supabase
        .from('perfumes')
        .select('id, name, image_url, brand:brands!perfumes_brand_id_fkey(name)')
        .neq('id', idA);

      console.log('All perfumes fetch result:', { allPerfumesData, allPerfumesError });
      
      if (allPerfumesError) {
        console.error('Error fetching all perfumes:', allPerfumesError);
        throw allPerfumesError;
      }
      setAllPerfumes(allPerfumesData || []);
    } catch (err) {
      console.error('Error in fetchPerfumeAAndAllOthers:', err);
      setError("Could not load perfumes. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBattleData = async (idA: string, idB: string) => {
    const supabase = createClient();
    // Use the same query syntax as the API route
    const queryStr = 'id, name, image_url, price_tier, longevity_rating, sillage_rating, best_season, vibe_tags, brand:brands!perfumes_brand_id_fkey(name)';

    try {
      const [resA, resB] = await Promise.all([
        supabase.from('perfumes').select(queryStr).eq('id', idA).single(),
        supabase.from('perfumes').select(queryStr).eq('id', idB).single()
      ]);

      console.log('Battle data fetch results:', { resA, resB });

      if (resA.error) {
        console.error('Error fetching perfume A for battle:', resA.error);
        throw resA.error;
      }
      if (resB.error) {
        console.error('Error fetching perfume B for battle:', resB.error);
        throw resB.error;
      }

      setPerfumeA(resA.data);
      setPerfumeB(resB.data);
      setSelectingOpponent(false);
    } catch (err: any) {
      console.error('Error in fetchBattleData:', err);
      setError("Could not retrieve fighter data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectOpponent = (opponentId: string) => {
    const idA = searchParams.get('a');
    router.push(`/compare?a=${idA}&b=${opponentId}`);
  };

  if (loading) return <div className="pt-40 text-center text-stone-400 uppercase tracking-widest">Preparing Battle Arena...</div>;

  // Opponent selection screen
  if (selectingOpponent && perfumeA) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-12">
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl text-stone-900 mb-4">Choose Your Opponent</h1>
          <p className="text-stone-500">Select a perfume to battle against {perfumeA.name}</p>
        </div>

        {/* Selected Fighter */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 mb-8">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
              {perfumeA.image_url ? (
                <img src={perfumeA.image_url} className="h-full object-contain" alt={perfumeA.name} />
              ) : (
                <div className="text-stone-300">No Image</div>
              )}
            </div>
            <Link
              href={`/brands/${encodeURIComponent(perfumeA.brand?.name || 'Unknown House')}`}
              className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 hover:text-stone-600 transition-colors"
            >
              {perfumeA.brand?.name}
            </Link>
            <h2 className="font-serif text-xl text-stone-900">{perfumeA.name}</h2>
          </div>
        </div>

        {/* Opponent Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allPerfumes.map((perfume) => (
            <button
              key={perfume.id}
              onClick={() => selectOpponent(perfume.id)}
              className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-300 transition-all text-left"
            >
              <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                {perfume.image_url ? (
                  <img src={perfume.image_url} className="h-full object-contain" alt={perfume.name} />
                ) : (
                  <div className="text-stone-300 text-xs">No Image</div>
                )}
              </div>
              <Link
                href={`/brands/${encodeURIComponent(perfume.brand?.name || 'Unknown House')}`}
                className="text-[10px] font-bold tracking-widest text-stone-400 uppercase truncate hover:text-stone-600 transition-colors"
              >
                {perfume.brand?.name}
              </Link>
              <div className="font-serif text-sm text-stone-900 truncate">{perfume.name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (error || !perfumeA || !perfumeB) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-2xl">⚔️</div>
      <h2 className="font-serif text-2xl text-stone-800">Arena Empty</h2>
      <p className="text-stone-500 max-w-md">{error || "One of the perfumes could not be found."}</p>
      <Link href="/" className="px-8 py-3 bg-stone-900 text-white rounded-full text-xs uppercase font-bold tracking-widest hover:bg-stone-700 transition">
        Return to Collection
      </Link>
    </div>
  );

  const getWinnerClass = (valA: number, valB: number, isA: boolean) => {
    if (!valA || !valB) return 'text-stone-400';
    if (valA > valB) return isA ? 'text-green-600 font-bold' : 'text-stone-300';
    if (valB > valA) return !isA ? 'text-green-600 font-bold' : 'text-stone-300';
    return 'text-stone-800 font-medium';
  };

  const getSeasonComparison = (seasonsA: string[], seasonsB: string[]) => {
    if (!seasonsA || !seasonsB) return { a: [], b: [] };
    
    const allSeasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    return {
      a: allSeasons.map(season => ({
        season,
        isBest: seasonsA.includes(season),
        isShared: seasonsB.includes(season)
      })),
      b: allSeasons.map(season => ({
        season,
        isBest: seasonsB.includes(season),
        isShared: seasonsA.includes(season)
      }))
    };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 mt-12">
      {/* THE ARENA */}
      <div className="grid grid-cols-2 gap-4 md:gap-12 items-end mb-12">
        {/* Fighter A */}
        <div className="text-center group">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-4 h-64 flex items-center justify-center">
             {perfumeA.image_url ? <img src={perfumeA.image_url} className="h-full object-contain" alt={perfumeA.name} /> : "No Image"}
          </div>
          <Link
            href={`/brands/${encodeURIComponent(perfumeA.brand?.name || 'Unknown House')}`}
            className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 hover:text-stone-600 transition-colors"
          >
            {perfumeA.brand?.name}
          </Link>
          <h2 className="font-serif text-xl md:text-3xl text-stone-900 leading-tight">{perfumeA.name}</h2>
        </div>

        {/* Fighter B */}
        <div className="text-center group">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-4 h-64 flex items-center justify-center">
             {perfumeB.image_url && <img src={perfumeB.image_url} className="h-full object-contain" alt={perfumeB.name} />}
          </div>
          <Link
            href={`/brands/${encodeURIComponent(perfumeB.brand?.name || 'Unknown House')}`}
            className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 hover:text-stone-600 transition-colors"
          >
            {perfumeB.brand?.name}
          </Link>
          <h2 className="font-serif text-xl md:text-3xl text-stone-900 leading-tight">{perfumeB.name}</h2>
        </div>
      </div>

      {/* STATS TABLE */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm mb-20">
        {/* Price */}
        <div className="grid grid-cols-3 border-b border-stone-100 py-8 items-center">
           <div className={`text-center text-lg ${perfumeA.price_tier?.length < perfumeB.price_tier?.length ? 'text-green-600 font-bold' : 'text-stone-400'}`}>{perfumeA.price_tier || '?'}</div>
           <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Price</div>
           <div className={`text-center text-lg ${perfumeB.price_tier?.length < perfumeA.price_tier?.length ? 'text-green-600 font-bold' : 'text-stone-400'}`}>{perfumeB.price_tier || '?'}</div>
        </div>
        {/* Longevity */}
        <div className="grid grid-cols-3 border-b border-stone-100 py-8 items-center">
           <div className={`text-center text-xl ${getWinnerClass(perfumeA.longevity_rating, perfumeB.longevity_rating, true)}`}>{perfumeA.longevity_rating}/5</div>
           <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Longevity</div>
           <div className={`text-center text-xl ${getWinnerClass(perfumeA.longevity_rating, perfumeB.longevity_rating, false)}`}>{perfumeB.longevity_rating}/5</div>
        </div>
        {/* Sillage */}
        <div className="grid grid-cols-3 border-b border-stone-100 py-8 items-center">
           <div className={`text-center text-xl ${getWinnerClass(perfumeA.sillage_rating, perfumeB.sillage_rating, true)}`}>{perfumeA.sillage_rating}/5</div>
           <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Projection</div>
           <div className={`text-center text-xl ${getWinnerClass(perfumeA.sillage_rating, perfumeB.sillage_rating, false)}`}>{perfumeB.sillage_rating}/5</div>
        </div>

        {/* Best Seasons */}
        <div className="grid grid-cols-3 border-b border-stone-100 py-8 items-center">
          <div className="text-center">
            <div className="flex flex-col gap-2 items-center">
              {getSeasonComparison(perfumeA.best_season, perfumeB.best_season).a.map(({ season, isBest, isShared }) => (
                <div key={season} className={`text-xs px-3 py-1 rounded-full border ${
                  isBest
                    ? isShared ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-stone-100 text-stone-400 border-stone-200'
                }`}>
                  {season}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Best Seasons</div>
          <div className="text-center">
            <div className="flex flex-col gap-2 items-center">
              {getSeasonComparison(perfumeA.best_season, perfumeB.best_season).b.map(({ season, isBest, isShared }) => (
                <div key={season} className={`text-xs px-3 py-1 rounded-full border ${
                  isBest
                    ? isShared ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-stone-100 text-stone-400 border-stone-200'
                }`}>
                  {season}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vibe Tags */}
        <div className="grid grid-cols-3 py-8 items-start">
          <div className="text-center">
            <div className="flex flex-wrap gap-2 justify-center">
              {perfumeA.vibe_tags?.slice(0, 3).map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-full border border-stone-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Vibe</div>
          <div className="text-center">
            <div className="flex flex-wrap gap-2 justify-center">
              {perfumeB.vibe_tags?.slice(0, 3).map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-full border border-stone-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 font-sans">
      {/* Nav */}
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-0 z-10">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">Scent Battle</span>
        <div className="w-8"></div>
      </div>
      
      {/* Suspense Boundary for useSearchParams */}
      <Suspense fallback={<div className="pt-40 text-center text-stone-400">Loading...</div>}>
        <CompareContent />
      </Suspense>
    </div>
  );
}