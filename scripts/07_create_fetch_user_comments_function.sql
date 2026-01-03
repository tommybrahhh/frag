-- This script creates a PostgreSQL function to fetch all comments for a specific user.
-- It joins with the perfume and brand tables to return all necessary data in one call.
-- Using SECURITY DEFINER can help bypass RLS policies that might prevent a user from reading their own comments.

CREATE OR REPLACE FUNCTION get_user_comments(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    content TEXT,
    perfume_id UUID,
    perfume_name TEXT,
    perfume_image_url TEXT,
    brand_name TEXT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.created_at,
        c.content,
        c.perfume_id,
        p.name as perfume_name,
        p.image_url as perfume_image_url,
        b.name as brand_name
    FROM
        public.comments c
    LEFT JOIN
        public.perfumes p ON c.perfume_id = p.id
    LEFT JOIN
        public.brands b ON p.brand_id = b.id
    WHERE
        c.user_id = p_user_id
    ORDER BY
        c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
