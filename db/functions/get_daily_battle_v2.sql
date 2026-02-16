create or replace function get_or_create_daily_battle_v2()
returns json
language plpgsql
security definer
set statement_timeout = 2000
as $$
declare
  today_battle record;
  p_a_id uuid;
  p_b_id uuid;
  perfume_a json;
  perfume_b json;
begin
  -- 1. Check if battle exists for today
  select * into today_battle from daily_battles where date = current_date;
  
  if not found then
    -- 2. Select 2 random perfumes efficiently
    -- Correct syntax: TABLESAMPLE must come before WHERE
    select id into p_a_id from perfumes tablesample system(10) where rating > 4.0 limit 1;
    if p_a_id is null then select id into p_a_id from perfumes limit 1; end if;

    select id into p_b_id from perfumes tablesample system(10) where id != p_a_id limit 1;
    if p_b_id is null then select id into p_b_id from perfumes where id != p_a_id limit 1; end if;

    if p_a_id is null or p_b_id is null then return null; end if;

    -- 3. Create new battle
    insert into daily_battles (date, perfume_a_id, perfume_b_id)
    values (current_date, p_a_id, p_b_id)
    returning * into today_battle;
  end if;

  -- 4. Fetch perfume details
  select json_build_object(
    'id', p.id,
    'name', p.name,
    'slug', p.slug,
    'image_url', p.image_url,
    'brand', json_build_object('name', b.name)
  ) into perfume_a
  from perfumes p
  left join brands b on b.id = p.brand_id
  where p.id = today_battle.perfume_a_id;

  select json_build_object(
    'id', p.id,
    'name', p.name,
    'slug', p.slug,
    'image_url', p.image_url,
    'brand', json_build_object('name', b.name)
  ) into perfume_b
  from perfumes p
  left join brands b on b.id = p.brand_id
  where p.id = today_battle.perfume_b_id;

  return json_build_object(
    'id', today_battle.id,
    'votes_a', today_battle.votes_a,
    'votes_b', today_battle.votes_b,
    'perfume_a', perfume_a,
    'perfume_b', perfume_b
  );
end;
$$;
