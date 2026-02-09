-- Atomic vote increment
create or replace function increment_battle_vote(battle_uuid uuid, vote_side text)
returns void
language plpgsql
security definer
as $$
begin
  if vote_side = 'left' then
    update daily_battles set votes_a = votes_a + 1 where id = battle_uuid;
  elsif vote_side = 'right' then
    update daily_battles set votes_b = votes_b + 1 where id = battle_uuid;
  end if;
end;
$$;
