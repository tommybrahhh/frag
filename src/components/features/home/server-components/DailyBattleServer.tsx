import { getDailyBattle } from '@/lib/actions/battleActions';
import DailyBattle from '@/components/features/home/DailyBattle';

export default async function DailyBattleServer() {
  const battleData = await getDailyBattle();

  return (
    <DailyBattle battle={battleData} />
  );
}
