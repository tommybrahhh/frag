'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function PerfumeDetail() {
  const params = useParams();
  const router = useRouter();
  const [perfume, setPerfume] = useState<any>(null);
  const [relatedPerfumes, setRelatedPerfumes] = useState<any[]>([]);
  const [dupes, setDupes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // SMART MATCHING LOGIC
  const getMatchDetails = (current: any, candidate: any) => {
    let score = 10; // Base score
    const sharedTags: string[] = [];

    // 1. Vibe Tag Check (+20 per match)
    if (current.vibe_tags && candidate.vibe_tags) {
      current.vibe_tags.forEach((tag: string) => {
        if (candidate.vibe_tags.includes(tag)) {
          score += 20;
          sharedTags.push(tag);
        }
      });
    }

    // 2. Season Check (+10 bonus)
    const sharedSeason = current.best_season?.some((s: string) => candidate.best_season?.includes(s));
    if (sharedSeason) score += 10;

    // 3. Price Tier Check (+5 bonus)
    if (current.price_tier === candidate.price_tier) score += 5;

    // 4. Brand Match (+10 bonus)
    if (current.brand?.name === candidate.brand?.name) score += 10;

    // Cap at 98%
    const finalScore = Math.min(score, 98);

    return {
      score: finalScore,
      reason: sharedTags.length > 0 ? `Shares ${sharedTags.slice(0, 2).join(' & ')}` : 'Similar Vibe Profile'
    };
  };

  // SCENT FAMILY CATEGORIZATION
  const categorizeScentFamily = (notes: string[], vibes: string[]) => {
    const noteCategories = {
      citrus: ['lemon', 'bergamot', 'orange', 'grapefruit', 'mandarin', 'citrus'],
      floral: ['rose', 'jasmine', 'lily', 'orchid', 'tuberose', 'violet', 'ylang'],
      woody: ['sandalwood', 'cedar', 'oak', 'patchouli', 'vetiver', 'amber', 'oud'],
      spicy: ['pepper', 'cinnamon', 'clove', 'nutmeg', 'cardamom', 'ginger'],
      gourmand: ['vanilla', 'chocolate', 'caramel', 'coffee', 'honey', 'tonka'],
      fresh: ['mint', 'green', 'aquatic', 'ozonic', 'marine', 'herbal'],
      tobacco: ['tobacco', 'tobacco leaf', 'pipe tobacco'],
      leather: ['leather', 'suede', 'birch tar']
    };

    const familyScores: Record<string, number> = {};

    // Score based on notes
    notes.forEach(note => {
      for (const [family, keywords] of Object.entries(noteCategories)) {
        if (keywords.some(keyword => note.includes(keyword))) {
          familyScores[family] = (familyScores[family] || 0) + 2;
        }
      }
    });

    // Score based on vibe tags
    vibes.forEach(vibe => {
      for (const [family, keywords] of Object.entries(noteCategories)) {
        if (keywords.some(keyword => vibe.toLowerCase().includes(keyword))) {
          familyScores[family] = (familyScores[family] || 0) + 1;
        }
      }
    });

    // Return the dominant family (if any)
    const dominantFamily = Object.entries(familyScores)
      .sort(([, a], [, b]) => b - a)[0];

    return dominantFamily && dominantFamily[1] >= 3 ? dominantFamily[0] : null;
  };

  // CLIENT-SIDE DUPE DETECTION ALGORITHM (BASED ON OLFACTORY COMPOSITION)
  const findClientSideDupes = (mainPerfume: any, allPerfumes: any[]) => {
    if (!mainPerfume || !allPerfumes) return [];

    const mainBrand = mainPerfume.brand?.name?.toLowerCase();
    const mainNotes = mainPerfume.perfume_notes?.map((n: any) => n.note?.name?.toLowerCase()) || [];
    const mainVibes = mainPerfume.vibe_tags || [];
    const mainFamily = categorizeScentFamily(mainNotes, mainVibes);

    return allPerfumes
      .filter((perfume: any) => {
        // Skip the same perfume
        if (perfume.id === mainPerfume.id) return false;

        const candidateBrand = perfume.brand?.name?.toLowerCase();
        const candidateNotes = perfume.perfume_notes?.map((n: any) => n.note?.name?.toLowerCase()) || [];
        const candidateVibes = perfume.vibe_tags || [];
        const candidateFamily = categorizeScentFamily(candidateNotes, candidateVibes);

        // 1. Must be in the same scent family
        if (mainFamily && candidateFamily && mainFamily !== candidateFamily) {
          return false;
        }

        // 2. Shared notes detection (primary factor)
        const sharedNotes = mainNotes.filter((note: string) =>
          candidateNotes.includes(note)
        );

        // 3. Vibe tag matching (secondary factor)
        const sharedVibes = mainVibes.filter((vibe: string) =>
          candidateVibes.includes(vibe)
        );

        // 4. Brand-based exclusion (don't match same brand)
        const isDifferentBrand = mainBrand !== candidateBrand;

        // 5. Price tier consideration (prefer cheaper alternatives)
        const isCheaperAlternative = perfume.price_tier && mainPerfume.price_tier &&
          perfume.price_tier.length < mainPerfume.price_tier.length;

        // Scoring system for dupe detection - focus on shared notes
        let dupeScore = 0;

        // High priority: Shared notes (more weight for more shared notes)
        if (sharedNotes.length > 0) {
          dupeScore += sharedNotes.length * 15;
        }

        // Medium priority: Shared vibe tags
        if (sharedVibes.length > 0) {
          dupeScore += sharedVibes.length * 8;
        }

        // Bonus for cheaper alternatives
        if (isCheaperAlternative) {
          dupeScore += 10;
        }

        // Bonus for same scent family (even if not explicitly tagged)
        if (mainFamily && candidateFamily && mainFamily === candidateFamily) {
          dupeScore += 20;
        }

        // Require minimum score and different brand
        return dupeScore >= 40 && isDifferentBrand && sharedNotes.length >= 3;
      })
      .map((perfume: any) => ({
        dupe_id: perfume.id,
        dupe_name: perfume.name,
        dupe_image_url: perfume.image_url,
        brand_name: perfume.brand?.name,
        match_type: 'Cheaper Alternative',
        shared_notes: perfume.perfume_notes
          ?.slice(0, 3)
          .map((n: any) => n.note?.name)
          .filter(Boolean) || []
      }));
  };

  useEffect(() => {
    const id = params?.id;
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const supabase = createClient();
      
      // 1. Fetch Main Perfume
      const { data: mainPerfume, error } = await supabase
        .from('perfumes')
        .select(`
          id, name, image_url, rating, vibe_tags,
          perfumer, price_tier, best_season,
          longevity_rating, sillage_rating,
          scenario, scent_profile,
          brand:brands!perfumes_brand_id_fkey(name),
          perfume_notes(
            type,
            prominence_score,
            note:notes(name, color_hex)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching perfume:', error);
        setLoading(false);
        return;
      }
      
      setPerfume(mainPerfume);

      // 2. Fetch Recommendations (with notes for dupe detection)
      const { data: allPerfumes } = await supabase
        .from('perfumes')
        .select(`
          id, name, image_url, price_tier, best_season,
          brand:brands!perfumes_brand_id_fkey(name), vibe_tags,
          perfume_notes(
            note:notes(name)
          )
        `)
        .neq('id', id);

      if (allPerfumes && mainPerfume.vibe_tags) {
        // Simple filter first, then sort by match score
        const matches = allPerfumes
          .filter((p: any) => p.vibe_tags?.some((t: string) => mainPerfume.vibe_tags.includes(t)))
          .sort((a: any, b: any) => getMatchDetails(mainPerfume, b).score - getMatchDetails(mainPerfume, a).score);
          
        setRelatedPerfumes(matches.slice(0, 4));
      }

      // 3. Use client-side dupe detection only (database function is unreliable)
      let finalDupes: any[] = [];
      
      if (allPerfumes && mainPerfume) {
        finalDupes = findClientSideDupes(mainPerfume, allPerfumes);
      }
      
      setDupes(finalDupes);
      setLoading(false);
    };

    fetchData();
  }, [params?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-gray-500">Loading essence...</div>;
  if (!perfume) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">Perfume not found.</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 pb-20 font-sans selection:bg-stone-900 selection:text-white">
      
      {/* Navbar */}
      <div className="px-6 py-4 sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-md z-20 flex justify-between items-center border-b border-stone-200">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest hover:opacity-60 transition">← Collection</Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Perfume Intuition</span>
      </div>

      {/* SECTION 1: HERO (Emotion & Vibe) */}
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 mt-10 mb-16">
        
        {/* LEFT: Image */}
        <div className="bg-white rounded-3xl h-[400px] flex items-center justify-center relative shadow-sm border border-stone-100 p-10">
          {perfume.image_url ? (
            <img src={perfume.image_url} alt={perfume.name} className="h-full w-full object-contain drop-shadow-2xl" />
          ) : (
             <span className="text-stone-300 font-serif italic">No Image Available</span>
          )}
          <div className="absolute top-6 right-6 flex gap-2">
            <span className="bg-stone-900 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest">{perfume.price_tier || '$$$'}</span>
          </div>
        </div>

        {/* RIGHT: The Story & Radar */}
        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <Link
                href={`/brands/${encodeURIComponent(perfume.brand?.name || 'Unknown Brand')}`}
                className="uppercase text-xs font-bold tracking-[0.2em] text-stone-500 hover:text-stone-700 transition-colors"
              >
                {perfume.brand?.name || 'Unknown Brand'}
              </Link>
              <Link
                href={`/compare?a=${perfume.id}`}
                className="border border-stone-300 text-xs uppercase px-4 py-2 rounded-full hover:bg-stone-900 hover:text-white transition"
              >
                Compare This
              </Link>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-medium text-stone-900 mb-4 leading-tight">{perfume.name}</h1>
            {perfume.perfumer && (
              <p className="text-sm text-stone-500 italic">
                Created by{' '}
                <Link
                  href={`/creators/${encodeURIComponent(perfume.perfumer)}`}
                  className="text-stone-800 border-b border-stone-300 pb-0.5 hover:text-stone-600 hover:border-stone-600 transition-colors"
                >
                  {perfume.perfumer}
                </Link>
              </p>
            )}
          </div>

          {/* Scenario */}
          {perfume.scenario && (
            <div className="mb-8 p-6 bg-white border border-stone-100 rounded-xl shadow-sm">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">The Vibe</h4>
               <p className="font-serif text-xl italic text-stone-800 leading-relaxed">"{perfume.scenario}"</p>
            </div>
          )}

          {/* Radar & Tags */}
          {perfume.scent_profile && (
            <div className="space-y-4">
               <div className="space-y-2">
                  {Object.entries(perfume.scent_profile).map(([key, value]: any) => (
                    <div key={key} className="flex items-center gap-4">
                       <span className="w-16 text-[10px] uppercase font-bold text-stone-500">{key}</span>
                       <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div className="h-full bg-stone-800 rounded-full" style={{ width: `${value * 10}%` }}></div>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="flex flex-wrap gap-2 mt-4">
                {Array.isArray(perfume.vibe_tags) && perfume.vibe_tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 border border-stone-300 text-[10px] uppercase tracking-wide rounded-full text-stone-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: THE COMPACT SPEC SHEET */}
      <div className="max-w-6xl mx-auto px-6 mb-20">
        <div className="bg-white border border-stone-100 rounded-3xl p-10 grid lg:grid-cols-12 gap-12 shadow-sm">
          
          {/* LEFT COL: Stats (Season, Longevity, Sillage) - Spans 4 columns */}
          <div className="lg:col-span-4 flex flex-col justify-center space-y-8 border-b lg:border-b-0 lg:border-r border-stone-100 pb-10 lg:pb-0 lg:pr-10">
            
            {/* 1. COMPACT SEASON (Row instead of Grid) */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Best Season</h4>
              </div>
              <div className="flex gap-2">
                {['Spring', 'Summer', 'Fall', 'Winter'].map(season => {
                  const isActive = perfume.best_season?.includes(season);
                  return (
                    <div key={season}
                      className={`flex-1 text-center text-[10px] uppercase font-bold py-2 rounded border transition-all ${
                        isActive
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-300 border-stone-100'
                      }`}>
                      {season}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. LONGEVITY (Linear Slider) */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Longevity</h4>
                <span className="text-[10px] font-bold text-stone-800 uppercase">
                   {perfume.longevity_rating}/5
                </span>
              </div>
              <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-800 transition-all duration-1000 ease-out"
                  style={{ width: `${(perfume.longevity_rating / 5) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-stone-400 mt-2 text-right">
                {perfume.longevity_rating >= 4 ? 'Long Lasting' : perfume.longevity_rating <= 2 ? 'Weak' : 'Moderate'}
              </p>
            </div>

            {/* 3. SILLAGE / TRAIL (New Linear Slider) */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Sillage</h4>
                <span className="text-[10px] font-bold text-stone-800 uppercase">
                   {perfume.sillage_rating}/5
                </span>
              </div>
              <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-400 transition-all duration-1000 ease-out"
                  style={{ width: `${(perfume.sillage_rating / 5) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-stone-400 mt-2 text-right">
                {perfume.sillage_rating >= 4 ? 'Room Filler' : perfume.sillage_rating <= 2 ? 'Intimate' : 'Moderate'}
              </p>
            </div>

          </div>

          {/* RIGHT COL: Olfactory Pyramid - Spans 8 columns */}
          <div className="lg:col-span-8 lg:pl-6 flex flex-col justify-center">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-8">Olfactory Composition</h4>
            
            <div className="space-y-8">
              {['Top', 'Heart', 'Base'].map((type) => {
                 const notes = perfume.perfume_notes?.filter((n: any) => n.type === type) || [];
                 // Keep spacing consistent even if empty
                 if (notes.length === 0 && !perfume.perfume_notes) return null;

                 return (
                  <div key={type} className="grid grid-cols-[60px_1fr] items-center gap-6 border-b border-stone-100 last:border-0 pb-6 last:pb-0">
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{type}</span>
                    <div className="flex flex-wrap gap-2">
                      {notes.length > 0 ? notes.map((n: any) => (
                          <Link
                            key={n.note.name}
                            href={`/ingredients/${encodeURIComponent(n.note.name.toLowerCase())}`}
                            className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-100 rounded-md hover:bg-stone-100 hover:border-stone-300 transition-colors cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: n.note.color_hex }}></span>
                            <span className="text-xs text-stone-600 font-medium uppercase tracking-wide">{n.note.name}</span>
                          </Link>
                      )) : <span className="text-[10px] text-stone-200 italic">No notes listed</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: DUPES & RECS */}
      <div className="max-w-6xl mx-auto px-6 mt-20">
        
        {/* Dupe Tracker */}
        {dupes.length > 0 && (
          <div className="mb-20">
            <h3 className="font-serif text-2xl text-stone-900 mb-8 border-b border-stone-200 pb-4">Smart Dupe Finder</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {dupes.map((d: any) => (
                <Link key={d.dupe_id} href={`/perfume/${d.dupe_id}`} className="flex items-center gap-6 p-6 border border-stone-200 rounded-xl hover:border-stone-400 transition bg-white shadow-sm">
                   <div className="w-20 h-24 flex-shrink-0 p-2 bg-stone-50 rounded-lg flex items-center justify-center">
                      {d.dupe_image_url ? <img src={d.dupe_image_url} className="h-full object-contain" /> : <div className="text-stone-300 text-xs">No Image</div>}
                   </div>
                   <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                         <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${d.match_type.includes('Cheaper') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{d.match_type}</span>
                         <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{d.brand_name}</span>
                      </div>
                      <h4 className="font-serif text-lg text-stone-900 leading-tight mb-1">{d.dupe_name}</h4>
                      <div className="text-xs text-stone-500 italic">Shares {d.shared_notes?.slice(0, 2).join(', ')}</div>
                   </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {relatedPerfumes.length > 0 && (
          <div>
            <h3 className="font-serif text-2xl text-stone-900 mb-8 border-b border-stone-200 pb-4">You Might Also Like</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedPerfumes.map((p) => {
                const match = getMatchDetails(perfume, p);
                return (
                  <Link key={p.id} href={`/perfume/${p.id}`} className="group block bg-white rounded-xl p-4 hover:shadow-xl transition duration-500 border border-transparent hover:border-stone-100 relative">
                    
                    {/* THE FIX: Button instead of Link for VS */}
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // Stop parent link from firing
                        e.stopPropagation(); // Stop bubbling
                        router.push(`/compare?a=${perfume.id}&b=${p.id}`);
                      }}
                      className="absolute top-2 right-2 bg-white border border-stone-200 text-[10px] font-bold px-2 py-1 rounded hover:bg-stone-900 hover:text-white transition z-10 cursor-pointer"
                    >
                      VS
                    </button>
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase truncate">{p.brand?.name}</span>
                       <span className="text-[9px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">{match.score}%</span>
                    </div>
                    <div className="h-40 mb-4 overflow-hidden flex items-center justify-center p-2">
                        {p.image_url ? <img src={p.image_url} className="h-full object-contain group-hover:scale-110 transition duration-700" /> : <div className="text-stone-300 text-xs">No Image</div>}
                    </div>
                    <div>
                      <div className="font-serif text-lg text-stone-900 leading-tight mb-1 group-hover:text-stone-600 transition truncate">{p.name}</div>
                      <div className="text-xs text-stone-400 italic truncate">{match.reason}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}