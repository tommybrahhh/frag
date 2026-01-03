'use client';

import React from 'react';
import Link from 'next/link';
import { Database } from '@/types/database';
import { RecommendationCategory } from '@/lib/recommendation-engine';

// Import the new, isolated components
import PerfumeHero from '@/components/perfume/PerfumeHero';
import PerfumeDashboard from '@/components/perfume/PerfumeDashboard';
import PerfumePyramid from '@/components/perfume/PerfumePyramid';
import PerfumeRecommendations from '@/components/perfume/PerfumeRecommendations';
import CommentsSection from '@/components/CommentsSection';

// --- Consolidated Type Definitions ---
// These types are used by multiple child components, so they are kept here
// to be passed down.

type Note = {
  name: string;
  color_hex?: string;
  description?: string;
  url?: string;
};

type PerfumeNote = {
  type: string;
  note: Note;
};

type Brand = {
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

/**
 * PerfumeClientView is now a "container" component. Its sole responsibility is to
 * orchestrate the layout of the page and delegate the rendering and logic of each
 * section to its corresponding child component. This structure prevents changes
 * in one section (e.g., Hero) from accidentally breaking another (e.g., Recommendations).
 */
export default function PerfumeClientView({ perfume, recommendationCategories }: PerfumeClientViewProps) {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] pb-20 font-sans selection:bg-[#1C1917] selection:text-[#FAFAF9]">
      {/* Sticky Header */}
      <div className="px-6 py-4 sticky top-0 bg-[#FAFAF9]/90 backdrop-blur-md z-30 flex justify-between items-center border-b border-[#E7E5E4]">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest text-[#57534E] hover:text-[#1C1917] transition-colors">← Collection</Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A8A29E]">Scentia</span>
      </div>

      {/* --- HERO SECTION --- */}
      {/* All interactive logic for the hero is now self-contained in this component. */}
      <PerfumeHero perfume={perfume} />

      {/* --- DASHBOARD & PYRAMID SECTION --- */}
      <div className="max-w-6xl mx-auto px-6 mb-20">
        <div className="bg-stone-50/80 backdrop-blur-md rounded-[32px] p-6 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.05)] grid lg:grid-cols-[320px_1fr] gap-12 lg:gap-20">
          {/* The Dashboard is now its own component. */}
          <PerfumeDashboard perfume={perfume} />
          {/* The interactive Pyramid is now its own component. */}
          <PerfumePyramid perfume={perfume} />
        </div>
      </div>

      {/* --- RECOMMENDATION SECTION --- */}
      {/* This component now contains the logic to handle empty states, preventing UI breakage. */}
      <PerfumeRecommendations perfume={perfume} recommendationCategories={recommendationCategories} />

      {/* --- COMMENTS SECTION --- */}
      <CommentsSection perfumeId={perfume.id} />
    </div>
  );
}
