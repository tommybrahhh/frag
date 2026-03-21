import { Suspense } from 'react';
import { getRecentActivity, getTopContributors, getMostDiscussedPerfumes } from '@/lib/services/communityService';
import CommunityFeed from '@/components/features/community/CommunityFeed';
import TopContributors from '@/components/features/community/TopContributors';
import ActiveDiscussions from '@/components/features/community/ActiveDiscussions';
import Spinner from '@/components/ui/Spinner';
import { MessageCircle, Trophy, Activity } from 'lucide-react';

export const runtime = "edge";

export const metadata = {
  title: 'Community | Fragrance App',
  description: 'Join the conversation, see what others are wearing, and discover new scents through community reviews.',
};

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const [activity, contributors, discussions] = await Promise.all([
    getRecentActivity(30),
    getTopContributors(5),
    getMostDiscussedPerfumes(5)
  ]);

  return (
    <main className="min-h-screen bg-[#FAFAF9] pb-20 selection:bg-stone-900 selection:text-stone-50">
      {/* REFINED HERO SECTION */}
      <div className="bg-stone-50/50 border-b border-stone-100 pt-8 pb-10 overflow-hidden">
         <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col items-center text-center">
            
            <div className="flex items-center gap-3 mb-4 px-4 py-1.5 bg-white rounded-full border border-stone-200 shadow-sm">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-900"></span>
               </span>
               <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-900">Live Collective Feed</span>
            </div>
            
            <h1 className="font-serif text-3xl md:text-4xl text-stone-900 mb-2 tracking-tight">
               The Community
            </h1>
            
            <p className="text-sm md:text-base text-stone-500 max-w-xl font-light leading-relaxed">
               A real-time stream of what our enthusiasts are discovering, reviewing, and recommending right now.
            </p>
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-20">
          
          {/* Main Feed Section */}
          <section>
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-stone-200">
               <Activity className="w-5 h-5 text-stone-900" />
               <h2 className="font-serif text-2xl text-stone-900">Activity Stream</h2>
            </div>
            
            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 md:p-10">
               <Suspense fallback={<div className="py-32 flex justify-center"><Spinner /></div>}>
                 <CommunityFeed initialActivity={activity} />
               </Suspense>

               <button className="mt-10 w-full py-4 border border-stone-200 rounded-2xl bg-stone-50 font-bold text-[10px] uppercase tracking-[0.2em] text-stone-600 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300">
                 Load More Activity
               </button>
            </div>
          </section>

          {/* Sidebar Section */}
          <aside className="space-y-10 lg:space-y-12">
            
            {/* Top Contributors */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
                <Trophy className="w-4 h-4 text-stone-900" />
                <h3 className="font-serif text-xl text-stone-900">Top Voices</h3>
              </div>
              <TopContributors contributors={contributors} />
            </div>

            {/* Active Discussions */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
                <MessageCircle className="w-4 h-4 text-stone-900" />
                <h3 className="font-serif text-xl text-stone-900">Trending Now</h3>
              </div>
              <ActiveDiscussions discussions={discussions} />
            </div>
            
            {/* Soft, Luxurious CTA */}
            <div className="bg-stone-50 rounded-3xl border border-stone-100 p-8 md:p-10 text-center">
              <h4 className="font-serif text-2xl mb-3 text-stone-900">Share your story</h4>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed font-light">
                 Join the collective database. Your reviews shape the global consensus.
              </p>
              <a href="/login?mode=signup" className="block w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-stone-800 transition-all duration-300">
                 Authenticate & Join
              </a>
            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}
