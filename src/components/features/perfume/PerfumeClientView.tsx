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
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] pb-20 font-sans selection:bg-[#1C1917] selection:text-[#FAFAF9]">
      {/* Sticky Header */}
      <div className="px-6 py-4 sticky top-0 bg-[#FAFAF9]/90 backdrop-blur-md z-30 flex justify-between items-center border-b border-[#E7E5E4]">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest text-[#57534E] hover:text-[#1C1917] transition-colors">← Collection</Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A8A29E]">Scentia</span>
      </div>

      {/* Hero Section */}
      <PerfumeHero perfume={perfume} />

      <div className="max-w-6xl mx-auto px-6 mb-20">
        {/* Dashboard Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-white grid lg:grid-cols-[320px_1fr] gap-12 lg:gap-20">
          
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
