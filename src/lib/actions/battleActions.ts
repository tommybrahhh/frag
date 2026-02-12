'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getDailyBattle() {
  const supabase = await createClient();
  
  try {
    // Add a timeout to the RPC call to prevent blocking the entire page
    const battlePromise = supabase.rpc('get_or_create_daily_battle');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Battle fetch timeout')), 5000)
    );

    // Race the RPC against a 5s timeout
    const { data: battleRecord, error } = await Promise.race([
      battlePromise,
      timeoutPromise as any
    ]);
    
    if (error || !battleRecord) {
      // Use warn for expected timeouts or non-critical failures
      console.warn('Daily battle skipped:', error?.message || 'No record returned');
      return null;
    }

    // Fetch full details for the two perfumes
    const { data: perfumes } = await supabase
      .from('perfumes')
      .select('id, name, slug, image_url, brand:brands(name)')
      .in('id', [battleRecord.perfume_a_id, battleRecord.perfume_b_id]);

    if (!perfumes || perfumes.length !== 2) return null;

    const left = perfumes.find(p => p.id === battleRecord.perfume_a_id);
    const right = perfumes.find(p => p.id === battleRecord.perfume_b_id);

    return {
      id: battleRecord.id,
      left: { ...left, votes: battleRecord.votes_a },
      right: { ...right, votes: battleRecord.votes_b },
      totalVotes: battleRecord.votes_a + battleRecord.votes_b
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
