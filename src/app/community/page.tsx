import { Suspense } from 'react';
import { getRecentActivity, getTopContributors, getMostDiscussedPerfumes } from '@/lib/services/communityService';
import CommunityFeed from '@/components/features/community/CommunityFeed';
import TopContributors from '@/components/features/community/TopContributors';
import ActiveDiscussions from '@/components/features/community/ActiveDiscussions';
import Spinner from '@/components/ui/Spinner';
import { MessageCircle, Users, Trophy } from 'lucide-react';

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
    <main className="min-h-screen bg-stone-50 pb-20 selection:bg-stone-900 selection:text-stone-50">
      {/* Header */}
      <div className="bg-stone-900 text-stone-50 py-16 md:py-24 px-6 border-b border-stone-800 relative overflow-hidden">
        {/* Subtle decorative element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-stone-800/20 to-transparent pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-1 rounded-full bg-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">Shared Notes</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl mb-8 tracking-tight">
            The <span className="italic text-stone-400">Common</span> Room
          </h1>
          <p className="text-lg md:text-xl text-stone-400 max-w-2xl font-light leading-relaxed">
            A space for the scents that move us. Read what others are wearing, share your latest obsession, and find your next favorite through the people who know best.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16">
        
        {/* Left Column: The Feed (Main Content) */}
        <div className="space-y-12">
           <div className="flex items-center justify-between border-b border-stone-200 pb-6">
              <h2 className="font-serif text-3xl text-stone-900">
                 Recent Conversations
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Happening now</span>
              </div>
           </div>
           
           <Suspense fallback={<div className="py-20 flex justify-center"><Spinner /></div>}>
              <CommunityFeed initialActivity={activity} />
           </Suspense>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-16">
           
           {/* Top Contributors */}
           <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="font-serif text-2xl text-stone-900">Top Voices</h3>
                 <Trophy className="w-4 h-4 text-stone-400" />
              </div>
              <TopContributors contributors={contributors} />
           </div>

           {/* Active Discussions */}
           <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="font-serif text-2xl text-stone-900">Getting Attention</h3>
                 <MessageCircle className="w-4 h-4 text-stone-400" />
              </div>
              <ActiveDiscussions discussions={discussions} />
           </div>
           
           {/* Join CTA for Sidebar */}
           <div className="bg-stone-900 text-stone-50 p-10 rounded-[40px] text-center shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200/50 via-stone-500/50 to-amber-200/50" />
              <h4 className="font-serif text-2xl mb-4">Pull up a <span className="italic">chair.</span></h4>
              <p className="text-stone-400 text-sm mb-8 leading-relaxed font-light">Join thousands of others documenting their scent journeys. It&apos;s better when we talk about it.</p>
              <a href="/login?mode=signup" className="block w-full py-4 bg-stone-50 text-stone-900 font-bold text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-white transition-all duration-300">
                 Join the Circle
              </a>
           </div>

        </div>

      </div>
    </main>
  );
}
