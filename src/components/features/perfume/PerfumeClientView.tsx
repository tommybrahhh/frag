'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CommentsSection from '@/components/features/community/CommentsSection';
import ScentRadar from '@/components/ui/ScentRadar';
import { Database } from '@/types/database';
import { ratingToDescription } from '@/lib/longevity-utils';
import { RecommendationCategory } from '@/lib/recommendation-engine';

export type Note = {
  name: string;
  color_hex?: string;
  description?: string;
  url?: string;
};

export type PerfumeNote = {
  type: string;
  note: Note;
};

export type Brand = {
  name: string;
  tier?: string;
};

export type Perfume = Database['public']['Tables']['perfumes']['Row'] & {
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
  return 'Moderate';
};

export default function PerfumeClientView({ perfume, recommendationCategories }: PerfumeClientViewProps) {
  const router = useRouter();
  const { user, supabase } = useAuth();
  const [inCollection, setInCollection] = useState(false);
  const [listType, setListType] = useState<'owned' | 'wishlist' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
    
  // Micro-Interaction States
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  // Parallax Effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrolled * 0.1}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  // --- TREEMAP COMPONENTS ---

  const TreemapTile = ({ noteData, className }: { noteData: PerfumeNote, className?: string }) => {
    const noteName = noteData.note.name;
    const noteSlug = noteName.toLowerCase().replace(/\s+/g, '-');
    const isActive = activeNote === noteName;

    return (
      <div className={`relative group overflow-hidden border border-white/50 ${className}`}>
        <button
          onClick={() => setActiveNote(isActive ? null : noteName)}
          className="w-full h-full relative block"
        >
          {/* Background Image */}
          <img 
            src={noteData.note.url || `/assets/notes/${noteSlug}.png`} 
            alt={noteName}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
                // Fallback to background color if image missing or fails
                (e.target as HTMLImageElement).style.visibility = 'hidden'; // Hide the broken image icon
                (e.target as HTMLImageElement).parentElement!.style.backgroundColor = noteData.note.color_hex || '#e7e5e4';
            }}
          />
          
          {/* Overlay & Text */}
          <div className={`absolute inset-0 transition-all duration-300 flex items-center justify-center p-2 ${isActive ? 'bg-black/60' : 'bg-black/20 group-hover:bg-black/0'}`}>
             <span className={`text-white font-bold uppercase tracking-widest drop-shadow-md text-center break-words ${isActive ? 'text-xs' : 'text-[10px] md:text-xs'}`}>
                {noteName}
             </span>
          </div>

          {/* Active State Border */}
          {isActive && <div className="absolute inset-0 border-2 border-white z-20"></div>}
        </button>

        {/* Tooltip Popup */}
        {isActive && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900/95 backdrop-blur text-white text-xs p-4 rounded-xl shadow-2xl w-[90%] md:w-56 text-center z-50 animate-in fade-in zoom-in-95 duration-200 border border-stone-700">
                <p className="mb-3 font-serif leading-relaxed text-stone-200">
                    {noteData.note.description || "A defining note."}
                </p>
                <Link href={`/ingredients/${encodeURIComponent(noteName)}`} className="inline-block uppercase font-bold tracking-widest text-[9px] text-[#A8A29E] hover:text-white border-b border-stone-700 hover:border-white pb-0.5 transition-colors">
                    Explore →
                </Link>
            </div>
        )}
      </div>
    );
  };

  const TreemapSection = ({ title, type, notes, heightClass, labelSide = 'left' }: { title: string, type: string, notes: PerfumeNote[], heightClass: string, labelSide?: 'left' | 'right' }) => {
    const isEmpty = !notes || notes.length === 0;

    return (
        <div className={`relative flex w-full ${heightClass} border-b border-white last:border-b-0`}>
            
            {/* Label (Side Tab) */}
            <div className={`w-8 md:w-12 flex-shrink-0 flex items-center justify-center bg-stone-100 border-r border-white`}>
                 <span className="block -rotate-90 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-stone-400 whitespace-nowrap">
                    {title}
                 </span>
            </div>

            {/* Content Area (The Map) */}
            <div className="flex-grow relative bg-stone-50">
                 {isEmpty ? (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs italic border border-dashed border-stone-200 m-2">
                        No {type.toLowerCase()} notes listed
                    </div>
                 ) : (
                    <div className="flex flex-wrap w-full h-full content-stretch">
                        {notes.map((note, idx) => {
                             return (
                                <div 
                                    key={idx} 
                                    className="flex-grow basis-[45%] md:basis-[30%]" 
                                    style={{ flexGrow: (notes.length % 2 !== 0 && idx === 0) ? 2 : 1 }}
                                >
                                    <TreemapTile noteData={note} className="w-full h-full" />
                                </div>
                             )
                        })}
                    </div>
                 )}
            </div>
        </div>
    );
  };


  // --- RECOMMENDATION SECTION COMPONENT ---
  const RecommendationSection = ({ category }: { category: RecommendationCategory }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Only apply limiting logic to specific price/tier related categories as requested
    // or generally if the list is long. The user asked specifically for:
    // "in the same price range", "entry luxe upgrade", "top-tier luxury"
    // We'll check the category.type or title to be safe, or just apply to all for better UX.
    // Let's apply to all categories that have more than 6 items for consistency.
    
    const visibleRecommendations = isExpanded 
      ? category.recommendations 
      : category.recommendations.slice(0, 6);
      
    const hasHiddenItems = category.recommendations.length > 6;

    return (
      <section>
        <div className="mb-8 border-b border-stone-100 pb-4 flex justify-between items-end">
          <div>
            <h3 className="font-serif text-2xl text-stone-900 mb-2">{category.title}</h3>
            <p className="text-stone-500 text-sm">{category.description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleRecommendations.map((rec) => (
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

        {hasHiddenItems && (
           <div className="mt-8 text-center">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-full text-xs font-bold uppercase tracking-widest text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all shadow-sm hover:shadow-md"
              >
                {isExpanded ? 'Show Less' : `Show ${category.recommendations.length - 6} More`}
              </button>
           </div>
        )}
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] pb-20 font-sans selection:bg-[#1C1917] selection:text-[#FAFAF9]">
      <div className="px-6 py-4 sticky top-0 bg-[#FAFAF9]/90 backdrop-blur-md z-30 flex justify-between items-center border-b border-[#E7E5E4]">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest text-[#57534E] hover:text-[#1C1917] transition-colors">← Collection</Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A8A29E]">Scentia</span>
      </div>

      {/* --- HERO SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <Link href={`/brands/${perfume.brand?.name ? encodeURIComponent(perfume.brand.name) : ''}`} className="inline-block">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-800 transition-colors mb-3">
              {perfume.brand?.name}
            </h2>
          </Link>
          <h1 className="font-serif text-5xl md:text-6xl text-stone-900 leading-tight">
            {perfume.name}
          </h1>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:items-start">
          
          {/* COLUMN 1: Spacer (Formerly Data Sheet) */}
          {/* Kept as empty hidden block on desktop to preserve the 3-6-3 grid ratio so image stays centered */}
          <div className="hidden lg:block lg:col-span-3 lg:pt-20 lg:order-1">
             {/* Empty spacer */}
          </div>

          {/* COLUMN 2: Hero Image */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center min-h-[500px] order-1 lg:order-2">
            <div className="relative w-full h-[600px] bg-stone-50/50 rounded-[40px] flex items-center justify-center overflow-hidden" ref={heroRef}>
                 <div className="absolute w-[400px] h-[400px] rounded-full bg-stone-100/30 blur-3xl -z-10"></div>
                 {perfume.image_url ? (
                    <img src={perfume.image_url} alt={perfume.name} className="h-[80%] w-[80%] object-contain mix-blend-multiply" />
                 ) : (
                    <div className="w-64 h-80 border-2 border-stone-100 flex items-center justify-center text-stone-300 italic">No Bottle Image</div>
                 )}
            </div>
          </div>

          {/* COLUMN 3: Story & Actions & Moved Data */}
          <div className="lg:col-span-3 space-y-10 lg:pt-20 order-2 lg:order-3">
             {/* 3a. Character Story */}
             <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Character</h3>
                <p className="font-serif text-lg text-stone-800 leading-relaxed italic">
                    {perfume.scenario || `${perfume.name} presents a distinctive ${perfume.olfactory_family?.[0]?.toLowerCase() || 'aromatic'} profile.`}
                </p>
             </div>

             {/* 3b. Actions (Buttons) */}
             <div className="pt-6 border-t border-stone-100">
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
                 </div>
             </div>

             {/* 3c. MOVED DATA: Olfactive, Perfumer, Price */}
             <div className="space-y-10 pt-8 border-t border-stone-100">
                {/* Olfactive Family */}
                <div>
                   <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Olfactive Family</h3>
                   <div className="space-y-4">
                       <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-lg shadow-sm">🌸</div>
                           <div>
                               <div className="text-xs font-bold uppercase tracking-wider text-stone-900">{perfume.olfactory_family?.[0] || 'Floral'}</div>
                               <div className="text-[9px] uppercase tracking-widest text-stone-400">Primary</div>
                           </div>
                       </div>
                       {perfume.olfactory_family?.[1] && (
                           <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-lg shadow-sm">🌫️</div>
                               <div>
                                   <div className="text-xs font-bold uppercase tracking-wider text-stone-900">{perfume.olfactory_family[1]}</div>
                                   <div className="text-[9px] uppercase tracking-widest text-stone-400">Secondary</div>
                               </div>
                           </div>
                       )}
                   </div>
                </div>

                {/* Perfumer */}
                <div className="pt-6 border-t border-stone-100">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Perfumer</h3>
                   <div className="text-sm font-medium text-stone-900">
                       {perfume.perfumer ? (
                           <Link href={`/creators/${encodeURIComponent(perfume.perfumer)}`} className="hover:underline decoration-stone-400 underline-offset-4">{perfume.perfumer}</Link>
                       ) : 'Unknown Nose'}
                   </div>
                </div>

                {/* Price Range */}
                <div>
                   <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Price Range</h3>
                   <span className="font-serif text-xl text-stone-900 tracking-widest">{perfume.price_tier || '$$$'}</span>
                </div>
             </div>

          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mb-20">
        {/* Dashboard Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-white grid lg:grid-cols-[320px_1fr] gap-12 lg:gap-20">
          
          {/* LEFT COLUMN: Stats & Data */}
          <div className="space-y-12">
            {/* Context */}
            <div>
              <h4 className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 pb-2 border-b border-stone-100">
                Context <span className="flex-1 h-px bg-stone-100"></span>
              </h4>
              <div className="space-y-6">
                <div>
                  <span className="block text-[9px] font-bold text-stone-400 uppercase mb-3">Best Season</span>
                  <div className="flex gap-2">
                    {[{ name: 'Spring', icon: '🌱', active: perfume.best_season?.includes('Spring') }, { name: 'Summer', icon: '☀️', active: perfume.best_season?.includes('Summer') }, { name: 'Fall', icon: '🍂', active: perfume.best_season?.includes('Fall') }, { name: 'Winter', icon: '❄️', active: perfume.best_season?.includes('Winter') }].map(s => (
                      <div key={s.name} title={s.name} className={`w-10 h-10 flex items-center justify-center rounded-full text-base border transition-all ${s.active ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-stone-50 text-stone-300 border-stone-100'}`}>{s.icon}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-stone-400 uppercase mb-3">Best Time</span>
                  <div className="flex gap-2">
                      <div title="Day" className={`w-10 h-10 flex items-center justify-center rounded-full text-base border transition-all ${!perfume.best_time || perfume.best_time === 'Day' || perfume.best_time === 'All Day' ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-stone-50 text-stone-300 border-stone-100'}`}>☀️</div>
                      <div title="Night" className={`w-10 h-10 flex items-center justify-center rounded-full text-base border transition-all ${perfume.best_time === 'Night' || perfume.best_time === 'All Day' ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-stone-50 text-stone-300 border-stone-100'}`}>🌙</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div>
              <h4 className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 pb-2 border-b border-stone-100">
                Performance <span className="flex-1 h-px bg-stone-100"></span>
              </h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Longevity</span>
                    <span className="text-xs font-serif italic text-stone-900">{ratingToDescription(perfume.longevity_rating || 0)}</span>
                  </div>
                  <div className="flex gap-1 h-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(step => (
                      <div key={step} className={`flex-1 rounded-full transition-all duration-1000 ${(perfume.longevity_rating || 0) >= step ? 'bg-stone-800' : 'bg-stone-100'}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Sillage</span>
                    <span className="text-xs font-serif italic text-stone-900">{getSillageDescription(perfume.sillage_rating)}</span>
                  </div>
                  <div className="flex gap-1 h-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(step => (
                      <div key={step} className={`flex-1 rounded-full transition-all duration-1000 ${(perfume.sillage_rating || 0) >= step ? 'bg-stone-800' : 'bg-stone-100'}`} />
                    ))}
                  </div>
                </div>                      
              </div>
            </div>

            {/* Radar */}
            <div>
              <h4 className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 pb-2 border-b border-stone-100">
                Scent DNA <span className="flex-1 h-px bg-stone-100"></span>
              </h4>
              <div className="-ml-4 -mt-4">
                <ScentRadar profile={(perfume.scent_profile && Object.keys(perfume.scent_profile).length > 0) ? perfume.scent_profile : { fresh: 5, sweet: 5, spicy: 5, woody: 5, floral: 5 }} />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Split Treemap Pyramid */}
          <div className="flex flex-col h-full min-h-[600px] lg:min-h-[700px] border border-white rounded-2xl overflow-hidden shadow-sm bg-white">
            
             {/* Header */}
             <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-900">Scent Architecture</h4>
                 <span className="text-[9px] text-stone-400">Tap notes for info</span>
             </div>

             {/* 1. TOP NOTES (Smallest - 20%) */}
             <TreemapSection 
                title="Top Notes" 
                type="Top"
                notes={perfume.perfume_notes?.filter(n => n.type === 'Top') || []} 
                heightClass="h-[20%] min-h-[120px]" 
             />

             {/* 2. HEART NOTES (Mid - 30%) */}
             <TreemapSection 
                title="Heart Notes" 
                type="Heart"
                notes={perfume.perfume_notes?.filter(n => n.type === 'Heart') || []} 
                heightClass="h-[30%] min-h-[180px]" 
             />

             {/* 3. BASE NOTES (Biggest - 50%) */}
             <TreemapSection 
                title="Base Notes" 
                type="Base"
                notes={perfume.perfume_notes?.filter(n => n.type === 'Base') || []} 
                heightClass="h-[50%] min-h-[250px]" 
             />
             
          </div>

        </div>
      </div>

      {/* Recommendation Modules */}
      <div className="max-w-6xl mx-auto px-6 mt-24 mb-20 space-y-24">
        {recommendationCategories.map(category => (
          <RecommendationSection key={category.type} category={category} />
        ))}
      </div>

      <CommentsSection perfumeId={perfume.id} />
    </div>
  );
}