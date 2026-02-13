import { getRecentActivity, getCommunityStats } from '@/lib/services/communityService';
import CommunityHero from '@/components/features/home/CommunityHero';

export default async function CommunityHeroServer() {
  const [activityData, statsData] = await Promise.all([
    getRecentActivity(10),
    getCommunityStats(),
  ]);

  return (
    <CommunityHero activity={activityData} stats={statsData} />
  );
}
