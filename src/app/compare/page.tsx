import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ratingToHourRange } from '@/lib/longevity-utils';
import CompareSelection from '@/components/CompareSelection';

// Helper to calculate price tier value
const getPriceTierValue = (priceTier: string | null): number => {
  if (!priceTier) return 0;
  return priceTier.split('$').length - 1;
};

// Helper for winner class
const getWinnerClass = (valA: number | null, valB: number | null, isA: boolean) => {
  if (valA === null || valB === null) return 'text-stone-400';
  if (valA > valB) return isA ? 'text-stone-900 font-bold text-xl' : 'text-stone-300 text-lg';
  if (valB > valA) return !isA ? 'text-stone-900 font-bold text-xl' : 'text-stone-300 text-lg';
  return 'text-stone-600 font-medium';
};

// Occasion Logic Helper
const OCCASIONS = ['Date Night', 'Office Safe', 'Casual Daily', 'Formal Event', 'Party / Club', 'Summer Vacation', 'Gym / Sport'];

const checkOccasion = (p: any, occasion: string) => {
  if (p.occasions?.includes(occasion)) return true;
  
  // Heuristic Fallbacks based on Vibes & Stats
  const vibes = (p.vibe_tags || []).map((v: string) => v.toLowerCase());
  const seasons = p.best_season || [];
  
  if (occasion === 'Date Night' && (vibes.includes('sexy') || vibes.includes('romantic') || vibes.includes('intimate') || vibes.includes('seductive'))) return true;
  if (occasion === 'Office Safe' && (vibes.includes('clean') || vibes.includes('fresh') || vibes.includes('minimalist') || vibes.includes('inoffensive') || (p.sillage_rating && p.sillage_rating <= 3))) return true;
  if (occasion === 'Casual Daily' && (vibes.includes('casual') || vibes.includes('easy') || vibes.includes('versatile'))) return true;
  if (occasion === 'Formal Event' && (vibes.includes('elegant') || vibes.includes('luxurious') || vibes.includes('sophisticated') || vibes.includes('classy'))) return true;
  if (occasion === 'Party / Club' && (vibes.includes('loud') || vibes.includes('bold') || vibes.includes('playful') || (p.sillage_rating && p.sillage_rating >= 4))) return true;
  if (occasion === 'Summer Vacation' && (seasons.includes('Summer') || vibes.includes('tropical') || vibes.includes('aquatic') || vibes.includes('sunny'))) return true;
  if (occasion === 'Gym / Sport' && (vibes.includes('sporty') || vibes.includes('energetic') || vibes.includes('uplifting'))) return true;
  
  return false;
};

export default async function ComparePage(props: { searchParams: Promise<{ a?: string, b?: string }> }) {
  const searchParams = await props.searchParams;
  const idA = searchParams.a;
  const idB = searchParams.b;
  const supabase = await createClient();

  // 1. EMPTY STATE
  if (!idA) {
    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
            <div className="text-center text-stone-400">
                <p>Please select a perfume to compare.</p>
                <Link href="/" className="underline text-stone-600 mt-2 block">Go to Collection</Link>
            </div>
        </div>
    );
  }

  // 2. SELECTION MODE (A selected, B missing)
  if (idA && !idB) {
    // Fetch Perfume A
    const { data: perfumeA } = await supabase
        .from('perfumes')
        .select('id, name, image_url, brand:brands(name)')
        .eq('id', idA)
        .single();
    
    if (!perfumeA) return <div>Perfume not found.</div>;

    // Fetch Candidates
    const { data: candidates } = await supabase
        .from('perfumes')
        .select('id, name, image_url, brand:brands(name)')
        .neq('id', idA)
        .order('name');

    return (
        <div className="min-h-screen bg-stone-50 text-gray-800 font-sans">
            <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-16 z-10">
                <Link href="/" className="text-xs font-semibold uppercase tracking-widest hover:opacity-60 transition">← Collection</Link>
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Scentia</span>
            </div>
            <CompareSelection mainPerfume={perfumeA} candidates={candidates || []} />
        </div>
    );
  }

  // 3. BATTLE MODE (A and B selected)
  if (idA && idB) {
    const queryStr = `
      id, name, image_url, price_tier, 
      longevity_rating, sillage_rating, 
      best_season, vibe_tags, perfumer, release_year,
      scenario, scent_profile, occasions,
      brand:brands(name),
      perfume_notes(
        type,
        note:notes(name, color_hex)
      )
    `;

    const [resA, resB] = await Promise.all([
        supabase.from('perfumes').select(queryStr).eq('id', idA).single(),
        supabase.from('perfumes').select(queryStr).eq('id', idB).single()
    ]);

    const perfumeA = resA.data;
    const perfumeB = resB.data;

    if (!perfumeA || !perfumeB) return <div>Failed to load fighters.</div>;

    // Helpers for View
    const getProfileKeys = () => {
        const keysA = perfumeA.scent_profile ? Object.keys(perfumeA.scent_profile) : [];
        const keysB = perfumeB.scent_profile ? Object.keys(perfumeB.scent_profile) : [];
        return Array.from(new Set([...keysA, ...keysB]));
    };

    const getNotes = (p: any, type: string) => {
        return p.perfume_notes?.filter((n: any) => n.type === type) || [];
    };

    return (
        <div className="min-h-screen bg-stone-50 text-gray-800 font-sans">
            <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-16 z-10">
                <Link href="/" className="text-xs font-semibold uppercase tracking-widest hover:opacity-60 transition">← Collection</Link>
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Battle Analysis</span>
            </div>

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

            {/* NEW: OCCASION MATRIX */}
            <div className="mb-16">
                <h3 className="font-serif text-2xl text-stone-900 mb-8 text-center">Occasion Suitability</h3>
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                    <div className="grid grid-cols-3 bg-stone-50 border-b border-stone-200 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 text-center">
                        <div>{perfumeA.name.split(' ').slice(0,2).join(' ')}</div>
                        <div>Scenario</div>
                        <div>{perfumeB.name.split(' ').slice(0,2).join(' ')}</div>
                    </div>
                    {OCCASIONS.map((occasion) => {
                        const fitsA = checkOccasion(perfumeA, occasion);
                        const fitsB = checkOccasion(perfumeB, occasion);
                        return (
                            <div key={occasion} className="grid grid-cols-3 py-4 border-b border-stone-100 items-center last:border-0 hover:bg-stone-50 transition">
                                <div className="text-center text-lg">
                                    {fitsA ? <span className="text-green-600">✓</span> : <span className="text-stone-200">·</span>}
                                </div>
                                <div className="text-center text-xs font-serif text-stone-600">
                                    {occasion}
                                </div>
                                <div className="text-center text-lg">
                                    {fitsB ? <span className="text-green-600">✓</span> : <span className="text-stone-200">·</span>}
                                </div>
                            </div>
                        )
                    })}
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
        </div>
    );
  }

  return null;
}