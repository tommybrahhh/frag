-- Function to get or create today's battle (Optimized)
create or replace function get_or_create_daily_battle()
returns json
language plpgsql
security definer
-- set a timeout for this specific function to avoid long running queries
set statement_timeout = 2000
as $$
declare
  today_battle record;
  p_a uuid;
  p_b uuid;
begin
  -- 1. Check if battle exists for today (Fast index scan)
  select * into today_battle from daily_battles where date = current_date;
  
  if found then
    return row_to_json(today_battle);
  end if;

  -- 2. Select 2 random perfumes efficiently (TABLESAMPLE is much faster than ORDER BY RANDOM())
  -- Note: TABLESAMPLE SYSTEM(10) picks a random 10% of pages, much faster for large tables.
  
  -- Try to get one high rated one first
  select id into p_a 
  from perfumes tablesample system(10) 
  where rating > 4.0 
  limit 1;
  
  -- Fallback if no high rated found in sample
  if p_a is null then
     select id into p_a from perfumes limit 1;
  end if;

  -- Get second one
  select id into p_b 
  from perfumes tablesample system(10) 
  where id != p_a 
  limit 1;
  
  -- Fallback for second one
  if p_b is null then
     select id into p_b from perfumes where id != p_a limit 1;
  end if;

  if p_a is null or p_b is null then
     return null;
  end if;

  -- 3. Create new battle
  insert into daily_battles (date, perfume_a_id, perfume_b_id)
  values (current_date, p_a, p_b)
  returning * into today_battle;

  return row_to_json(today_battle);
end;
$$;
