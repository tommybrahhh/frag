'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import CommentsSection from '@/components/CommentsSection';
import ScentRadar from '@/components/ScentRadar';

// --- GLOBAL CONSTANTS & HELPERS (Defined outside component) ---

const SCENT_FAMILIES: Record<string, string[]> = {
  citrus: ['lemon', 'bergamot', 'orange', 'grapefruit', 'mandarin', 'lime', 'yuzu'],
  floral: ['rose', 'jasmine', 'lily', 'orchid', 'peony', 'lavender', 'tuberose'],
  woody: ['sandalwood', 'cedar', 'oak', 'patchouli', 'vetiver', 'oud', 'guaiac', 'pine'],
  spicy: ['pepper', 'cinnamon', 'clove', 'nutmeg', 'cardamom', 'ginger', 'saffron'],
  gourmand: ['vanilla', 'chocolate', 'caramel', 'coffee', 'honey', 'tonka', 'praline'],
  fresh: ['mint', 'green', 'aquatic', 'ozonic', 'marine', 'herbal', 'tea', 'sage'],
  oriental: ['amber', 'resin', 'incense', 'myrrh', 'labdanum', 'benzoin'],
  leather: ['leather', 'suede', 'tobacco', 'smoke', 'birch']
};

const getDominantFamily = (notes: string[]) => {
  const scores: Record<string, number> = {};
  notes.forEach(note => {
    for (const [family, keywords] of Object.entries(SCENT_FAMILIES)) {
      if (keywords.some(k => note.includes(k))) scores[family] = (scores[family] || 0) + 1;
    }
  });
  return Object.entries(scores).sort(([,a], [,b]) => b - a)[0]?.[0] || null;
};

const categorizeScentFamily = (notes: string[], vibes: string[]): string | null => {
  if (notes.includes('oud') || vibes.includes('oriental')) return 'oriental';
  if (notes.includes('rose') || notes.includes('jasmine') || vibes.includes('floral')) return 'floral';
  if (notes.some(n => ['citrus', 'bergamot', 'lemon'].includes(n)) || vibes.includes('fresh')) return 'fresh';
  if (notes.some(n => ['vanilla', 'amber'].includes(n)) || vibes.includes('gourmand')) return 'gourmand';
  if (notes.some(n => ['cedar', 'sandalwood', 'oakmoss'].includes(n)) || vibes.includes('woody')) return 'woody';
  return null;
};

const generateProfileFromVibes = (vibes: string[]) => {
  const profile = { fresh: 3, sweet: 3, spicy: 3, woody: 3, floral: 3 };
  if (!vibes || vibes.length === 0) return profile;

  const lowerVibes = vibes.map(v => v.toLowerCase());

  if (lowerVibes.some(v => v.includes('citrus') || v.includes('fresh') || v.includes('aquatic') || v.includes('blue'))) profile.fresh += 6;
  if (lowerVibes.some(v => v.includes('gourmand') || v.includes('vanilla') || v.includes('sweet') || v.includes('fruity'))) profile.sweet += 6;
  if (lowerVibes.some(v => v.includes('spicy') || v.includes('warm') || v.includes('oriental') || v.includes('amber'))) profile.spicy += 6;
  if (lowerVibes.some(v => v.includes('woody') || v.includes('earthy') || v.includes('mossy') || v.includes('leather'))) profile.woody += 6;
  if (lowerVibes.some(v => v.includes('floral') || v.includes('rose') || v.includes('white flower'))) profile.floral += 6;

  Object.keys(profile).forEach(k => {
    // @ts-ignore
    if (profile[k] > 10) profile[k] = 10;
  });

  return profile;
};

export default function PerfumeDetail() {
  const params = useParams();
  const router = useRouter();
  const [perfume, setPerfume] = useState<any>(null);
  const [relatedPerfumes, setRelatedPerfumes] = useState<any[]>([]);
  const [dupes, setDupes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inCollection, setInCollection] = useState(false);
  const { user, supabase } = useAuth();

  const getMatchDetails = (current: any, candidate: any) => {
    let score = 10;
    const reasons: string[] = [];

    if (current.vibe_tags && candidate.vibe_tags) {
      const sharedVibes = current.vibe_tags.filter((t: string) => candidate.vibe_tags.includes(t));
      score += (sharedVibes.length * 20);
      if (sharedVibes.length > 0) reasons.push("Vibe");
    }

    const currentNoteMap = new Map();
    current.perfume_notes?.forEach((pn: any) => {
      if (pn.note?.name) currentNoteMap.set(pn.note.name.toLowerCase(), pn.type);
    });

    let sharedBaseNotes = 0;
    let sharedHeartNotes = 0;

    if (candidate.perfume_notes) {
      candidate.perfume_notes.forEach((pn: any) => {
        const name = pn.note?.name?.toLowerCase();
        const type = pn.type;
        
        if (currentNoteMap.has(name)) {
          const originalType = currentNoteMap.get(name);
          if (type === 'Base' || originalType === 'Base') {
            score += 25;
            sharedBaseNotes++;
          } else if (type === 'Heart' || originalType === 'Heart') {
            score += 15;
            sharedHeartNotes++;
          } else {
            score += 5;
          }
        }
      });
    }

    const currentNotesList = current.perfume_notes?.map((n:any) => n.note?.name?.toLowerCase()) || [];
    const candidateNotesList = candidate.perfume_notes?.map((n:any) => n.note?.name?.toLowerCase()) || [];
    const currentFam = getDominantFamily(currentNotesList);
    const candidateFam = getDominantFamily(candidateNotesList);
    
    if (currentFam && candidateFam && currentFam === candidateFam) score += 15;

    if (current.best_season?.some((s: string) => candidate.best_season?.includes(s))) score += 5;
    if (current.brand?.name === candidate.brand?.name) score += 5;

    let reasonText = 'Similar vibe';
    if (sharedBaseNotes >= 2) reasonText = 'Similar dry-down DNA';
    else if (sharedHeartNotes >= 2) reasonText = 'Similar heart profile';
    else if (currentFam && currentFam === candidateFam) reasonText = `Matches ${currentFam} style`;

    return { score: Math.min(score, 99), reason: reasonText };
  };

  const findClientSideDupes = (mainPerfume: any, allPerfumes: any[]) => {
    if (!mainPerfume || !allPerfumes) return [];
    const mainNotesRaw = mainPerfume.perfume_notes?.map((n: any) => n.note?.name) || [];
    const mainNotesLower = mainNotesRaw.filter((n: string) => n != null && n.trim() !== '').map((n: string) => n.toLowerCase());
    const mainVibes = mainPerfume.vibe_tags || [];
    const mainFamily = categorizeScentFamily(mainNotesLower, mainVibes);

    return allPerfumes
      .filter((perfume: any) => {
        if (perfume.id === mainPerfume.id) return false;
        const candidateNotesRaw = perfume.perfume_notes?.map((n: any) => n.note?.name) || [];
        const candidateNotesLower = candidateNotesRaw.filter((n: string) => n != null && n.trim() !== '').map((n: string) => n.toLowerCase());
        const candidateVibes = perfume.vibe_tags || [];
        const candidateFamily = categorizeScentFamily(candidateNotesLower, candidateVibes);

        if (!mainFamily || !candidateFamily || mainFamily !== candidateFamily) return false;
        const totalMainNotes = mainNotesLower.length;
        if (totalMainNotes === 0) return false;
        const sharedCount = candidateNotesLower.filter((n: string) => mainNotesLower.includes(n)).length;
        return (sharedCount / totalMainNotes) * 100 >= 70;
      })
      .map((perfume: any) => {
         const candidateNotesRaw = perfume.perfume_notes?.map((n: any) => n.note?.name) || [];
         const candidateNotesLower = candidateNotesRaw.filter((n: string) => n != null && n.trim() !== '').map((n: string) => n.toLowerCase());
         const totalMainNotes = mainNotesLower.length;
         const sharedCount = candidateNotesLower.filter((n: string) => mainNotesLower.includes(n)).length;
         const matchPercentage = (sharedCount / totalMainNotes) * 100;
         const actualSharedNotes = Array.from(new Set(
           candidateNotesRaw.filter((n: string) => n != null && n.trim() !== '').filter((n: string) => mainNotesLower.includes(n.toLowerCase()))
         ));
         const sharedVibesCount = perfume.vibe_tags?.filter((t:string) => mainVibes.includes(t)).length || 0;
         const score = Math.min(98, Math.round(matchPercentage * 0.8) + (sharedVibesCount * 5));
         const isCheaper = perfume.price_tier && mainPerfume.price_tier && perfume.price_tier.length < mainPerfume.price_tier.length;

         return {
            dupe_id: perfume.id,
            dupe_name: perfume.name,
            dupe_image_url: perfume.image_url,
            brand_name: perfume.brand?.name,
            dupe_price_tier: perfume.price_tier,
            match_type: isCheaper ? 'Smart Buy' : 'DNA Match',
            match_score: score,
            shared_notes: actualSharedNotes,
            match_percentage: `${Math.round(matchPercentage)}%`
         };
      })
      .sort((a: any, b: any) => b.match_score - a.match_score)
      .slice(0, 3);
  };

  useEffect(() => {
    const checkCollection = async () => {
      if (!user || !perfume || !supabase) return;
      const { data } = await supabase.from('user_collections').select('id').eq('user_id', user.id).eq('perfume_id', perfume.id).maybeSingle();
      if (data) setInCollection(true);
    };
    checkCollection();
  }, [user, perfume, supabase]);

  const toggleCollection = async () => {
    if (!user) return router.push('/login');
    if (inCollection) {
      await supabase.from('user_collections').delete().eq('user_id', user.id).eq('perfume_id', perfume.id);
      setInCollection(false);
    } else {
      await supabase.from('user_collections').insert({ user_id: user.id, perfume_id: perfume.id });
      setInCollection(true);
    }
  };

  useEffect(() => {
    const id = params?.id;
    
    // 1. Reset state immediately on navigation (Fixes "stops loading" issue)
    setLoading(true);
    setPerfume(null);
    setRelatedPerfumes([]);
    setDupes([]);

    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: mainPerfume, error } = await supabase
          .from('perfumes')
          .select(`
            id, name, image_url, rating, vibe_tags,
            perfumer, price_tier, best_season, gender,
            longevity_rating, sillage_rating,
            scenario, scent_profile,
            olfactory_family,
            brand:brands!perfumes_brand_id_fkey(name),
            perfume_notes(type, note:notes(name, color_hex))
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
      
        if (mainPerfume) {
          if (!mainPerfume.scent_profile) {
            mainPerfume.scent_profile = generateProfileFromVibes(mainPerfume.vibe_tags || []);
          }
          setPerfume(mainPerfume);
        }

        if (!mainPerfume) {
          setLoading(false);
          return;
        }

        let query = supabase.from('perfumes').select(`
            id, name, image_url, price_tier, best_season, vibe_tags, gender,
            brand:brands!perfumes_brand_id_fkey(name),
            perfume_notes(type, note:notes(name))
          `)
          .neq('id', id)
          .limit(100);

        if (mainPerfume.vibe_tags && mainPerfume.vibe_tags.length > 0) {
           query = query.overlaps('vibe_tags', mainPerfume.vibe_tags);
        }

        const { data: allPerfumes, error: allPerfumesError } = await query;
        if (allPerfumesError) throw allPerfumesError;

        if (allPerfumes) {
          const mainNotesLower = mainPerfume.perfume_notes?.map((n: any) => n.note?.name?.toLowerCase()) || [];
          const recs = allPerfumes
            .filter((p: any) => p.vibe_tags?.some((t: string) => mainPerfume.vibe_tags.includes(t)))
            .map((p: any) => {
              const candidateNotes = p.perfume_notes?.map((n: any) => n.note?.name?.toLowerCase()) || [];
              const sharedNotes = candidateNotes.filter((n: string) => mainNotesLower.some((mainNote: string) => mainNote === n)).slice(0, 3);
              return { ...p, sharedNotes };
            })
            .sort((a: any, b: any) => getMatchDetails(mainPerfume, b).score - getMatchDetails(mainPerfume, a).score)
            .filter((p: any, index: number, self: any[]) => {
               const brandCount = self.slice(0, index).filter(prev => prev.brand?.name === p.brand?.name).length;
               return brandCount < 2;
            })
            .slice(0, 9);
          
          setRelatedPerfumes(recs);
          setDupes(findClientSideDupes(mainPerfume, allPerfumes));
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.id, supabase]);

  useEffect(() => { window.scrollTo(0, 0); }, [params?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-gray-500">Loading essence...</div>;
  if (!perfume) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">Perfume not found.</div>;

  return (
    <div className="min-h-screen bg-white text-gray-800 pb-20 font-sans selection:bg-stone-900 selection:text-white">
      <div className="px-6 py-4 sticky top-16 bg-white/90 backdrop-blur-md z-20 flex justify-between items-center border-b border-stone-200">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest hover:opacity-60 transition">← Collection</Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Perfume Intuition</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 mt-10 mb-16">
        <div className="h-[500px] flex items-center justify-center relative p-0">
          {perfume.image_url ? (
            <img src={perfume.image_url} alt={perfume.name} className="h-full w-full object-contain mix-blend-multiply drop-shadow-xl" />
          ) : <span className="text-stone-300 font-serif italic">No Image</span>}
          <div className="absolute top-0 right-0">
            <span className="bg-stone-900 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest">{perfume.price_tier || '$$$'}</span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3 justify-between">
              <Link
                href={`/brands/${encodeURIComponent(perfume.brand?.name || '')}`}
                className="uppercase text-xs font-bold tracking-[0.2em] text-stone-500 hover:text-stone-700 transition-colors">
                {perfume.brand?.name}
              </Link>
              
              <div className="flex gap-2">
                <button
                  onClick={toggleCollection}
                  className={`text-[10px] uppercase px-4 py-2 rounded-full transition border ${inCollection ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 hover:bg-stone-50 text-stone-600'}`}
                >
                  {inCollection ? 'In Wardrobe ✓' : '+ Add to Shelf'}
                </button>
                <button onClick={() => router.push(`/compare?a=${perfume.id}`)} className="border border-stone-300 text-[10px] uppercase px-4 py-2 rounded-full hover:bg-stone-900 hover:text-white transition">Compare</button>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-medium text-stone-900 mb-4 leading-tight">{perfume.name}</h1>
            {perfume.perfumer && (
              <p className="text-sm text-stone-500 italic">Created by <Link href={`/creators/${encodeURIComponent(perfume.perfumer)}`} className="hover:text-stone-700 transition-colors">{perfume.perfumer}</Link></p>
            )}
          </div>

          {perfume.scenario && (
            <div className="mb-8 p-6 bg-stone-50 rounded-xl border border-stone-100">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">The Vibe</h4>
               <p className="font-serif text-xl italic text-stone-800 leading-relaxed">"{perfume.scenario}"</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {Array.isArray(perfume.vibe_tags) && perfume.vibe_tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 border border-stone-200 text-[10px] uppercase tracking-wide rounded-full text-stone-600">{tag}</span>
            ))}
          </div>

          {perfume.olfactory_family && perfume.olfactory_family.length > 0 && (
            <div className="mt-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Olfactory Family</h4>
              <div className="flex flex-wrap gap-2">
                {perfume.olfactory_family.map((fam: string) => (
                  <span key={fam} className="px-3 py-1 bg-stone-800 text-white text-[10px] uppercase tracking-wide rounded-full border border-stone-800">{fam}</span>
                ))}
              </div>
            </div>
          )}

          {perfume.gender && (
            <div className="mt-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Gender</h4>
              <span className="px-4 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-full border border-stone-200">{perfume.gender}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mb-20">
        <div className="bg-stone-50 rounded-3xl p-10 grid lg:grid-cols-12 gap-12 border border-stone-100">
          <div className="lg:col-span-4 space-y-10 border-b lg:border-b-0 lg:border-r border-stone-200 pb-10 lg:pb-0 lg:pr-10">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Best Season</h4>
              <div className="grid grid-cols-2 gap-2">
                {['Spring', 'Summer', 'Fall', 'Winter'].map(season => {
                  const isActive = perfume.best_season?.includes(season);
                  return <div key={season} className={`text-center text-xs py-2 rounded-lg border ${isActive ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-300 border-stone-200'}`}>{season}</div>
                })}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Longevity</h4>
              <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-stone-800" style={{ width: `${(perfume.longevity_rating / 5) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-right text-stone-500 mt-1">{perfume.longevity_rating}/5</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Sillage</h4>
              <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-stone-500" style={{ width: `${(perfume.sillage_rating / 5) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-right text-stone-500 mt-1">{perfume.sillage_rating}/5</p>
            </div>
            <div className="pt-8 border-t border-stone-200 mt-8">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Olfactory Profile</h4>
              <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-sm">
                <ScentRadar profile={(perfume.scent_profile && Object.keys(perfume.scent_profile).length > 0) ? perfume.scent_profile : { fresh: 5, sweet: 5, spicy: 5, woody: 5, floral: 5 }} />
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 pl-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6">Olfactory Composition</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Top', 'Heart', 'Base'].map((type) => {
                const notes = perfume.perfume_notes?.filter((n: any) => n.type === type) || [];
                return (
                  <div key={type} className="bg-white rounded-2xl p-6 border border-stone-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 flex items-center justify-center bg-stone-900 rounded-full"><span className="text-xs font-bold text-white">{type[0]}</span></div>
                      <h5 className="text-sm font-bold uppercase tracking-widest text-stone-900">{type} Notes</h5>
                    </div>
                    {notes.length > 0 ? (
                      <div className="space-y-2">
                        {notes.map((n: any) => (
                          <Link key={n.note.name} href={`/ingredients/${encodeURIComponent(n.note.name)}`} className="flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-xl hover:bg-stone-100 transition">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: n.note.color_hex }}></span>
                            <span className="text-sm text-stone-700 font-medium">{n.note.name}</span>
                          </Link>
                        ))}
                      </div>
                    ) : <div className="text-sm text-stone-400 italic">No {type.toLowerCase()} notes listed</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {dupes.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 mt-20 mb-20">
          <div className="flex items-baseline justify-between mb-8 border-b border-stone-200 pb-4">
            <h3 className="font-serif text-2xl text-stone-900">Alternative Options</h3>
            <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">Based on Scent DNA (3+ Matches)</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {dupes.map((d: any) => {
              const isCheaper = d.match_type === 'Smart Buy';
              const badgeClass = isCheaper ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-600 border-stone-200';
              return (
                <div key={d.dupe_id} className="group bg-white rounded-2xl p-5 border border-stone-200 hover:border-stone-400 hover:shadow-lg transition-all duration-500 flex flex-col relative">
                   <div className="flex justify-between items-start mb-4">
                     <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase truncate pr-2">{d.brand_name}</span>
                     <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${badgeClass}`}>{d.match_type}</span>
                   </div>
                   <div className="h-48 mb-6 flex items-center justify-center p-4 bg-stone-50/50 rounded-xl group-hover:bg-stone-50 transition-colors">
                      {d.dupe_image_url ? <img src={d.dupe_image_url} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700" alt={d.dupe_name} /> : <span className="text-xs text-stone-300">No Image</span>}
                   </div>
                   <div className="mb-6 flex-grow">
                     <h4 className="font-serif text-xl text-stone-900 leading-tight mb-2">{d.dupe_name}</h4>
                     {isCheaper && perfume.price_tier && (
                       <div className="flex items-center gap-2 text-xs mb-3">
                          <span className="text-stone-300 line-through decoration-stone-300">{perfume.price_tier}</span>
                          <span className="text-stone-400">→</span>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{d.dupe_price_tier}</span>
                       </div>
                     )}
                     <div className="flex flex-wrap gap-1.5">
                       {d.shared_notes?.map((note: string) => <span key={note} className="text-[9px] px-2 py-1 bg-stone-100 text-stone-600 rounded-md border border-stone-200 uppercase tracking-wide">{note}</span>)}
                     </div>
                   </div>
                   <button onClick={() => router.push(`/compare?a=${perfume.id}&b=${d.dupe_id}`)} className="w-full py-3 rounded-xl border border-stone-200 text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all flex items-center justify-center gap-2"><span>Compare Specs</span><span className="text-lg leading-none">→</span></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {relatedPerfumes.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 mt-24">
          <h3 className="font-serif text-2xl text-stone-900 mb-8 border-b border-stone-200 pb-4">You Might Also Like</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPerfumes.map((p) => (
              <div key={p.id} className="group relative bg-white rounded-xl p-4 border border-transparent hover:border-stone-100 hover:shadow-lg transition">
                <button onClick={() => router.push(`/compare?a=${perfume.id}&b=${p.id}`)} className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full border border-stone-200 text-stone-400 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all" title="Compare with this perfume"><span className="text-xs font-bold">↔</span></button>
                <Link href={`/perfume/${p.id}`}>
                  <div className="flex justify-between items-start mb-4"><span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase truncate">{p.brand?.name}</span></div>
                  <div className="h-40 mb-4 overflow-hidden flex items-center justify-center p-2">
                    {p.image_url ? <img src={p.image_url} className="h-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700" /> : <div className="text-stone-300 text-xs">No Image</div>}
                  </div>
                  <div>
                    <div className="font-serif text-lg text-stone-900 leading-tight mb-1 group-hover:text-stone-600 transition truncate">{p.name}</div>
                    {p.sharedNotes && p.sharedNotes.length > 0 ? <div className="text-xs text-stone-500 truncate">DNA: {p.sharedNotes.join(', ')}</div> : <div className="text-xs text-stone-400 italic truncate">Similar Vibe</div>}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <CommentsSection perfumeId={perfume.id} />
    </div>
  );
}