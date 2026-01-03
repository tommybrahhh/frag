-- This script creates a temporary debug function to bypass RLS for perfume searches.
-- By using SECURITY DEFINER, it runs with the permissions of the owner,
-- allowing us to test if a Row Level Security policy is causing the query to hang.

CREATE OR REPLACE FUNCTION debug_search_perfumes(p_query TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    image_url TEXT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.image_url
    FROM
        public.perfumes p
    WHERE
        p.name ILIKE '%' || p_query || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
