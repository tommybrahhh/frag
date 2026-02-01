'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Database } from '@/types/database';

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
      <div className="text-center mb-8">
        <Link href={`/brands/${perfume.brand?.name ? encodeURIComponent(perfume.brand.name) : ''}`} className="inline-block">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-800 transition-colors mb-2">
            {perfume.brand?.name}
          </h2>
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight">
          {perfume.name}
        </h1>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center lg:items-start">
        
        {/* COLUMN 1: Hero Image */}
        <div className="lg:col-span-5 lg:col-start-2 flex flex-col items-center justify-center order-1">
          <div className="relative w-full h-[450px] flex items-center justify-center bg-[#FAFAF9] rounded-2xl" ref={heroRef}>
            {perfume.image_url ? (
              <img src={perfume.image_url} alt={perfume.name} className="h-full w-full object-contain mix-blend-multiply" />
            ) : (
              <div className="w-64 h-80 border-2 border-stone-100 flex items-center justify-center text-stone-300 italic">No Bottle Image</div>
            )}
          </div>
        </div>

        {/* COLUMN 2: Story & Actions & Moved Data */}
        <div className="lg:col-span-5 space-y-8 lg:pt-8 order-2 relative z-10">
           {/* 2a. Character Story */}
           <div className="relative z-20">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Character</h3>
              <p className="font-serif text-lg text-stone-800 leading-relaxed italic">
                  {perfume.scenario || `${perfume.name} presents a distinctive ${perfume.olfactory_family?.[0]?.toLowerCase() || 'aromatic'} profile.`}
              </p>
           </div>

           {/* 2b. Actions (Buttons) */}
           <div className="pt-4 border-t border-stone-100 relative z-10">
               <button onClick={() => handleCollectionAction('owned')} disabled={isSubmitting} className="w-full py-4 bg-stone-900 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-colors mb-3 disabled:opacity-50 shadow-lg shadow-stone-200">
                  {isSubmitting ? 'Updating...' : (listType === 'owned' ? 'In Wardrobe' : 'Add to Wardrobe')}
               </button>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleCollectionAction('wishlist')} disabled={isSubmitting} className={`py-3 border text-xs font-bold uppercase tracking-widest transition-colors ${listType === 'wishlist' ? 'bg-stone-100 border-stone-300 text-stone-900' : 'border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900'}`}>
                      {listType === 'wishlist' ? 'In Wishlist' : 'Wishlist'}
                  </button>
                  <button onClick={() => router.push(`/compare?a=${perfume.id}`)} className="py-3 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest hover:border-stone-900 hover:text-stone-900 transition-colors">
                      Compare
                  </button>
                  <button onClick={onShare} className="py-3 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest hover:border-stone-900 hover:text-stone-900 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Share
                  </button>
               </div>
           </div>

            {/* 2c. Olfactive, Perfumer, Price */}
            <div className="space-y-4 pt-6 border-t border-stone-100">
                {/* Olfactive Family */}
                <div>
                   <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Olfactive Family</h3>
                   <div className="space-y-1">
                       <div className="flex items-baseline gap-2">
                           <span className="font-serif text-base text-stone-900">{perfume.olfactory_family?.[0] || 'N/A'}</span>
                           <span className="text-[9px] uppercase tracking-widest text-stone-400">(Primary)</span>
                       </div>
                       {perfume.olfactory_family?.[1] && (
                           <div className="flex items-baseline gap-2">
                               <span className="font-serif text-base text-stone-900">{perfume.olfactory_family[1]}</span>
                               <span className="text-[9px] uppercase tracking-widest text-stone-400">(Secondary)</span>
                           </div>
                       )}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Perfumer */}
                    <div className="pt-4 border-t border-stone-100">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Perfumer</h3>
                       <div className="font-serif text-base text-stone-900">
                           {perfume.perfumer ? (
                               <Link href={`/creators/${encodeURIComponent(perfume.perfumer)}`} className="hover:underline decoration-stone-400 underline-offset-4">{perfume.perfumer}</Link>
                           ) : 'Unknown Nose'}
                       </div>
                    </div>

                    {/* Price Range */}
                    <div className="pt-4 border-t border-stone-100">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Price Range</h3>
                       <span className="font-serif text-base text-stone-900">{perfume.price_tier || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}