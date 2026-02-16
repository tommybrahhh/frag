'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getDailyBattle() {
  const supabase = await createClient();
  
  try {
    // Use the optimized V2 RPC that returns everything in one go
    const { data: battleData, error } = await supabase.rpc('get_or_create_daily_battle_v2');
    
    if (error || !battleData) {
      console.warn('Daily battle fetch failed:', error?.message || 'No record returned');
      return null;
    }

    return {
      id: battleData.id,
      left: { 
        ...battleData.perfume_a, 
        votes: battleData.votes_a 
      },
      right: { 
        ...battleData.perfume_b, 
        votes: battleData.votes_b 
      },
      totalVotes: battleData.votes_a + battleData.votes_b
    };
  } catch (err) {
    console.error('Unexpected error in getDailyBattle:', err);
    return null;
  }
}

export async function voteInBattle(battleId: string, side: 'left' | 'right') {
  const supabase = await createClient();
  
  const column = side === 'left' ? 'votes_a' : 'votes_b';
  
  // Atomic increment
  /* 
     Note: In a real high-scale app, we'd use a separate votes table. 
     For this scale, direct increment is fine.
     We use rpc or raw sql for atomic update, or just standard update if low concurrency.
     Let's use a simple RPC for safety if we wanted, but standard update is okay for now 
     as long as we don't care about perfect precision under heavy load.
     
     Actually, let's just do a direct increment.
  */
 
  // We need to fetch current first to increment (optimistic) or use a SQL function.
  // Let's write a quick SQL function for atomic vote.
  
  const { error } = await supabase.rpc('increment_battle_vote', { 
    battle_uuid: battleId, 
    vote_side: side 
  });

  if (error) {
     console.error("Vote failed", error);
     return { success: false };
  }

  revalidatePath('/');
  return { success: true };
}
