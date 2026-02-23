'use client';

import React from 'react';
import Link from 'next/link';
import CommentsSection from '@/components/features/community/CommentsSection';
import { Database } from '@/types/database';
import { RecommendationCategory } from '@/lib/recommendation-engine';
import PerfumeHero from './PerfumeHero';
import PerfumeDashboard from './PerfumeDashboard';
import PerfumePyramid from './PerfumePyramid';
import PerfumeRecommendations from './PerfumeRecommendations';

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
  slug?: string;
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
  best_season?: string[] | null;
  best_time?: string | null;
};

interface PerfumeClientViewProps {
  perfume: Perfume;
  recommendationCategories: RecommendationCategory[];
  initialComments?: any[];
}

export default function PerfumeClientView({ perfume, recommendationCategories, initialComments = [] }: PerfumeClientViewProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${perfume.name}`,
          text: `I found this scent on Scentia: ${perfume.name} by ${perfume.brand?.name}. It fits the ${perfume.vibe_tags?.[0]} vibe!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] pb-20 font-sans selection:bg-[#1C1917] selection:text-[#FAFAF9]">
      {/* Sticky Header */}
      <div className="px-6 py-3 md:py-4 sticky top-0 bg-white/90 backdrop-blur-md z-[60] flex justify-between items-center border-b border-stone-100 transition-all duration-300">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            <span className="hidden sm:inline">Back</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-400 font-bold">
            <span>Home</span>
            <span className="text-stone-200">/</span>
            <Link href="/search" className="hover:text-stone-600 transition-colors">Library</Link>
            <span className="text-stone-200">/</span>
            <span className="text-stone-900 truncate max-w-[100px]">{perfume.name}</span>
          </div>
        </div>
        
        <div className={`absolute left-1/2 -translate-x-1/2 text-center transition-all duration-500 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
           <div className="text-[9px] font-bold uppercase tracking-widest text-stone-500 leading-none mb-0.5">{perfume.brand?.name}</div>
           <div className="text-xs md:text-sm font-serif text-stone-900 truncate max-w-[150px] md:max-w-xs">{perfume.name}</div>
        </div>

        <div className="flex items-center gap-4">
          {isScrolled && (
             <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hidden md:flex h-8 px-4 bg-stone-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-full items-center justify-center hover:bg-stone-800 transition-all"
             >
                Add to Shelf
             </button>
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Scentia</span>
        </div>
      </div>

      {/* Hero Section */}
      <PerfumeHero perfume={perfume} onShare={handleShare} />

      <div className="max-w-6xl mx-auto px-6 mb-12">
        {/* Dashboard Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-white grid lg:grid-cols-[320px_1fr] gap-4 md:gap-12 lg:gap-20">
          
          {/* LEFT COLUMN: Stats & Data */}
          <PerfumeDashboard perfume={perfume} />

          {/* RIGHT COLUMN: The Split Treemap Pyramid */}
          <PerfumePyramid perfume={perfume} />

        </div>
      </div>

      {/* Recommendation Modules */}
      <PerfumeRecommendations mainPerfume={perfume} recommendationCategories={recommendationCategories} />

      {/* Community Comments */}
      <CommentsSection perfumeId={perfume.id} initialComments={initialComments} />
    </div>
  );
}
