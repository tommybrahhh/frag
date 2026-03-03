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
    <main className="min-h-screen bg-white pb-20 selection:bg-stone-900 selection:text-stone-50">
      {/* Refined Clean Hero Section */}
      <div className="bg-stone-50/50 border-b border-stone-100 pt-16 pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Community</span>
                <div className="w-10 h-[1px] bg-stone-200" />
              </div>
              
              <h1 className="font-serif text-5xl md:text-6xl text-stone-900 mb-8 tracking-tight">
                The Community
              </h1>
              
              <p className="text-lg text-stone-500 max-w-xl font-light leading-relaxed">
                Connect with fragrance enthusiasts. Share reviews, discover new scents, and join the global conversation.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16 lg:gap-24">
          
          {/* Main Feed Section */}
          <section className="space-y-12">
            <div className="flex items-center justify-between gap-6 pb-6 border-b border-stone-100">
              <h2 className="font-serif text-2xl text-stone-900">Latest Activity</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Live</span>
              </div>
            </div>
            
            <Suspense fallback={<div className="py-20 flex justify-center"><Spinner /></div>}>
              <CommunityFeed initialActivity={activity} />
            </Suspense>

            <button className="w-full py-4 border border-stone-100 rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:bg-stone-50 hover:text-stone-900 transition-all duration-300">
              Load More
            </button>
          </section>

          {/* Sidebar Section */}
          <aside className="space-y-16">
            
            {/* Top Contributors */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif text-xl text-stone-900">Top Voices</h3>
                <Trophy className="w-4 h-4 text-stone-300" />
              </div>
              <TopContributors contributors={contributors} />
            </div>

            {/* Active Discussions */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif text-xl text-stone-900">Trending Now</h3>
                <MessageCircle className="w-4 h-4 text-stone-300" />
              </div>
              <ActiveDiscussions discussions={discussions} />
            </div>
            
            {/* Simple Join CTA */}
            <div className="bg-stone-50 p-8 rounded-xl border border-stone-100 text-center">
              <h4 className="font-serif text-xl mb-3 text-stone-900">Share your story</h4>
              <p className="text-stone-500 text-xs mb-8 leading-relaxed font-light">Join our collective of enthusiasts and professionals.</p>
              <a href="/login?mode=signup" className="block w-full py-3 bg-stone-900 text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-lg hover:bg-stone-800 transition-all duration-300">
                 Join the Collective
              </a>
            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}
