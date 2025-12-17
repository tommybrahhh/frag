'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CommentsSection from '@/components/CommentsSection';
import ScentRadar from '@/components/ScentRadar';
import { Database } from '@/types/database';

type Note = {
  name: string;
  color_hex?: string;
};

type PerfumeNote = {
  type: string;
  note: Note;
};

type Brand = {
  name: string;
};

type Perfume = Database['public']['Tables']['perfumes']['Row'] & {
  brand?: Brand;
  perfume_notes?: PerfumeNote[];
  scent_profile?: Record<string, number>;
  perfumer?: string;
  scenario?: string;
  olfactory_family?: string[];
  longevity_rating?: number;
  sillage_rating?: number;
  sharedNotes?: string[];
};

type Dupe = {
  dupe_id: string;
  dupe_name: string;
  dupe_image_url?: string;
  brand_name?: string;
  dupe_price_tier?: string;
  match_type: string;
  match_score: number;
  shared_notes: string[];
  match_percentage: string;
};

interface PerfumeClientViewProps {
  perfume: Perfume;
  relatedPerfumes: Perfume[];
  dupes: Dupe[];
}

export default function PerfumeClientView({ perfume, relatedPerfumes, dupes }: PerfumeClientViewProps) {
  const router = useRouter();
  const { user, supabase } = useAuth();
  const [inCollection, setInCollection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial collection status
  useEffect(() => {
    const checkCollection = async () => {
      if (!user || !perfume || !supabase) {
        setInCollection(false);
        return;
      }
      
      const { data } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('perfume_id', perfume.id)
        .maybeSingle();
      
      setInCollection(!!data);
    };
    checkCollection();
  }, [user, perfume, supabase]);

  const toggleCollection = async () => {
    if (!user) return router.push('/login');
    if (!perfume) return;

    try {
      if (inCollection) {
        const { error: deleteError } = await supabase
          .from('user_collections')
          .delete()
          .eq('user_id', user.id)
          .eq('perfume_id', perfume.id);
        
        if (deleteError) throw deleteError;
        setInCollection(false);
      } else {
        const { error: insertError } = await supabase
          .from('user_collections')
          .insert({
            user_id: user.id,
            perfume_id: perfume.id,
            created_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
        setInCollection(true);
      }
    } catch (error) {
      console.error("Collection update error:", error);
      setError('Failed to update collection. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 pb-20 font-sans selection:bg-stone-900 selection:text-white">
      <div className="px-6 py-4 sticky top-16 bg-white/90 backdrop-blur-md z-20 flex justify-between items-center border-b border-stone-200">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest hover:opacity-60 transition">← Collection</Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Scentia</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 mt-10 mb-16">
        <div
          className="h-[500px] flex items-center justify-center relative p-0 cursor-pointer"
          onClick={() => router.push(`/perfume/${perfume.id}`)}
        >
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
                <div className="h-full bg-stone-800" style={{ width: `${((perfume.longevity_rating || 0) / 5) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-right text-stone-500 mt-1">{perfume.longevity_rating}/5</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Sillage</h4>
              <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-stone-500" style={{ width: `${((perfume.sillage_rating || 0) / 5) * 100}%` }}></div>
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
