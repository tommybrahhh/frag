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
}

export default function PerfumeClientView({ perfume, recommendationCategories }: PerfumeClientViewProps) {
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
      <div className="px-6 py-3 md:py-4 sticky top-0 bg-[#FAFAF9]/90 backdrop-blur-md z-50 flex justify-between items-center border-b border-[#E7E5E4] transition-all duration-300">
        <Link href="/" className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-[#57534E] hover:text-[#1C1917] transition-colors">← Back</Link>
        
        <div className={`absolute left-1/2 -translate-x-1/2 text-center transition-all duration-500 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
           <div className="text-[8px] font-bold uppercase tracking-widest text-stone-400 leading-none">{perfume.brand?.name}</div>
           <div className="text-xs md:text-sm font-serif text-stone-900 truncate max-w-[150px] md:max-w-xs">{perfume.name}</div>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A8A29E]">Scentia</span>
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
      <CommentsSection perfumeId={perfume.id} />
    </div>
  );
}
