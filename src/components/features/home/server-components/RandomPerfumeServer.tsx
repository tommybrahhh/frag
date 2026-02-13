import { getRandomPerfume } from '@/lib/services/communityService';
import RandomPerfumeClient from '@/components/features/home/RandomPerfumeClient';

export default async function RandomPerfumeServer() {
  const randomPerfume = await getRandomPerfume();

  return (
    <RandomPerfumeClient randomPerfume={randomPerfume} />
  );
}
