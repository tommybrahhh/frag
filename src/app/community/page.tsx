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
    <main className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <div className="bg-stone-900 text-white py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Community Hub</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl mb-6">
            The Scent Circle
          </h1>
          <p className="text-lg text-stone-300 max-w-2xl font-light leading-relaxed">
            See what's happening right now. Real reviews, fresh debates, and the people making this community smell amazing.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Column: The Feed (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-stone-900 flex items-center gap-3">
                 <MessageCircle className="w-5 h-5 text-stone-400" />
                 Fresh Activity
              </h2>
           </div>
           
           <Suspense fallback={<div className="py-20 flex justify-center"><Spinner /></div>}>
              <CommunityFeed initialActivity={activity} />
           </Suspense>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-12">
           
           {/* Top Contributors */}
           <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                 <Trophy className="w-5 h-5 text-yellow-500" />
                 <h3 className="font-serif text-xl text-stone-900">Top Contributors</h3>
              </div>
              <TopContributors contributors={contributors} />
           </div>

           {/* Active Discussions */}
           <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                 <Users className="w-5 h-5 text-purple-500" />
                 <h3 className="font-serif text-xl text-stone-900">Top Fragrances</h3>
              </div>
              <ActiveDiscussions discussions={discussions} />
           </div>
           
           {/* Join CTA for Sidebar */}
           <div className="bg-stone-900 text-white p-8 rounded-2xl text-center">
              <h4 className="font-serif text-xl mb-3">Join the Conversation</h4>
              <p className="text-stone-400 text-sm mb-6">Create your profile to start reviewing and building your collection.</p>
              <a href="/login?mode=signup" className="block w-full py-3 bg-white text-stone-900 font-bold text-xs uppercase tracking-widest rounded-full hover:bg-stone-200 transition-colors">
                 Sign Up Free
              </a>
           </div>

        </div>

      </div>
    </main>
  );
}
