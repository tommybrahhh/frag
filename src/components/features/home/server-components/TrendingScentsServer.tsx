import { getTrendingPerfumes } from '@/lib/services/communityService';
import TrendingScents from '@/components/features/home/TrendingScents';

export default async function TrendingScentsServer() {
  const trendingData = await getTrendingPerfumes(10);

  return (
    <TrendingScents perfumes={trendingData} />
  );
}
