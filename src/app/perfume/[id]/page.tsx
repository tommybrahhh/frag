'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { RecommendationEngine, RecommendationCategory } from '@/lib/recommendation-engine';

export default function PerfumeDetail() {
  const params = useParams();
  const router = useRouter();
  const [perfume, setPerfume] = useState<any>(null);
  const [relatedPerfumes, setRelatedPerfumes] = useState<any[]>([]);
  const [dupes, setDupes] = useState<any[]>([]);
  const [recommendationCategories, setRecommendationCategories] = useState<RecommendationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('similar');
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'name'>('score');
  const [priceFilter, setPriceFilter] = useState<'all' | 'cheaper' | 'similar' | 'premium'>('all');

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

  // Helper function to convert price tier string to numeric value
  const getPriceTierValue = (priceTier: string): number => {
    if (!priceTier) return 0;
    // Count the number of $ signs to determine price level
    return priceTier.split('$').length - 1;
  };

  // Enhanced dupe detection with weighted note importance and stricter requirements
  const findClientSideDupes = (mainPerfume: any, allPerfumes: any[]) => {
    if (!mainPerfume || !allPerfumes) return [];

    const mainBrand = mainPerfume.brand?.name?.toLowerCase();
    const mainNotes = mainPerfume.perfume_notes || [];
    const mainVibes = mainPerfume.vibe_tags || [];
    const mainFamily = categorizeScentFamily(
      mainNotes.map((n: any) => n.note?.name?.toLowerCase()),
      mainVibes
    );

    // Weight notes by their importance (top > heart > base)
    const NOTE_WEIGHTS = {
      'Top': 1.5,
      'Heart': 2.0,
      'Base': 1.0
    };

    return allPerfumes
      .map((perfume: any) => {
        // Skip the same perfume
        if (perfume.id === mainPerfume.id) return null;

        const candidateBrand = perfume.brand?.name?.toLowerCase();
        const candidateNotes = perfume.perfume_notes || [];
        const candidateVibes = perfume.vibe_tags || [];
        const candidateFamily = categorizeScentFamily(
          candidateNotes.map((n: any) => n.note?.name?.toLowerCase()),
          candidateVibes
        );

        // 1. Brand-based exclusion (don't match same brand)
        const isDifferentBrand = mainBrand !== candidateBrand;
        if (!isDifferentBrand) return null;

        // 2. Price tier consideration
        const isCheaperAlternative = perfume.price_tier && mainPerfume.price_tier &&
          getPriceTierValue(perfume.price_tier) < getPriceTierValue(mainPerfume.price_tier);

        // 3. Detailed note analysis with weighted scoring
        let similarityScore = 0;
        let sharedNotesCount = 0;
        const sharedNotesByType: Record<string, string[]> = { Top: [], Heart: [], Base: [] };

        // Analyze note overlap with type weighting
        mainNotes.forEach((mainNote: any) => {
          const matchingNote = candidateNotes.find((candidateNote: any) =>
            candidateNote.note?.name?.toLowerCase() === mainNote.note?.name?.toLowerCase()
          );
          
          if (matchingNote) {
            const noteType = mainNote.type || 'Base';
            const weight = NOTE_WEIGHTS[noteType as keyof typeof NOTE_WEIGHTS] || 1.0;
            similarityScore += weight * 15;
            sharedNotesCount++;
            sharedNotesByType[noteType].push(mainNote.note?.name);
          }
        });

        // 4. Vibe tag matching
        const sharedVibes = mainVibes.filter((vibe: string) =>
          candidateVibes.includes(vibe)
        );
        similarityScore += sharedVibes.length * 8;

        // 5. Scent family bonus
        if (mainFamily && candidateFamily && mainFamily === candidateFamily) {
          similarityScore += 20;
        }

        // 6. Major bonus for cheaper alternatives
        if (isCheaperAlternative) {
          similarityScore += 35;
        }

        // 7. Calculate similarity percentage (0-100)
        const maxPossibleScore = (mainNotes.length * 2.0 * 15) + (mainVibes.length * 8) + 55;
        const similarityPercentage = Math.min(100, Math.round((similarityScore / maxPossibleScore) * 100));

        // Determine match type based on similarity and price
        let matchType = 'Similar Vibe';
        if (similarityPercentage >= 75 && isCheaperAlternative) {
          matchType = 'Excellent Dupe';
        } else if (similarityPercentage >= 65 && isCheaperAlternative) {
          matchType = 'Good Alternative';
        } else if (similarityPercentage >= 75) {
          matchType = 'Similar Profile';
        }

        return {
          perfume,
          similarityScore,
          similarityPercentage,
          sharedNotesCount,
          sharedNotesByType,
          sharedVibes,
          isCheaperAlternative,
          matchType
        };
      })
      .filter(Boolean)
      .filter((result: any) => {
        // Stricter filtering for true dupes
        const { similarityPercentage, sharedNotesCount, isCheaperAlternative } = result;
        
        // Minimum requirements for consideration
        if (sharedNotesCount < 3) return false;
        
        // Tiered acceptance criteria
        if (similarityPercentage >= 75) return true; // Excellent match
        if (similarityPercentage >= 65 && isCheaperAlternative) return true; // Good cheaper alternative
        if (similarityPercentage >= 80) return true; // Very similar regardless of price
        
        return false;
      })
      .sort((a: any, b: any) => b.similarityPercentage - a.similarityPercentage)
      .slice(0, 6) // Limit to top 6 matches
      .map((result: any) => ({
        dupe_id: result.perfume.id,
        dupe_name: result.perfume.name,
        dupe_image_url: result.perfume.image_url,
        brand_name: result.perfume.brand?.name,
        match_type: result.matchType,
        similarity_percentage: result.similarityPercentage,
        shared_notes: Object.values(result.sharedNotesByType)
          .flat()
          .slice(0, 4) || [],
        is_cheaper: result.isCheaperAlternative
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
          
        setRelatedPerfumes(matches.slice(0, 12));
      }

      // 3. Use client-side dupe detection only (database function is unreliable)
      let finalDupes: any[] = [];
      
      if (allPerfumes && mainPerfume) {
        finalDupes = findClientSideDupes(mainPerfume, allPerfumes);
      }
      
      setDupes(finalDupes);

      // 4. Get enhanced recommendations
      if (mainPerfume) {
        const enhancedRecs = await RecommendationEngine.getEnhancedRecommendations(mainPerfume);
        setRecommendationCategories(enhancedRecs);
        if (enhancedRecs.length > 0) {
          setActiveCategory(enhancedRecs[0].type);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [params?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white text-gray-500">Loading essence...</div>;
  if (!perfume) return <div className="min-h-screen flex items-center justify-center bg-white">Perfume not found.</div>;

  return (
    <div className="min-h-screen bg-white text-gray-800 pb-20 font-sans selection:bg-stone-900 selection:text-white">

      {/* Navbar */}
      <div className="px-6 py-4 sticky top-0 bg-white/90 backdrop-blur-md z-20 flex justify-between items-center border-b border-stone-200">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest hover:opacity-60 transition">← Collection</Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Perfume Intuition</span>
      </div>

      {/* SECTION 1: HERO (Emotion & Vibe) */}
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 mt-10 mb-16">
        
        {/* LEFT: Image */}
        <div className="bg-white rounded-3xl h-[400px] flex items-center justify-center relative shadow-sm border border-stone-100 p-10">
          {perfume.image_url ? (
            <img src={perfume.image_url} alt={perfume.name} className="h-full w-full object-contain mix-blend-multiply drop-shadow-2xl" />
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
        
        {/* Enhanced Dupe Finder */}
        {dupes.length > 0 && (
          <div className="mb-20">
            <h3 className="font-serif text-2xl text-stone-900 mb-4 border-b border-stone-200 pb-4">Smart Dupe Finder</h3>
            <p className="text-sm text-stone-600 mb-6 max-w-2xl">
              Found {dupes.length} potential alternatives with similar olfactory profiles.
              Results are ranked by similarity and price advantage.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {dupes.map((d: any) => (
                <Link key={d.dupe_id} href={`/perfume/${d.dupe_id}`} className="flex items-center gap-6 p-6 border border-stone-200 rounded-xl hover:border-stone-400 transition bg-white shadow-sm group">
                   <div className="w-20 h-24 flex-shrink-0 p-2 bg-stone-50 rounded-lg flex items-center justify-center">
                      {d.dupe_image_url ? <img src={d.dupe_image_url} className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition" /> : <div className="text-stone-300 text-xs">No Image</div>}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                         <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                           d.match_type.includes('Excellent') ? 'bg-green-50 text-green-700 border-green-300' :
                           d.match_type.includes('Good') ? 'bg-blue-50 text-blue-700 border-blue-300' :
                           'bg-amber-50 text-amber-700 border-amber-300'
                         }`}>
                           {d.match_type}
                         </span>
                         <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{d.brand_name}</span>
                         {d.is_cheaper && (
                           <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">💰 Cheaper</span>
                         )}
                      </div>
                      <h4 className="font-serif text-lg text-stone-900 leading-tight mb-1 truncate">{d.dupe_name}</h4>
                      
                      {/* Similarity indicator */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-16 bg-stone-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-stone-800 transition-all duration-500"
                            style={{ width: `${d.similarity_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-stone-600">{d.similarity_percentage}% match</span>
                      </div>
                      
                      <div className="text-xs text-stone-500">
                        <span className="font-medium">Shared notes: </span>
                        {d.shared_notes.join(', ')}
                      </div>
                   </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Recommendations */}
        {recommendationCategories.length > 0 && (
          <div className="mt-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 border-b border-stone-200 pb-4 gap-4">
              <h3 className="font-serif text-2xl text-stone-900">Discover More</h3>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Category selector */}
                <div className="flex gap-2 flex-wrap">
                  {recommendationCategories.map((category) => (
                    <button
                      key={category.type}
                      onClick={() => setActiveCategory(category.type)}
                      className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                        activeCategory === category.type
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {category.title}
                    </button>
                  ))}
                </div>
                
                {/* Filter and sort controls */}
                <div className="flex gap-2 items-center">
                  {/* Price filter */}
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value as any)}
                    className="text-xs border border-stone-200 rounded px-2 py-1.5 bg-white"
                  >
                    <option value="all">All Prices</option>
                    <option value="cheaper">More Affordable</option>
                    <option value="similar">Similar Price</option>
                    <option value="premium">Premium</option>
                  </select>
                  
                  {/* Sort by */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs border border-stone-200 rounded px-2 py-1.5 bg-white"
                  >
                    <option value="score">Best Match</option>
                    <option value="price">Price</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category description */}
            {recommendationCategories
              .filter(cat => cat.type === activeCategory)
              .map(category => (
                <div key={category.type} className="mb-6">
                  <p className="text-sm text-stone-600 max-w-2xl mb-6">
                    {category.description}
                  </p>
                  
                  {/* Special handling for seasonal recommendations */}
                  {category.type === 'seasonal' ? (
                    // Group seasonal recommendations by season
                    <div className="space-y-8">
                      {Object.entries(
                        category.recommendations.reduce((groups: Record<string, any[]>, rec) => {
                          const season = rec.reason;
                          if (!groups[season]) groups[season] = [];
                          groups[season].push(rec);
                          return groups;
                        }, {})
                      ).map(([season, seasonPerfumes]) => (
                        <div key={season}>
                          <h4 className="font-serif text-xl text-stone-800 mb-4 border-b border-stone-200 pb-2">
                            {season} Season
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {seasonPerfumes.map((rec) => (
                              <Link
                                key={rec.perfume.id}
                                href={`/perfume/${rec.perfume.id}`}
                                className="group block bg-white rounded-xl p-4 hover:shadow-xl transition duration-500 border border-stone-100 hover:border-stone-300 relative"
                              >
                                {/* Compare button */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(`/compare?a=${perfume.id}&b=${rec.perfume.id}`);
                                  }}
                                  className="absolute bottom-4 right-4 bg-white border border-stone-200 text-[10px] font-bold px-3 py-1 rounded-full hover:bg-stone-900 hover:text-white transition z-10 cursor-pointer shadow-sm"
                                >
                                  VS
                                </button>
                                
                                {/* Brand */}
                                <div className="flex justify-between items-start mb-4">
                                  <span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase truncate">
                                    {rec.perfume.brand?.name}
                                  </span>
                                </div>
                                
                                {/* Image */}
                                <div className="h-40 mb-4 overflow-hidden flex items-center justify-center p-2">
                                  {rec.perfume.image_url ? (
                                    <img
                                      src={rec.perfume.image_url}
                                      className="h-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700"
                                      alt={rec.perfume.name}
                                    />
                                  ) : (
                                    <div className="text-stone-300 text-xs">No Image</div>
                                  )}
                                </div>
                                
                                {/* Content */}
                                <div>
                                  <div className="font-serif text-lg text-stone-900 leading-tight mb-2 group-hover:text-stone-600 transition truncate">
                                    {rec.perfume.name}
                                  </div>
                                  
                                  {/* Shared notes/vibes */}
                                  {rec.sharedVibes && rec.sharedVibes.length > 0 && (
                                    <div className="text-[10px] text-stone-400 mt-1">
                                      <span className="font-medium">Vibes: </span>
                                      {rec.sharedVibes.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {category.recommendations
                        .filter(rec => {
                          if (priceFilter === 'all') return true;
                          if (priceFilter === 'cheaper') return rec.priceComparison === 'cheaper';
                          if (priceFilter === 'similar') return rec.priceComparison === 'similar';
                          if (priceFilter === 'premium') return rec.priceComparison === 'premium';
                          return true;
                        })
                        .sort((a, b) => {
                          if (sortBy === 'score') return b.score - a.score;
                          if (sortBy === 'price') {
                            const getPriceValue = (tier: string) => tier?.split('$').length - 1 || 0;
                            const aPrice = getPriceValue(a.perfume.price_tier);
                            const bPrice = getPriceValue(b.perfume.price_tier);
                            return aPrice - bPrice;
                          }
                          if (sortBy === 'name') {
                            return a.perfume.name.localeCompare(b.perfume.name);
                          }
                          return 0;
                        })
                        .map((rec) => (
                        <Link
                          key={rec.perfume.id}
                          href={`/perfume/${rec.perfume.id}`}
                          className="group block bg-white border border-stone-100 rounded-xl p-4 hover:border-stone-300 transition-all relative h-full"
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                              {rec.perfume.brand?.name}
                            </div>
                            {/* Match Score Badge - only show for non-seasonal, non-same-brand */}
                            {rec.type !== 'same-brand' && rec.type !== 'seasonal' && (
                              <div className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-1 rounded">
                                {rec.score}% Match
                              </div>
                            )}
                          </div>

                          {/* Card Image */}
                          <div className="h-40 flex items-center justify-center mb-4">
                            {rec.perfume.image_url ? (
                              <img
                                src={rec.perfume.image_url}
                                alt={rec.perfume.name}
                                className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500"
                              />
                            ) : (
                              <div className="text-xs text-stone-300">No Image</div>
                            )}
                          </div>

                          {/* Card Info */}
                          <div className="mb-8">
                            <h4 className="font-serif text-lg text-stone-900 leading-tight mb-1 group-hover:text-stone-600 transition">
                              {rec.perfume.name}
                            </h4>
                            <p className="text-xs text-stone-500 italic line-clamp-2">
                              {rec.reason}
                            </p>
                            
                            {/* Extra Info (Notes/Vibes) */}
                            {rec.sharedNotes && rec.sharedNotes.length > 0 && (
                              <div className="mt-2 text-[10px] text-stone-400">
                                <span className="font-medium">Notes: </span>
                                {rec.sharedNotes.slice(0, 3).join(', ')}
                              </div>
                            )}
                            {rec.sharedVibes && rec.sharedVibes.length > 0 && (
                              <div className="mt-1 text-[10px] text-stone-400">
                                <span className="font-medium">Vibes: </span>
                                {rec.sharedVibes.slice(0, 2).join(', ')}
                              </div>
                            )}
                            
                            {/* Price comparison badge */}
                            {rec.priceComparison && (
                              <div className={`mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                rec.priceComparison === 'cheaper'
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : rec.priceComparison === 'premium'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                  : 'bg-stone-100 text-stone-600 border border-stone-200'
                              }`}>
                                {rec.priceComparison === 'cheaper' ? '💰 More affordable' :
                                 rec.priceComparison === 'premium' ? '💎 Premium' : 'Similar price'}
                              </div>
                            )}
                          </div>

                          {/* VS Button positioned absolutely at bottom-right */}
                          <button
                            onClick={(e) => {
                              e.preventDefault(); // Prevent card link navigation
                              e.stopPropagation(); // Stop event bubbling
                              router.push(`/compare?a=${perfume.id}&b=${rec.perfume.id}`);
                            }}
                            className="absolute bottom-4 right-4 bg-white border border-stone-200 text-stone-600 text-[10px] font-bold px-3 py-1.5 rounded hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-colors z-10 cursor-pointer shadow-sm"
                          >
                            VS
                          </button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}