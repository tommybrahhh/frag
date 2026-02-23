import { Suspense } from 'react';
import { getRecentActivity, getTopContributors, getMostDiscussedPerfumes } from '@/lib/services/communityService';
import CommunityFeed from '@/components/features/community/CommunityFeed';
import TopContributors from '@/components/features/community/TopContributors';
import ActiveDiscussions from '@/components/features/community/ActiveDiscussions';
import Spinner from '@/components/ui/Spinner';
import { MessageCircle, Trophy } from 'lucide-react';

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
    <main className="min-h-screen bg-[#F9F8F6] pb-20 selection:bg-stone-900 selection:text-stone-50">
      {/* Compact Editorial Hero Section */}
      <div className="relative bg-[#1A1A1A] text-stone-50 pt-12 pb-16 md:pt-14 md:pb-20 px-6 overflow-hidden">
        {/* Abstract Decorative Background */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-5">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-200/20 blur-[120px] rounded-full" />
        </div>
        
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4 group cursor-default">
                <div className="w-6 h-[1px] bg-amber-400/50 group-hover:w-10 transition-all duration-500" />
                <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-stone-500">The Collective</span>
              </div>
              
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4 tracking-tighter leading-tight">
                The <span className="italic font-light text-stone-400">Common</span> Room
              </h1>
              
              <p className="text-base md:text-lg text-stone-400 max-w-xl font-light leading-relaxed mb-8 opacity-80">
                A curated space for the fragrances that define our moments.
              </p>

              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-stone-600 mb-0.5">Active Now</span>
                  <span className="text-lg font-serif">1.2k</span>
                </div>
                <div className="w-[1px] h-4 bg-stone-800" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-stone-600 mb-0.5">Reviews</span>
                  <span className="text-lg font-serif">450+</span>
                </div>
              </div>
            </div>

            {/* Featured Quote - Minimal */}
            <div className="hidden lg:block max-w-[200px]">
              <div className="p-5 border border-stone-800/40 rounded-xl bg-white/5 backdrop-blur-sm">
                <p className="text-[11px] text-stone-400 italic leading-relaxed font-light">
                  "Fragrance is the most intense form of memory."
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#F9F8F6] to-transparent" />
      </div>

      <div className="max-w-[1300px] mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-20">
          
          {/* Main Feed Section */}
          <section className="space-y-12">
            <div className="flex items-end justify-between gap-6 pb-8 border-b border-stone-200/60">
              <div>
                <h2 className="font-serif text-3xl text-stone-900 mb-1">Recent Conversations</h2>
                <p className="text-stone-500 text-sm font-light italic">Latest reviews and stories from the community.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full border border-stone-100">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Latest Activity</span>
              </div>
            </div>
            
            <Suspense fallback={<div className="py-20 flex justify-center"><Spinner /></div>}>
              <CommunityFeed initialActivity={activity} />
            </Suspense>

            <button className="w-full py-5 border border-stone-200 rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] text-stone-500 hover:bg-stone-900 hover:text-stone-50 transition-all duration-300">
              View Older Activity
            </button>
          </section>

          {/* Sidebar Section */}
          <aside className="space-y-12">
            
            {/* Top Contributors Card */}
            <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <div>
                  <h3 className="font-serif text-xl text-stone-900">Top Voices</h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mt-1">Most active in discussions</p>
                 </div>
                 <Trophy className="w-4 h-4 text-amber-500/70" />
              </div>
              <TopContributors contributors={contributors} />
            </div>

            {/* Active Discussions Card */}
            <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif text-xl text-stone-900">Trending Now</h3>
                <MessageCircle className="w-4 h-4 text-stone-400" />
              </div>
              <ActiveDiscussions discussions={discussions} />
            </div>
            
            {/* Join CTA */}
            <div className="bg-[#1A1A1A] text-stone-50 p-10 rounded-[32px] text-center shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="font-serif text-2xl mb-4">Leave your <span className="italic">mark.</span></h4>
                <p className="text-stone-400 text-xs mb-8 leading-relaxed font-light px-4">Join our collective of enthusiasts and professionals.</p>
                <a href="/login?mode=signup" className="block w-full py-4 bg-stone-50 text-stone-900 font-bold text-[9px] uppercase tracking-[0.3em] rounded-full hover:bg-amber-100 transition-all duration-300">
                   Enter the Circle
                </a>
              </div>
            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}
