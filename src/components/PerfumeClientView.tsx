'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CommentsSection from '@/components/CommentsSection';
import ScentRadar from '@/components/ScentRadar';
import { Database } from '@/types/database';

type Note = {
  name: string;
  color_hex?: string;
  description?: string;
};

type PerfumeNote = {
  type: string;
  note: Note;
};

type Brand = {
  name: string;
  tier?: string;
};

type Perfume = Database['public']['Tables']['perfumes']['Row'] & {
  brand?: Brand;
  perfume_notes?: PerfumeNote[];
  scent_profile?: Record<string, number>;
  perfumer?: string;
  scenario?: string;
  olfactory_family?: string[];
  longevity_rating?: number | null;
  sillage_rating?: number | null;
  sharedNotes?: string[];
  release_year?: number | null;
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

import { RecommendationCategory } from '@/lib/recommendation-engine';

interface PerfumeClientViewProps {
  perfume: Perfume;
  recommendationCategories: RecommendationCategory[];
  dupes: Dupe[];
}

export default function PerfumeClientView({ perfume, recommendationCategories, dupes }: PerfumeClientViewProps) {
  const router = useRouter();
  const { user, supabase } = useAuth();
  const [inCollection, setInCollection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // New loading state for the button
  
  // Micro-Interaction States
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [visibleSimilarCount, setVisibleSimilarCount] = useState(6); // State for "Show More" in Direct Alternatives

  // Parallax Effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        // Simple parallax: move image down slower than scroll
        heroRef.current.style.transform = `translateY(${scrolled * 0.1}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check initial collection status
  useEffect(() => {
    const checkCollection = async () => {
      setError(null); // Clear previous errors on ID change
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
    if (!user || !supabase) {
      router.push('/login');
      return;
    }
    if (!perfume) return;

    const previousState = inCollection;
    setInCollection(!previousState); // Optimistic update
    setIsSubmitting(true);
    setError(null);

    try {
      if (previousState) {
        // Was in collection, so remove it
        const { error: deleteError } = await supabase
          .from('user_collections')
          .delete()
          .eq('user_id', user.id)
          .eq('perfume_id', perfume.id);
        
        if (deleteError) throw deleteError;
      } else {
        // Was not in collection, so add it
        const { error: insertError } = await supabase
          .from('user_collections')
          .insert({
            user_id: user.id,
            perfume_id: perfume.id,
            created_at: new Date().toISOString()
          });
        
        // Handle "Unique violation" (code 23505) gracefully
        // If it's already there, we treat it as success and keep the UI as "In Collection"
        if (insertError) {
             if (insertError.code === '23505') {
                 console.warn("Item already in collection (race condition handled).");
                 // Do NOT revert state, keep it as true
                 return;
             }
             throw insertError;
        }
      }
    } catch (err: any) {
      console.error("Collection update error:", err);
      setInCollection(previousState); // Revert on actual error
      setError(err.message || 'Failed to update collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] pb-20 font-sans selection:bg-[#1C1917] selection:text-[#FAFAF9]">
      <div className="px-6 py-4 sticky top-0 bg-[#FAFAF9]/90 backdrop-blur-md z-30 flex justify-between items-center border-b border-[#E7E5E4]">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest text-[#57534E] hover:text-[#1C1917] transition-colors">← Collection</Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A8A29E]">Scentia</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[3fr_2fr] gap-24 mt-10 mb-16 items-center">
        {/* Hero Image Section */}
        <div ref={heroRef} className="h-[600px] flex items-center justify-center relative bg-stone-50 rounded-[3rem] p-12 group will-change-transform">
          {perfume.image_url ? (
            <>
              <img 
                src={perfume.image_url} 
                alt={perfume.name} 
                className="relative z-10 h-full w-full object-contain mix-blend-multiply brightness-[1.05] transition-transform duration-700 group-hover:scale-105" 
              />
            </>
          ) : (
            <span className="text-[#A8A29E] font-serif italic text-xl">No Image</span>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 justify-between">
              <Link
                href={`/brands/${encodeURIComponent(perfume.brand?.name || '')}`}
                className="uppercase text-xs font-bold tracking-[0.2em] text-[#A8A29E] hover:text-[#57534E] transition-colors">
                {perfume.brand?.name}
              </Link>
              
              <div className="flex gap-2 flex-wrap"> 
                <button
                  onClick={toggleCollection}
                  disabled={isSubmitting} 
                  className={`text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all border ${
                    inCollection 
                      ? 'bg-transparent border-[#1C1917] text-[#1C1917]' 
                      : 'bg-[#1C1917] border-[#1C1917] text-[#FAFAF9] hover:bg-[#292524]'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (inCollection ? 'Adding...' : 'Removing...') : (inCollection ? 'In Wardrobe' : 'Add to Shelf')}
                </button>
                <button onClick={() => router.push(`/compare?a=${perfume.id}`)} className="bg-transparent border border-[#A8A29E] text-[#57534E] text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full hover:border-[#1C1917] hover:text-[#1C1917] transition-all">Compare</button>
              </div>
            </div>
            {error && ( 
              <div className="text-[#1C1917] text-xs mt-2 p-2 bg-[#E7E5E4] border border-[#D6D3D1] rounded-lg">
                {error}
              </div>
            )}
            <h1 className="text-5xl md:text-6xl font-serif font-medium text-[#1C1917] mb-4 leading-tight">{perfume.name}</h1>
            {perfume.perfumer && (
              <p className="text-sm text-[#78716C] italic">Created by <Link href={`/creators/${encodeURIComponent(perfume.perfumer)}`} className="hover:text-[#1C1917] transition-colors decoration-1 underline-offset-4 hover:underline">{perfume.perfumer}</Link></p>
            )}
          </div>

          {perfume.scenario && (
            <div className="mb-10 pl-6 border-l-2 border-[#E7E5E4]">
               <h4 className="text-[9px] font-bold uppercase tracking-widest text-[#A8A29E] mb-2">The Vibe</h4>
               <p className="font-serif text-xl italic text-[#44403C] leading-relaxed">"{perfume.scenario}"</p>
            </div>
          )}

          {/* Unified Specifications Ticker - Ghost Style */}
          <div className="flex flex-wrap gap-3 mt-4">
            {/* Price Tier */}
            <div className="px-4 py-2 border border-[#E7E5E4] rounded-full flex items-center gap-2 bg-transparent">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#A8A29E]">Price</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1C1917]">{perfume.price_tier || '$$$'}</span>
            </div>

            {/* Tier */}
            {perfume.brand?.tier && (
              <Link href={`/?tier=${encodeURIComponent(perfume.brand.tier)}`} className="px-4 py-2 border border-[#E7E5E4] rounded-full flex items-center gap-2 bg-transparent hover:border-[#A8A29E] transition-colors cursor-pointer">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#A8A29E]">Type</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1C1917]">{perfume.brand.tier}</span>
              </Link>
            )}
            
            {/* Year */}
            {perfume.release_year && (
              <Link href={`/?year=${encodeURIComponent(perfume.release_year.toString())}`} className="px-4 py-2 border border-[#E7E5E4] rounded-full flex items-center gap-2 bg-transparent hover:border-[#A8A29E] transition-colors cursor-pointer">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#A8A29E]">Year</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1C1917]">{perfume.release_year}</span>
              </Link>
            )}

            {perfume.gender && (
              <Link href={`/?gender=${encodeURIComponent(perfume.gender)}`} className="px-4 py-2 border border-[#E7E5E4] rounded-full flex items-center gap-2 bg-transparent hover:border-[#A8A29E] transition-colors cursor-pointer">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#A8A29E]">Gender</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1C1917]">{perfume.gender}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mb-20">
        {/* Dashboard Container */}
        <div className="bg-white/90 backdrop-blur-md rounded-[32px] p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-white grid lg:grid-cols-[320px_1fr] gap-12 relative overflow-hidden">
          
          {/* LEFT COLUMN: Stats & Data */}
          <div className="space-y-10">

            {/* 1. Olfactory Family */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Olfactory Profile</h4>
              <div className="flex flex-wrap gap-2">
                {perfume.olfactory_family?.map(fam => (
                  <span key={fam} className="inline-block px-4 py-2 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg">
                    {fam}
                  </span>
                )) || <span className="text-stone-400 text-sm italic">Unspecified</span>}
              </div>
            </div>
            
            {/* 2. Context (Season & Time) */}
            <div>
              <h4 className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4 pb-2 border-b border-stone-100">
                Context
                <span className="flex-1 h-px bg-stone-100"></span>
              </h4>
              
              <div className="grid grid-cols-2 gap-8">
                {/* Seasons */}
                <div>
                  <span className="block text-[9px] font-bold text-stone-400 uppercase mb-2">Best Season</span>
                  <div className="flex gap-2">
                    {[
                      { name: 'Spring', icon: '🌱', active: perfume.best_season?.includes('Spring') },
                      { name: 'Summer', icon: '☀️', active: perfume.best_season?.includes('Summer') },
                      { name: 'Fall', icon: '🍂', active: perfume.best_season?.includes('Fall') },
                      { name: 'Winter', icon: '❄️', active: perfume.best_season?.includes('Winter') }
                    ].map(s => (
                      <div 
                        key={s.name}
                        title={s.name}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm border transition-all ${
                          s.active 
                            ? 'bg-stone-900 text-white border-stone-900' 
                            : 'bg-white text-stone-300 border-stone-100 opacity-50'
                        }`}
                      >
                        {s.icon}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <div>
                  <span className="block text-[9px] font-bold text-stone-400 uppercase mb-2">Best Time</span>
                  <div className="flex gap-2">
                     <div 
                        title="Day"
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm border transition-all ${
                          !perfume.best_time || perfume.best_time === 'Day' || perfume.best_time === 'All Day'
                            ? 'bg-stone-900 text-white border-stone-900' 
                            : 'bg-white text-stone-300 border-stone-100 opacity-50'
                        }`}
                      >
                        ☀️
                      </div>
                      <div 
                        title="Night"
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm border transition-all ${
                          perfume.best_time === 'Night' || perfume.best_time === 'All Day'
                            ? 'bg-stone-900 text-white border-stone-900' 
                            : 'bg-white text-stone-300 border-stone-100 opacity-50'
                        }`}
                      >
                        🌙
                      </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Performance (Bars) */}
            <div>
              <h4 className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4 pb-2 border-b border-stone-100">
                Performance
                <span className="flex-1 h-px bg-stone-100"></span>
              </h4>
              
              <div className="space-y-6">
                {/* Longevity */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Longevity</span>
                    <span className="text-xs font-serif italic text-stone-900">
                      {perfume.longevity_rating ? 
                        ['Intimate', 'Weak', 'Moderate', 'Long Lasting', 'Eternal'][Math.min(4, Math.max(0, Math.round(perfume.longevity_rating) - 1))] 
                        : 'Moderate'}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    {[1, 2, 3, 4, 5].map(step => (
                      <div 
                        key={step} 
                        className={`flex-1 rounded-full transition-all duration-1000 ${
                          (perfume.longevity_rating || 0) >= step 
                            ? 'bg-stone-800' 
                            : 'bg-stone-100'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                {/* Sillage */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Sillage</span>
                    <span className="text-xs font-serif italic text-stone-900">
                      {perfume.sillage_rating ? 
                        ['Skin Scent', 'Intimate', 'Moderate', 'Strong', 'Enormous'][Math.min(4, Math.max(0, Math.round(perfume.sillage_rating) - 1))] 
                        : 'Moderate'}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    {[1, 2, 3, 4, 5].map(step => (
                      <div 
                        key={step} 
                        className={`flex-1 rounded-full transition-all duration-1000 ${
                          (perfume.sillage_rating || 0) >= step 
                            ? 'bg-stone-800' 
                            : 'bg-stone-100'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Radar Chart */}
            <div>
              <h4 className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 pb-2 border-b border-stone-100">
                Scent DNA
                <span className="flex-1 h-px bg-stone-100"></span>
              </h4>
              <div className="-ml-4 -mt-4">
                <ScentRadar profile={(perfume.scent_profile && Object.keys(perfume.scent_profile).length > 0) ? perfume.scent_profile : { fresh: 5, sweet: 5, spicy: 5, woody: 5, floral: 5 }} />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Visual Composition Timeline */}
          <div className="relative flex flex-col">
            
            {/* Timeline Line (Centered on Desktop, Left on Mobile) */}
            <div className="absolute left-6 md:left-1/2 top-20 bottom-10 w-px bg-gradient-to-b from-[#C5A028] to-transparent/20 md:-translate-x-1/2 z-0"></div>

            {/* Bottle Icon (Desktop Only) */}
            <div className="hidden md:flex justify-center mb-10 relative z-10">
               <div className="w-16 h-20 border border-[#C5A028] rounded-t-full rounded-b-xl bg-white shadow-sm flex items-center justify-center relative">
                 <div className="w-8 h-10 border border-[#C5A028]/30 rounded-t-full rounded-b-md"></div>
                 <div className="absolute -top-3 w-4 h-3 bg-white border border-[#C5A028] rounded-sm"></div>
               </div>
            </div>

            <div className="space-y-8 pl-12 md:pl-0">
               {/* Top Notes */}
               <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all relative z-10 group">
                 <div className="absolute top-8 -left-[30px] md:left-1/2 md:-top-1.5 md:left-1/2 md:-translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-[#C5A028] rounded-full z-20"></div>
                 <div className="text-left md:text-center mb-4">
                   <h5 className="text-lg font-semibold text-stone-800">Top Notes</h5>
                   <span className="text-[10px] uppercase tracking-widest text-stone-900 font-bold block mt-1">First 15 Minutes</span>
                 </div>
                  <div className="flex flex-wrap justify-start md:justify-center gap-2">
                    {perfume.perfume_notes?.filter(n => n.type === 'Top').map(n => (
                      <div key={n.note.name} className="relative">
                        <button
                          onClick={() => setActiveNote(activeNote === n.note.name ? null : n.note.name)}
                          className={`flex items-center gap-2 border rounded-full px-4 py-2 text-sm transition-colors ${activeNote === n.note.name ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400'}`}
                        >
                            <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: n.note.color_hex || '#ddd' }}></span>
                            {n.note.name}
                        </button>
                        {activeNote === n.note.name && (
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs p-4 rounded-xl shadow-2xl w-56 text-center z-50 animate-in fade-in zoom-in-95 duration-200">
                                <p className="mb-3 font-serif leading-relaxed">{n.note.description || "A defining aromatic note in this composition."}</p>
                                <Link href={`/ingredients/${encodeURIComponent(n.note.name)}`} className="inline-block uppercase font-bold tracking-widest text-[9px] text-[#A8A29E] hover:text-white border-b border-stone-700 hover:border-white pb-0.5 transition-colors">
                                    Explore Ingredient
                                </Link>
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45"></div>
                            </div>
                        )}
                      </div>
                    ))}
                    {(!perfume.perfume_notes?.some(n => n.type === 'Top')) && <span className="text-stone-300 text-sm italic">No top notes</span>}
                  </div>               </div>

               {/* Heart Notes */}
               <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all relative z-10 group">
                 <div className="absolute top-8 -left-[30px] md:left-1/2 md:-top-1.5 md:left-1/2 md:-translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-[#C5A028] rounded-full z-20"></div>
                 <div className="text-left md:text-center mb-4">
                   <h5 className="text-lg font-semibold text-stone-800">Heart Notes</h5>
                   <span className="text-[10px] uppercase tracking-widest text-stone-900 font-bold block mt-1">30-60 Minutes</span>
                 </div>
                  <div className="flex flex-wrap justify-start md:justify-center gap-2">
                    {perfume.perfume_notes?.filter(n => n.type === 'Heart').map(n => (
                      <div key={n.note.name} className="relative">
                        <button
                          onClick={() => setActiveNote(activeNote === n.note.name ? null : n.note.name)}
                          className={`flex items-center gap-2 border rounded-full px-4 py-2 text-sm transition-colors ${activeNote === n.note.name ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400'}`}
                        >
                            <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: n.note.color_hex || '#ddd' }}></span>
                            {n.note.name}
                        </button>
                        {activeNote === n.note.name && (
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs p-4 rounded-xl shadow-2xl w-56 text-center z-50 animate-in fade-in zoom-in-95 duration-200">
                                <p className="mb-3 font-serif leading-relaxed">{n.note.description || "The core character of the fragrance."}</p>
                                <Link href={`/ingredients/${encodeURIComponent(n.note.name)}`} className="inline-block uppercase font-bold tracking-widest text-[9px] text-[#A8A29E] hover:text-white border-b border-stone-700 hover:border-white pb-0.5 transition-colors">
                                    Explore Ingredient
                                </Link>
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45"></div>
                            </div>
                        )}
                      </div>
                    ))}
                    {(!perfume.perfume_notes?.some(n => n.type === 'Heart')) && <span className="text-stone-300 text-sm italic">No heart notes</span>}
                  </div>               </div>

               {/* Base Notes */}
               <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all relative z-10 group">
                 <div className="absolute top-8 -left-[30px] md:left-1/2 md:-top-1.5 md:left-1/2 md:-translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-[#C5A028] rounded-full z-20"></div>
                 <div className="text-left md:text-center mb-4">
                   <h5 className="text-lg font-semibold text-stone-800">Base Notes</h5>
                   <span className="text-[10px] uppercase tracking-widest text-stone-900 font-bold block mt-1">Lasts 6+ Hours</span>
                 </div>
                  <div className="flex flex-wrap justify-start md:justify-center gap-2">
                    {perfume.perfume_notes?.filter(n => n.type === 'Base').map(n => (
                      <div key={n.note.name} className="relative">
                        <button
                          onClick={() => setActiveNote(activeNote === n.note.name ? null : n.note.name)}
                          className={`flex items-center gap-2 border rounded-full px-4 py-2 text-sm transition-colors ${activeNote === n.note.name ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400'}`}
                        >
                            <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: n.note.color_hex || '#ddd' }}></span>
                            {n.note.name}
                        </button>
                        {activeNote === n.note.name && (
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs p-4 rounded-xl shadow-2xl w-56 text-center z-50 animate-in fade-in zoom-in-95 duration-200">
                                <p className="mb-3 font-serif leading-relaxed">{n.note.description || "The lasting foundation of the scent."}</p>
                                <Link href={`/ingredients/${encodeURIComponent(n.note.name)}`} className="inline-block uppercase font-bold tracking-widest text-[9px] text-[#A8A29E] hover:text-white border-b border-stone-700 hover:border-white pb-0.5 transition-colors">
                                    Explore Ingredient
                                </Link>
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45"></div>
                            </div>
                        )}
                      </div>
                    ))}
                    {(!perfume.perfume_notes?.some(n => n.type === 'Base')) && <span className="text-stone-300 text-sm italic">No base notes</span>}
                  </div>               </div>

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

      {/* 3 EDUCATIONAL MODULES */}
      <div className="max-w-6xl mx-auto px-6 mt-24 mb-20 space-y-24">
        
        {/* MODULE A: The Direct Alternatives */}
        {(() => {
          const similarRecommendations = recommendationCategories.find(c => c.type === 'similar')?.recommendations || [];
          if (similarRecommendations.length === 0) return null;

          return (
            <section>
              <div className="mb-8 border-b border-stone-100 pb-4">
                <h3 className="font-serif text-2xl text-stone-900 mb-2">The Direct Alternatives</h3>
                <p className="text-stone-500 text-sm">If you love the {perfume.olfactory_family?.[0] || 'scent'} structure...</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {similarRecommendations.slice(0, visibleSimilarCount).map((rec) => (
                  <div key={rec.perfume.id} className="group cursor-pointer" onClick={() => router.push(`/perfume/${rec.perfume.id}`)}>
                    <div className="relative h-[320px] bg-stone-50 rounded-2xl mb-4 flex items-center justify-center p-6 transition-colors group-hover:bg-[#F0F0F0]">
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-full border border-stone-100 shadow-sm z-10">
                        <span className="text-[10px] font-bold text-stone-900 tabular-nums">{rec.score}% Match</span>
                      </div>
                      {rec.perfume.image_url ? (
                        <img src={rec.perfume.image_url} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-700" alt={rec.perfume.name} />
                      ) : (
                        <span className="text-stone-300 text-xs">No Image</span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1">{rec.perfume.brand?.name}</div>
                      <h4 className="font-serif text-lg text-stone-900 group-hover:text-stone-600 transition">{rec.perfume.name}</h4>
                      <p className="text-xs text-stone-500 mt-1">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>

              {visibleSimilarCount < similarRecommendations.length && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setVisibleSimilarCount(prev => prev + 6)}
                    className="group flex items-center gap-2 px-8 py-3 bg-white border border-stone-200 text-stone-500 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all"
                  >
                    Show More Alternatives
                    <svg className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                </div>
              )}
            </section>
          );
        })()}

        {/* MODULE B: The Layering Experiment */}
        {recommendationCategories.find(c => c.type === 'complementary') && (
          <section className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="font-serif text-3xl md:text-4xl text-stone-900">The Layering Experiment</h3>
              <p className="text-stone-500 mt-2">Unlock new olfactory dimensions</p>
            </div>

            <div className="space-y-8">
              {recommendationCategories.find(c => c.type === 'complementary')?.recommendations.slice(0, 2).map((rec, i) => (
                <div key={rec.perfume.id} className="w-full bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-xl text-stone-800">
                  {/* Header */}
                  <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="text-stone-400 text-sm font-mono tracking-widest uppercase">The Alchemy Lab</h3>
                    <span className="text-emerald-600 text-xs font-bold px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">{rec.score}% Harmony Score</span>
                  </div>

                  <div className="flex flex-col md:flex-row">
                    
                    {/* Left: The Visual Equation (35% Width) */}
                    <div className="w-full md:w-[35%] bg-gradient-to-br from-stone-50 to-stone-100 p-8 flex flex-col justify-center items-center border-r border-stone-100 relative">
                      <div className="flex items-center gap-4">
                        {/* Base Perfume */}
                        <div className="flex flex-col items-center">
                          <div className="h-24 w-16 relative flex items-center justify-center bg-white rounded-xl shadow-sm p-2">
                             {perfume.image_url ? (
                               <img src={perfume.image_url} className="h-full w-full object-contain mix-blend-multiply opacity-90" alt="Base" />
                             ) : <div className="w-10 h-16 bg-stone-200 rounded" />}
                          </div>
                          <span className="mt-3 text-[9px] font-bold tracking-wider text-stone-400 uppercase">Base</span>
                        </div>
                        
                        <span className="text-stone-300 text-2xl font-light">+</span>
                        
                        {/* Top Perfume */}
                        <div className="flex flex-col items-center cursor-pointer group/bottle" onClick={() => router.push(`/perfume/${rec.perfume.id}`)}>
                          <div className="h-24 w-16 relative flex items-center justify-center bg-white rounded-xl shadow-sm p-2 transition-transform group-hover/bottle:-translate-y-1">
                             {rec.perfume.image_url ? (
                               <img src={rec.perfume.image_url} className="h-full w-full object-contain mix-blend-multiply group-hover/bottle:scale-110 transition duration-500" alt="Top" />
                             ) : <div className="w-10 h-16 bg-stone-200 rounded" />}
                          </div>
                          <span className="mt-3 text-[9px] font-bold tracking-wider text-[#C5A028] uppercase">Layer</span>
                        </div>
                      </div>
                      
                      {/* Resulting Vibes */}
                      {rec.sharedVibes && rec.sharedVibes.length > 0 && (
                        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                           {rec.sharedVibes.map(vibe => (
                             <span key={vibe} className="px-2 py-1 bg-white/80 border border-stone-200 rounded-md text-[9px] uppercase tracking-wide font-bold text-stone-600 shadow-sm">
                               {vibe}
                             </span>
                           ))}
                        </div>
                      )}
                    </div>

                    {/* Right: The Education (65% Width) */}
                    <div className="w-full md:w-[65%] p-8 flex flex-col justify-center text-left">
                      
                      {/* 1. The Title */}
                      <h2 className="text-2xl font-serif text-stone-900 mb-2">
                        The {perfume.olfactory_family?.[0] || 'Base'}-{rec.perfume.olfactory_family?.[0] || 'Top'} Union
                      </h2>
                      
                      {/* 2. The Explanation */}
                      <p className="text-stone-600 text-sm leading-relaxed mb-6 italic">
                        "{rec.reason}"
                      </p>

                      {/* 3. The Actionable Guidance (The "Lab Tip") */}
                      <div className="flex items-start bg-stone-50 border border-stone-100 rounded-xl p-5">
                        <div className="text-[#C5A028] mr-4 mt-0.5">
                          {/* Beaker Icon */}
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-stone-900 uppercase tracking-[0.1em] mb-1">Recipe</span>
                          <p className="text-xs text-stone-600 leading-normal">
                            {rec.guidance || 'Apply the Base first (low volatility). Wait 2 minutes. Mist the Top layer.'}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MODULE C: The Curator's Pivot */}
        {recommendationCategories.find(c => c.type === 'discovery') && (
          <section>
             {recommendationCategories.find(c => c.type === 'discovery')?.recommendations.slice(0, 1).map(rec => (
               <div key={rec.perfume.id} className="relative rounded-[32px] overflow-hidden bg-[#F5F5F0] min-h-[500px] flex flex-col md:flex-row">
                 
                 {/* Content Side */}
                 <div className="flex-1 p-10 md:p-20 flex flex-col justify-center items-start z-10">
                   <span className="px-3 py-1 border border-stone-300 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">The Curator's Pivot</span>
                   <h3 className="font-serif text-4xl md:text-5xl text-stone-900 mb-6 leading-tight">
                     Step out of your comfort zone.
                   </h3>
                   <p className="text-lg text-stone-600 mb-8 max-w-md leading-relaxed">
                     You seem to like <span className="font-semibold text-stone-900">{perfume.vibe_tags?.[0] || 'Bold'}</span> scents. 
                     Have you tried <span className="font-semibold text-stone-900">{rec.perfume.olfactory_family?.[0] || 'Leather'}</span>? 
                     {rec.reason}
                   </p>
                   <button 
                     onClick={() => router.push(`/perfume/${rec.perfume.id}`)}
                     className="px-8 py-4 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition shadow-lg hover:shadow-xl hover:-translate-y-1"
                   >
                     Discover {rec.perfume.name}
                   </button>
                 </div>

                 {/* Visual Side */}
                 <div className="flex-1 relative min-h-[300px] md:min-h-auto bg-[#EAEae5] flex items-center justify-center">
                    {/* Abstract Shapes */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-stone-300 rounded-full opacity-50"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] border border-stone-300 rounded-full opacity-50"></div>
                    
                    {rec.perfume.image_url ? (
                      <img 
                        src={rec.perfume.image_url} 
                        className="relative z-10 w-[60%] h-[60%] object-contain mix-blend-multiply drop-shadow-2xl hover:scale-110 transition duration-1000 ease-in-out" 
                        alt={rec.perfume.name} 
                      />
                    ) : (
                      <div className="text-stone-300 font-serif italic">No Image</div>
                    )}
                 </div>

               </div>
             ))}
          </section>
        )}

        {/* MODULE D: The Smart Buy (Dupe Hunter) */}
        {recommendationCategories.find(c => c.type === 'dupe') && (
          <section>
            <div className="flex flex-col md:flex-row items-baseline gap-4 mb-8 border-b border-stone-100 pb-4">
              <h3 className="font-serif text-2xl text-stone-900">The Smart Buy</h3>
              <p className="text-stone-500 text-sm italic">High-similarity alternatives with calculated trade-offs</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendationCategories.find(c => c.type === 'dupe')?.recommendations.map((rec) => (
                <div key={rec.perfume.id} className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-500 group">
                  {/* Header: The Match % */}
                  <div className="bg-stone-50 px-6 py-4 flex justify-between items-center border-b border-stone-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Analysis</span>
                    <span className="text-xs font-bold text-stone-900 bg-white px-3 py-1 rounded-full shadow-sm">
                      The {rec.score}% Match
                    </span>
                  </div>

                  {/* The Equation: Current vs Dupe */}
                  <div className="p-6">
                    <div className="flex items-center justify-around mb-8 relative">
                      {/* Current Perfume */}
                      <div className="w-20 h-20 relative opacity-40 grayscale group-hover:opacity-60 transition duration-500">
                        {perfume.image_url ? (
                          <img src={perfume.image_url} className="w-full h-full object-contain" alt="Original" />
                        ) : (
                          <div className="w-full h-full bg-stone-200 rounded-lg" />
                        )}
                      </div>

                      {/* VS / Match icon */}
                      <div className="text-stone-300 font-light text-2xl">≈</div>

                      {/* Dupe Perfume */}
                      <div className="w-32 h-32 relative">
                        {rec.perfume.image_url ? (
                          <img src={rec.perfume.image_url} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md group-hover:scale-110 transition duration-700" alt={rec.perfume.name} />
                        ) : (
                          <div className="w-full h-full bg-stone-100 rounded-xl" />
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md shadow-lg">
                          Budget Friendly
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center mb-6">
                      <div className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">{rec.perfume.brand?.name}</div>
                      <h4 className="font-serif text-xl text-stone-900 mb-4">{rec.perfume.name}</h4>
                      
                      {/* The Reality Check (Educational Text) */}
                      <div className="bg-stone-50 rounded-2xl p-4 text-left border border-stone-100">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-1">
                          <span className="text-xs">ⓘ</span> Reality Check
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          "Captures the opening notes perfectly, but <span className="font-medium text-stone-900">{rec.tradeOffs?.longevityDiff.toLowerCase()}</span>. 
                          {rec.tradeOffs?.missingNotes && rec.tradeOffs.missingNotes.length > 0 && (
                            <> Note that it lacks the <span className="font-medium text-stone-900">{rec.tradeOffs.missingNotes.join(', ')}</span> found in the original.</>
                          )}"
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => router.push(`/perfume/${rec.perfume.id}`)}
                      className="w-full py-3 bg-white border border-stone-200 text-stone-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      View Specs <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      <CommentsSection perfumeId={perfume.id} />
    </div>
  );
}
