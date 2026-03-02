import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';

import CommunityHeroServer from '@/components/features/home/server-components/CommunityHeroServer';
import TrendingScentsServer from '@/components/features/home/server-components/TrendingScentsServer';
import TierNav from '@/components/features/search/TierNav';
import VisualCategoryNav from '@/components/features/search/VisualCategoryNav'; 
import JoinCommunityCTA from '@/components/features/home/JoinCommunityCTA';
import PageTransition from '@/components/layout/PageTransition'; // Added

export const revalidate = 600; // Revalidate every 10 minutes

export default async function Home() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-white text-stone-800 pb-20">
        <Suspense fallback={<div className="min-h-[500px] lg:min-h-[600px] flex items-center justify-center"><Spinner /></div>}>
          <CommunityHeroServer />
        </Suspense>

        <Suspense fallback={<div className="py-8 md:py-20 flex items-center justify-center"><Spinner /></div>}>
          <TrendingScentsServer />
        </Suspense>

        <div className="py-12 md:py-24 space-y-12 md:space-y-24 bg-stone-50/50">
          <div id="discovery" className="max-w-[1400px] mx-auto px-6">
             <div className="mb-8 md:mb-12">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                   <div className="h-px w-4 md:w-8 bg-stone-200" />
                   <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-stone-500">Explore</span>
                </div>
                <h2 className="font-serif text-3xl md:text-5xl text-stone-900">
                  Find something that <span className="italic text-stone-400">feels like you.</span>
                </h2>
             </div>
             
             <div className="space-y-8 md:space-y-16">
               <TierNav />
               <VisualCategoryNav />
             </div>
          </div>
        </div>
        
        <JoinCommunityCTA />
      </main>
    </PageTransition>
  );
}