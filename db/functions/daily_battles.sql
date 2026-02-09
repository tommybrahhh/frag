-- Create a simple table to track daily battles
create table if not exists public.daily_battles (
  id uuid default gen_random_uuid() primary key,
  date date default current_date unique,
  perfume_a_id uuid references public.perfumes(id) not null,
  perfume_b_id uuid references public.perfumes(id) not null,
  votes_a int default 0,
  votes_b int default 0,
  created_at timestamp default now()
);

-- Policy: Everyone can read
alter table public.daily_battles enable row level security;
create policy "Public can read battles" on public.daily_battles for select using (true);

-- Policy: Everyone can update votes (simplified for engagement, ideally would be authenticated)
create policy "Public can vote" on public.daily_battles for update using (true);

-- Function to get or create today's battle
create or replace function get_or_create_daily_battle()
returns json
language plpgsql
security definer
as $$
declare
  today_battle record;
  p_a uuid;
  p_b uuid;
begin
  -- Check if battle exists for today
  select * into today_battle from daily_battles where date = current_date;
  
  if found then
    return row_to_json(today_battle);
  end if;

  -- Select 2 random popular perfumes (rating > 4.0)
  select id into p_a from perfumes where rating > 4.0 order by random() limit 1;
  
  -- If no perfumes > 4.0, fallback to any random ones (to prevent crash if db is small)
  if p_a is null then
     select id into p_a from perfumes order by random() limit 1;
  end if;

  select id into p_b from perfumes where id != p_a order by random() limit 1;
  
  if p_a is null or p_b is null then
     return null;
  end if;

  -- Create new battle
  insert into daily_battles (date, perfume_a_id, perfume_b_id)
  values (current_date, p_a, p_b)
  returning * into today_battle;

  return row_to_json(today_battle);
end;
$$;