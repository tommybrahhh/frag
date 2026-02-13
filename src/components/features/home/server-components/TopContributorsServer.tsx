import { getTopContributors } from '@/lib/services/communityService';
import TopContributorsClient from '@/components/features/home/TopContributorsClient';

export default async function TopContributorsServer() {
  const topContributors = await getTopContributors(5);

  return (
    <TopContributorsClient topContributors={topContributors} />
  );
}
