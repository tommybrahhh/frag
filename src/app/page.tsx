import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';

import CommunityHeroServer from '@/components/features/home/server-components/CommunityHeroServer';
import TrendingScentsServer from '@/components/features/home/server-components/TrendingScentsServer';
import DailyBattleServer from '@/components/features/home/server-components/DailyBattleServer';
import TopContributorsServer from '@/components/features/home/server-components/TopContributorsServer';
import RandomPerfumeServer from '@/components/features/home/server-components/RandomPerfumeServer';
import TierNav from '@/components/features/search/TierNav';
import VisualCategoryNav from '@/components/features/search/VisualCategoryNav'; 
import JoinCommunityCTA from '@/components/features/home/JoinCommunityCTA';
import PageTransition from '@/components/layout/PageTransition'; // Added

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-white text-stone-800 pb-24">
        <Suspense fallback={<div className="min-h-[500px] lg:min-h-[600px] flex items-center justify-center"><Spinner /></div>}>
          <CommunityHeroServer />
        </Suspense>

        <Suspense fallback={<div className="py-12 md:py-24 flex items-center justify-center"><Spinner /></div>}>
          <TrendingScentsServer />
        </Suspense>

        <Suspense fallback={<div className="py-16 md:py-24 flex items-center justify-center"><Spinner /></div>}>
          <DailyBattleServer />
        </Suspense>
        
        {/* Top Contributors Section */}
        <Suspense fallback={<div className="py-12 md:py-24 flex items-center justify-center"><Spinner /></div>}>
          <TopContributorsServer />
        </Suspense>

        <div className="py-12 md:py-24 space-y-16 md:space-y-32 bg-stone-50/50">
          <div id="discovery" className="max-w-[1400px] mx-auto px-6">
             <div className="mb-8 md:mb-16">
                <div className="flex items-center gap-2 mb-2 md:mb-4">
                   <div className="h-px w-4 md:w-8 bg-stone-200" />
                   <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Discovery Hub</span>
                </div>
                <h2 className="font-serif text-2xl md:text-5xl text-stone-900">
                  Find Your Next <span className="italic text-stone-400">Signature</span>
                </h2>
             </div>
             
             <div className="space-y-12 md:space-y-24">
               <TierNav />
               <VisualCategoryNav />
             </div>
          </div>

          <div className="max-w-[1400px] mx-auto px-6">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 text-center md:text-left border border-stone-100 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center gap-12">
               {/* Decorative background */}
               <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                  <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-stone-900 rounded-full blur-[120px]" />
               </div>

               <div className="relative z-10 flex-1">
                 <h3 className="font-serif text-3xl md:text-5xl text-stone-900 mb-6 text-balance">Can&apos;t find <br className="hidden md:block" /> your scent?</h3>
                 <p className="text-base md:text-lg text-stone-500 mb-8 max-w-md font-light leading-relaxed">
                    Explore our full library of thousands of fragrances, or try our lucky pick.
                 </p>
                 <Link 
                    href="/search?sort=newest"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl"
                 >
                    <SearchIcon className="w-4 h-4" />
                    <span>Open Library</span>
                 </Link>
               </div>

               {/* Random Perfume Section */}
               <Suspense fallback={<div className="w-full md:w-72 flex items-center justify-center"><Spinner /></div>}>
                 <RandomPerfumeServer />
               </Suspense>
            </div>
          </div>
        </div>
        
        <JoinCommunityCTA />
      </main>
    </PageTransition>
  );
}