import { createClient } from '@/utils/supabase/server';
import HomeClient from '@/components/features/home/HomeClient';
import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';
import { getRecentActivity, getTrendingPerfumes, getCommunityStats, getTopContributors, getRandomPerfume } from '@/lib/services/communityService';
import { getDailyBattle } from '@/lib/actions/battleActions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  // Parallel data fetching for better performance
  const [activityData, trendingData, battleData, statsData, contributorsData, randomPerfumeData] = await Promise.all([
    getRecentActivity(10),
    getTrendingPerfumes(10),
    getDailyBattle(),
    getCommunityStats(),
    getTopContributors(5),
    getRandomPerfume()
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <HomeClient 
        initialActivity={activityData}
        trendingPerfumes={trendingData}
        dailyBattle={battleData}
        communityStats={statsData}
        topContributors={contributorsData}
        randomPerfume={randomPerfumeData}
      />
    </Suspense>
  );
}