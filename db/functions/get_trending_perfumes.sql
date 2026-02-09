-- Function to calculate trending perfumes based PRIMARILY on COMMENTS (Community Request)
-- Weights: Comments (10), Reviews (2), Collection Adds (1)
-- Returns top perfumes with a trend score

create or replace function get_trending_perfumes(
  period_days int default 30,
  limit_count int default 10
)
returns table (
  id uuid,
  name text,
  slug text,
  image_url text,
  brand_name text,
  rating numeric,
  trend_score bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with activity as (
    -- Count Comments (Highest Priority)
    select perfume_id, count(*) * 10 as score
    from comments
    where created_at > now() - (period_days || ' days')::interval
    group by perfume_id
    
    union all
    
    -- Count Reviews (Secondary)
    select perfume_id, count(*) * 2 as score
    from reviews
    where created_at > now() - (period_days || ' days')::interval
    group by perfume_id
    
    union all
    
    -- Count Collection Adds (Tertiary)
    select perfume_id, count(*) * 1 as score
    from user_collections
    where created_at > now() - (period_days || ' days')::interval
    group by perfume_id
  ),
  aggregated as (
    select activity.perfume_id, sum(activity.score) as total_score
    from activity
    group by activity.perfume_id
  )
  select 
    p.id,
    p.name,
    p.slug,
    p.image_url,
    b.name as brand_name,
    p.rating,
    a.total_score as trend_score
  from aggregated a
  join perfumes p on p.id = a.perfume_id
  left join brands b on b.id = p.brand_id
  order by a.total_score desc
  limit limit_count;
end;
$$;