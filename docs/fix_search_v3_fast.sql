-- 1. DROP existing function
DROP FUNCTION IF EXISTS search_perfumes(text);

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 3. CRITICAL: Index the Foreign Key
-- Without this, every search that joins 'brands' does a full table scan of 'perfumes'.
CREATE INDEX IF NOT EXISTS idx_perfumes_brand_id ON perfumes(brand_id);

-- 4. Text Search Indexes (GIN)
CREATE INDEX IF NOT EXISTS idx_perfumes_name_trgm ON perfumes USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm ON brands USING gin (name gin_trgm_ops);

-- 5. SIMPLIFIED & FAST SEARCH FUNCTION
-- Reverted to a single query structure which is often friendlier to the Query Planner
-- than UNIONs when sorting/limits are involved.
CREATE OR REPLACE FUNCTION search_perfumes(keyword text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  image_url text,
  brand_name text,
  similarity_score real
) AS $$
DECLARE
  -- Lower the threshold slightly to catch more results, 
  -- but rely on ORDER BY to push good ones to top.
  _threshold real := 0.2;
BEGIN
  -- Set the similarity threshold for the % operator
  PERFORM set_limit(_threshold);

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.image_url,
    b.name as brand_name,
    GREATEST(similarity(p.name, keyword), similarity(b.name, keyword)) as similarity_score
  FROM
    perfumes p
  JOIN
    brands b ON p.brand_id = b.id
  WHERE
    -- 1. Exact/Prefix matches (Fastest, uses B-Tree or Text Pattern ops if avail)
    p.name ILIKE keyword || '%'
    OR b.name ILIKE keyword || '%'
    -- 2. Fuzzy matches (Uses GIN Index via % operator)
    OR p.name % keyword 
    OR b.name % keyword
  ORDER BY
    -- 1. Exact Prefix Match on Perfume Name (User types "Dio" -> "Dior")
    (p.name ILIKE keyword || '%') DESC,
    -- 2. Exact Prefix Match on Brand Name
    (b.name ILIKE keyword || '%') DESC,
    -- 3. Similarity Score
    similarity_score DESC
  LIMIT 12;
END;
$$ LANGUAGE plpgsql;
