create or replace function get_random_perfume()
returns json
language plpgsql
security definer
as $$
declare
  random_perfume record;
begin
  -- TABLESAMPLE must come immediately after the table name/alias in the FROM clause
  select 
    p.id,
    p.name,
    p.slug,
    p.image_url,
    p.rating,
    json_build_array(json_build_object('name', b.name)) as brand
  into random_perfume
  from perfumes p tablesample system (10)
  join brands b on p.brand_id = b.id
  limit 1;

  -- Fallback if TABLESAMPLE returned nothing (common on very small tables or unlucky samples)
  if random_perfume is null then
    select 
      p.id,
      p.name,
      p.slug,
      p.image_url,
      p.rating,
      json_build_array(json_build_object('name', b.name)) as brand
    into random_perfume
    from perfumes p
    join brands b on p.brand_id = b.id
    order by random()
    limit 1;
  end if;

  return row_to_json(random_perfume);
end;
$$;
