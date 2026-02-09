import { createClient } from '@/utils/supabase/server';
import HomeClient from '@/components/features/home/HomeClient';
import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';
import { getPerfumes } from '@/lib/services/perfumeService';
import { getRecentActivity, getTrendingPerfumes, getCommunityStats } from '@/lib/services/communityService';
import { getDailyBattle } from '@/lib/actions/battleActions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  // Parallel data fetching for better performance
  const [activityData, trendingData, perfumesResult, battleData, statsData] = await Promise.all([
    getRecentActivity(10),
    getTrendingPerfumes(10),
    getPerfumes({ page: 1, limit: 24 }),
    getDailyBattle(),
    getCommunityStats()
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <HomeClient 
        initialActivity={activityData}
        trendingPerfumes={trendingData}
        initialPerfumes={(perfumesResult.data as any[]) || []}
        dailyBattle={battleData}
        communityStats={statsData}
      />
    </Suspense>
  );
}