create or replace function get_community_stats()
returns json
language plpgsql
security definer
as $$
declare
  perfumes_count bigint;
  brands_count bigint;
  members_count bigint;
  reviews_count bigint;
  comments_count bigint;
begin
  select count(*) into perfumes_count from perfumes;
  select count(*) into brands_count from brands;
  select count(*) into members_count from profiles;
  select count(*) into reviews_count from reviews;
  select count(*) into comments_count from comments;

  return json_build_object(
    'perfumes', perfumes_count,
    'brands', brands_count,
    'members', members_count,
    'reviews', reviews_count + comments_count
  );
end;
$$;
