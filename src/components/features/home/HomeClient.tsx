'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import CommunityHero from '@/components/features/home/CommunityHero';
import TrendingScents from '@/components/features/home/TrendingScents';
import VisualCategoryNav from '@/components/features/search/VisualCategoryNav'; 
import PageTransition from '@/components/layout/PageTransition';
import { ActivityItem, CommunityStats } from '@/lib/services/communityService';
import JoinCommunityCTA from '@/components/features/home/JoinCommunityCTA';
import DailyBattle from '@/components/features/home/DailyBattle';
import { Search as SearchIcon } from 'lucide-react';

import TierNav from '@/components/features/search/TierNav';

interface HomeClientProps {
  initialActivity?: ActivityItem[];
  trendingPerfumes?: any[];
  dailyBattle?: any;
  communityStats?: CommunityStats;
  randomPerfume?: any;
}

export default function HomeClient({ 
  initialActivity = [], 
  trendingPerfumes = [],
  dailyBattle,
  communityStats,
  randomPerfume
}: HomeClientProps) {
  return (
    <PageTransition>
      <main className="min-h-screen bg-white text-stone-800 pb-24">
        <CommunityHero activity={initialActivity} stats={communityStats} />
        
        <TrendingScents perfumes={trendingPerfumes} />

        <DailyBattle battle={dailyBattle} />

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
                    href="/search"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl"
                 >
                    <SearchIcon className="w-4 h-4" />
                    <span>Open Library</span>
                 </Link>
               </div>

               {randomPerfume && (
                 <div className="relative z-10 w-full md:w-72">
                    <div className="absolute -top-3 -left-3 z-20 bg-amber-400 text-stone-900 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg -rotate-12">
                       Lucky Pick
                    </div>
                    <Link href={`/perfume/${randomPerfume.slug}`} className="block group bg-stone-50 border border-stone-100 p-6 rounded-[2rem] hover:bg-white hover:border-stone-200 hover:shadow-xl transition-all duration-500">
                       <div className="aspect-square relative mb-4 bg-white rounded-2xl p-4 overflow-hidden">
                          {randomPerfume.image_url ? (
                            <img 
                              src={randomPerfume.image_url} 
                              alt={randomPerfume.name} 
                              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" 
                            />
                          ) : (
                            <div className="w-full h-full bg-stone-50 flex items-center justify-center text-[10px] text-stone-300">No Image</div>
                          )}
                       </div>
                       <div className="text-center">
                          <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-1 truncate">
                             {randomPerfume.brand?.name}
                          </div>
                          <h4 className="font-serif text-base text-stone-900 truncate mb-1">{randomPerfume.name}</h4>
                          <div className="flex items-center justify-center gap-1">
                             <span className="text-amber-400 text-[10px]">★</span>
                             <span className="text-[9px] font-bold text-stone-500 pt-0.5">{randomPerfume.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                       </div>
                    </Link>
                 </div>
               )}
            </div>
          </div>
        </div>
        
        <JoinCommunityCTA />
      </main>
    </PageTransition>
  );
}