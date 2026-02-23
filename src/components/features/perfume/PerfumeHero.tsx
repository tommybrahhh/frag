'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Database } from '@/types/database';
import { getPerfumeImage, PLACEHOLDER_IMAGE } from '@/lib/perfume-utils';

// Type definitions moved from the original parent component
type Brand = {
  name: string;
  tier?: string;
};

type Perfume = Database['public']['Tables']['perfumes']['Row'] & {
  brand?: Brand;
  perfumer?: string;
  scenario?: string;
  olfactory_family?: string[];
};

interface PerfumeHeroProps {
  perfume: Perfume;
  onShare: () => void;
}

export default function PerfumeHero({ perfume, onShare }: PerfumeHeroProps) {
  const router = useRouter();
  const { user, supabase } = useAuth();
  const [inCollection, setInCollection] = useState(false);
  const [listType, setListType] = useState<'owned' | 'wishlist' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imgSrc, setImgSrc] = useState(getPerfumeImage(perfume.image_url));

  // Sync image source if perfume prop changes (e.g. navigation)
  useEffect(() => {
    setImgSrc(getPerfumeImage(perfume.image_url));
  }, [perfume.image_url]);

  // Micro-Interaction States
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax Effect
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      
      // Only apply parallax on large screens (lg breakpoint is 1024px)
      if (window.innerWidth >= 1024) {
        const scrolled = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrolled * 0.1}px)`;
      } else {
        // Reset transform on smaller screens
        heroRef.current.style.transform = 'translateY(0px)';
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Check initial collection status
  useEffect(() => {
    const checkCollection = async () => {
      setError(null);
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

    const action = (listType === targetType) ? 'remove' : (listType ? 'move' : 'add');
    setIsSubmitting(true);
    setError(null);

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
      setInCollection(prevInCollection);
      setListType(prevListType);
      setError(err.message || 'Failed to update collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-6 pb-12">
      {/* HEADER */}
      <div className="text-center mb-10">
        <Link href={`/brands/${perfume.brand?.name ? encodeURIComponent(perfume.brand.name) : ''}`} className="inline-block">
          <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-stone-500 hover:text-stone-800 transition-colors mb-2">
            {perfume.brand?.name}
          </h2>
        </Link>
        <h1 className="font-serif text-4xl md:text-6xl text-stone-900 leading-[1.1] max-w-2xl mx-auto px-4">
          {perfume.name}
        </h1>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center lg:items-start max-w-6xl mx-auto">
        
        {/* COLUMN 1: Hero Image */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 relative">
          <div className="relative w-full aspect-square md:aspect-[4/5] flex items-center justify-center bg-[#FAFAF9] rounded-[2.5rem] border border-stone-100 overflow-hidden group/hero shadow-[0_20px_50px_rgba(0,0,0,0.02)]" ref={heroRef}>
            {perfume.image_url ? (
              <img 
                src={imgSrc} 
                alt={perfume.name} 
                className="h-[75%] w-[75%] object-contain mix-blend-multiply p-4 md:p-0 transition-transform duration-1000 group-hover/hero:scale-110" 
                onError={() => setImgSrc(PLACEHOLDER_IMAGE)}
              />
            ) : (
              <div className="w-64 h-80 border-2 border-stone-100 flex items-center justify-center text-stone-300 italic rounded-2xl">No Bottle Image</div>
            )}

            {/* Floating Visual Summary Icons */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 bg-white/40 backdrop-blur-md border border-white/50 px-5 py-2.5 rounded-full shadow-lg z-20">
               {perfume.best_season?.[0] && (
                  <div className="flex items-center gap-2 group/tip relative">
                    <img 
                       src={`/icons/${perfume.best_season[0].toLowerCase() === 'winter' ? 'snowflake' : perfume.best_season[0].toLowerCase() === 'summer' ? 'sun' : 'leaf'}.svg`}
                       className="w-4 h-4 text-stone-800"
                       alt={perfume.best_season[0]}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-800">{perfume.best_season[0]}</span>
                  </div>
               )}
               <div className="w-px h-3 bg-stone-300/50" />
               <div className="flex items-center gap-2">
                  <img 
                     src={`/icons/${perfume.best_time === 'Night' ? 'moon' : 'sun'}.svg`}
                     className="w-4 h-4 text-stone-800"
                     alt={perfume.best_time || 'Day'}
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-800">{perfume.best_time || 'Day'}</span>
               </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Story & Actions & Moved Data */}
        <div className="lg:col-span-6 space-y-8 md:space-y-10 lg:pt-12 order-2 relative z-10">
           {/* 2a. Character Story */}
           <div className="relative z-20 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                 <div className="w-8 h-px bg-stone-200" />
                 <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">The Character</h3>
              </div>
              <p className="font-serif text-xl md:text-2xl text-stone-800 leading-relaxed italic px-4 md:px-0">
                  {perfume.scenario || `${perfume.name} presents a distinctive ${perfume.olfactory_family?.[0]?.toLowerCase() || 'aromatic'} profile.`}
              </p>
           </div>

           {/* 2b. Actions (Buttons) */}
           <div className="pt-6 border-t border-stone-100 relative z-10 px-4 md:px-0">
               <button onClick={() => handleCollectionAction('owned')} disabled={isSubmitting} className="w-full py-5 bg-stone-900 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-all mb-4 disabled:opacity-50 shadow-2xl shadow-stone-200 active:scale-95 rounded-2xl">
                  {isSubmitting ? 'Updating...' : (listType === 'owned' ? 'Already on My Shelf' : 'Add to Wardrobe')}
               </button>
               <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => handleCollectionAction('wishlist')} disabled={isSubmitting} className={`py-4 border text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${listType === 'wishlist' ? 'bg-stone-900 border-stone-900 text-white shadow-lg' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                      Wishlist
                  </button>
                  <button onClick={() => router.push(`/compare?a=${perfume.id}`)} className="py-4 border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all hover:border-stone-400 active:bg-stone-50">
                      Compare
                  </button>
                  <button onClick={onShare} className="py-4 border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all hover:border-stone-400 active:bg-stone-50 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Share
                  </button>
               </div>
           </div>

            {/* 2c. Olfactive, Perfumer, Price */}
            <div className="space-y-6 pt-8 border-t border-stone-100 px-4 md:px-0">
                {/* Olfactive Family */}
                <div className="text-center lg:text-left">
                   <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-2">Olfactive Family</h3>
                   <div className="flex items-baseline justify-center lg:justify-start gap-3">
                       <span className="font-serif text-lg md:text-xl text-stone-900">{perfume.olfactory_family?.[0] || 'N/A'}</span>
                       <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">(Primary)</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8 text-center lg:text-left">
                    {/* Perfumer */}
                    <div className="pt-6 border-t border-stone-100">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Perfumer</h3>
                       <div className="font-serif text-lg text-stone-900 truncate">
                           {perfume.perfumer ? (
                               <Link href={`/creators/${encodeURIComponent(perfume.perfumer)}`} className="hover:text-stone-600 underline decoration-stone-200 underline-offset-8 transition-colors">{perfume.perfumer}</Link>
                           ) : 'Unknown Nose'}
                       </div>
                    </div>

                    {/* Price Range */}
                    <div className="pt-6 border-t border-stone-100">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Price Range</h3>
                       <span className="font-serif text-lg text-stone-900 tracking-widest">{perfume.price_tier || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}