'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CommentsSection from '@/components/CommentsSection';
import ScentRadar from '@/components/ScentRadar';
import { Database } from '@/types/database';
import { ratingToDescription } from '@/lib/longevity-utils';

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


import { RecommendationCategory, Recommendation } from '@/lib/recommendation-engine';

interface PerfumeClientViewProps {
  perfume: Perfume;
  recommendationCategories: RecommendationCategory[];
}

// Helper function for Sillage description
const getSillageDescription = (rating: number | null | undefined): string => {
  if (rating === null || rating === undefined) return 'Moderate';
  if (rating >= 1 && rating <= 3) return 'Intimate';
  if (rating >= 4 && rating <= 5) return 'Moderate';
  if (rating >= 6 && rating <= 7) return 'Strong';
  if (rating === 8) return 'Enormous';
  if (rating === 9) return 'Beast Mode';
  if (rating === 10) return 'Suffocating';
  return 'Moderate'; // Default for out-of-range values
};

export default function PerfumeClientView({ perfume, recommendationCategories }: PerfumeClientViewProps) {
  const router = useRouter();
  const { user, supabase } = useAuth();
  const [inCollection, setInCollection] = useState(false);
  const [listType, setListType] = useState<'owned' | 'wishlist' | null>(null);
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
        setListType(null);
        return;
      }
      
      const { data } = await supabase
        .from('user_collections')
        .select('id, list_type')
        .eq('user_id', user.id)
        .eq('perfume_id', perfume.id)
        .maybeSingle();
      
      setInCollection(!!data);
      setListType(data?.list_type as 'owned' | 'wishlist' || (data ? 'owned' : null));
    };
    checkCollection();
  }, [user, perfume, supabase]);

  const handleCollectionAction = async (targetType: 'owned' | 'wishlist') => {
    if (!user || !supabase) {
      router.push('/login');
      return;
    }
    if (!perfume) return;
    if (isSubmitting) return;

    // Determine Action: Add, Remove, or Move
    // If clicking same type -> Remove
    // If clicking different type -> Move (Update)
    const action = (listType === targetType) ? 'remove' : (listType ? 'move' : 'add');

    setIsSubmitting(true);
    setError(null);

    // Optimistic Update
    const prevInCollection = inCollection;
    const prevListType = listType;

    if (action === 'remove') {
        setInCollection(false);
        setListType(null);
    } else {
        setInCollection(true);
        setListType(targetType);
    }

    try {
      if (action === 'remove') {
        const { error: deleteError } = await supabase
          .from('user_collections')
          .delete()
          .eq('user_id', user.id)
          .eq('perfume_id', perfume.id);
        
        if (deleteError) throw deleteError;
      } else if (action === 'move') {
         const { error: updateError } = await supabase
          .from('user_collections')
          .update({ list_type: targetType })
          .eq('user_id', user.id)
          .eq('perfume_id', perfume.id);
         
         if (updateError) throw updateError;
      } else {
        // Add
        const { error: insertError } = await supabase
          .from('user_collections')
          .insert({
            user_id: user.id,
            perfume_id: perfume.id,
            list_type: targetType,
            created_at: new Date().toISOString()
          });
        
        if (insertError) {
             if (insertError.code === '23505') {
                 // Race condition: already exists, try update instead
                 const { error: retryError } = await supabase
                    .from('user_collections')
                    .update({ list_type: targetType })
                    .eq('user_id', user.id)
                    .eq('perfume_id', perfume.id);
                 if (retryError) throw retryError;
             } else {
                 throw insertError;
             }
        }
      }
    } catch (err: any) {
      console.error("Collection update error:", err);
      // Revert
      setInCollection(prevInCollection);
      setListType(prevListType);
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
                {/* Wardrobe Button */}
                <button
                  onClick={() => handleCollectionAction('owned')}
                  disabled={isSubmitting} 
                  className={`text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all border flex items-center gap-2 ${
                    listType === 'owned'
                      ? 'bg-transparent border-[#1C1917] text-[#1C1917]' 
                      : 'bg-[#1C1917] border-[#1C1917] text-[#FAFAF9] hover:bg-[#292524]'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting && listType === 'owned' ? 'Updating...' : (listType === 'owned' ? 'In Wardrobe' : (listType === 'wishlist' ? 'Move to Wardrobe' : 'Add to Shelf'))}
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => handleCollectionAction('wishlist')}
                  disabled={isSubmitting}
                  className={`w-10 h-10 flex items-center justify-center rounded-full border transition-colors ${
                      listType === 'wishlist'
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-transparent border-[#A8A29E] text-[#A8A29E] hover:border-[#1C1917] hover:text-[#1C1917]'
                  }`}
                  title={listType === 'wishlist' ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                    {listType === 'wishlist' ? '♥' : '♡'}
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
                      {ratingToDescription(perfume.longevity_rating || 0)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(step => (
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
                                      {getSillageDescription(perfume.sillage_rating)}
                                    </span>
                                  </div>
                                  <div className="flex gap-1 h-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(step => (
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
                                </div>              </div>
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



      {/* Recommendation Modules */}
      <div className="max-w-6xl mx-auto px-6 mt-24 mb-20 space-y-24">
        {recommendationCategories.map(category => (
          <section key={category.type}>
            <div className="mb-8 border-b border-stone-100 pb-4">
              <h3 className="font-serif text-2xl text-stone-900 mb-2">{category.title}</h3>
              <p className="text-stone-500 text-sm">{category.description}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.recommendations.map((rec) => (
                <div key={rec.perfume.id} className="group cursor-pointer" onClick={() => router.push(`/perfume/${rec.perfume.id}`)}>
                  <div className="relative h-[320px] bg-stone-50 rounded-2xl mb-4 flex items-center justify-center p-6 transition-colors group-hover:bg-[#F0F0F0]">
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-full border border-stone-100 shadow-sm z-10">
                      <span className="text-[10px] font-bold text-stone-900 tabular-nums">{rec.score}% Match</span>
                    </div>
                    {rec.perfume.image_url ? (
                      <img src={rec.perfume.image_url} className="h-full w-full object-contain mix-blend-multiply" alt={rec.perfume.name} />
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
          </section>
        ))}
      </div>

      <CommentsSection perfumeId={perfume.id} />
    </div>
  );
}
