-- 1. DROP the existing function to allow a clean rebuild
DROP FUNCTION IF EXISTS search_perfumes(text);

-- 2. Ensure Extensions & Indexes (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for Perfume Names (Speed up name search)
CREATE INDEX IF NOT EXISTS idx_perfumes_name_trgm ON perfumes USING gin (name gin_trgm_ops);

-- Index for Brand Names (Speed up brand search)
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm ON brands USING gin (name gin_trgm_ops);

-- 3. OPTIMIZED SEARCH FUNCTION (Using UNION for Index Isolation)
CREATE OR REPLACE FUNCTION search_perfumes(keyword text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  image_url text,
  brand_name text,
  similarity_score real
) AS $$
BEGIN
  RETURN QUERY
  WITH combined_results AS (
    -- Query 1: Find by Perfume Name (Uses perfumes_name_trgm index purely)
    SELECT
      p.id,
      p.name,
      p.slug,
      p.image_url,
      p.brand_id,
      similarity(p.name, keyword) as score,
      1 as match_type -- 1 = Perfume Match
    FROM perfumes p
    WHERE p.name ILIKE '%' || keyword || '%' 
       OR similarity(p.name, keyword) > 0.3
    
    UNION ALL

    -- Query 2: Find by Brand Name (Uses brands_name_trgm index purely)
    SELECT
      p.id,
      p.name,
      p.slug,
      p.image_url,
      p.brand_id,
      similarity(b.name, keyword) as score,
      2 as match_type -- 2 = Brand Match
    FROM brands b
    JOIN perfumes p ON b.id = p.brand_id
    WHERE b.name ILIKE '%' || keyword || '%'
       OR similarity(b.name, keyword) > 0.3
  )
  SELECT DISTINCT ON (cr.id) -- Deduplicate if matched both ways
    cr.id,
    cr.name,
    cr.slug,
    cr.image_url,
    b.name as brand_name,
    cr.score as similarity_score
  FROM combined_results cr
  JOIN brands b ON cr.brand_id = b.id
  ORDER BY 
    cr.id, -- Required for DISTINCT ON
    -- Custom Ranking Logic
    CASE 
        -- Exact prefix match on Perfume Name is #1 Priority
        WHEN cr.match_type = 1 AND cr.name ILIKE keyword || '%' THEN 10.0
        -- Exact prefix match on Brand Name is #2 Priority
        WHEN cr.match_type = 2 AND b.name ILIKE keyword || '%' THEN 9.0
        ELSE cr.score
    END DESC
  LIMIT 12;
END;
$$ LANGUAGE plpgsql;
