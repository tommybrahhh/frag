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
      <div className="bg-stone-900 text-stone-50 py-16 md:py-20 px-6 border-b border-stone-800">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-1 rounded-full bg-stone-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">The Circle</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl mb-6 tracking-tight">
            The Scent <span className="italic text-stone-400">Circle</span>
          </h1>
          <p className="text-base md:text-lg text-stone-400 max-w-xl font-light leading-relaxed">
            A collective record of personal journeys, honest reviews, and olfactory discoveries.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16">
        
        {/* Left Column: The Feed (Main Content) */}
        <div className="space-y-12">
           <div className="flex items-center justify-between border-b border-stone-200 pb-6">
              <h2 className="font-serif text-3xl text-stone-900">
                 Latest Comments
              </h2>
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Live Feed</div>
           </div>
           
           <Suspense fallback={<div className="py-20 flex justify-center"><Spinner /></div>}>
              <CommunityFeed initialActivity={activity} />
           </Suspense>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-16">
           
           {/* Top Contributors */}
           <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="font-serif text-2xl text-stone-900">Contributors</h3>
                 <Trophy className="w-4 h-4 text-stone-400" />
              </div>
              <TopContributors contributors={contributors} />
           </div>

           {/* Active Discussions */}
           <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="font-serif text-2xl text-stone-900">Trending</h3>
                 <MessageCircle className="w-4 h-4 text-stone-400" />
              </div>
              <ActiveDiscussions discussions={discussions} />
           </div>
           
           {/* Join CTA for Sidebar */}
           <div className="bg-stone-900 text-stone-50 p-10 rounded-[40px] text-center shadow-xl">
              <h4 className="font-serif text-2xl mb-4 italic">Join Scentia</h4>
              <p className="text-stone-400 text-sm mb-8 leading-relaxed">Build your collection, share your thoughts, and level up your profile.</p>
              <a href="/login?mode=signup" className="block w-full py-4 bg-stone-50 text-stone-900 font-bold text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-stone-200 transition-all duration-300">
                 Create Account
              </a>
           </div>

        </div>

      </div>
    </main>
  );
}
