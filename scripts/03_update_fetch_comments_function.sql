-- This script updates the 'get_comments_with_upvotes' function to be more performant.
-- It replaces correlated subqueries with a single LEFT JOIN and GROUP BY,
-- which significantly speeds up comment fetching and prevents timeouts.

-- Drop the old function definition if it exists.
DROP FUNCTION IF EXISTS get_comments_with_upvotes(uuid, text);
DROP FUNCTION IF EXISTS get_comments_with_upvotes(uuid);


-- Create the new, optimized function.
CREATE OR REPLACE FUNCTION get_comments_with_upvotes(p_perfume_id UUID, p_order_by TEXT DEFAULT 'created_at')
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    content TEXT,
    user_id UUID,
    perfume_id UUID,
    user_name TEXT,
    upvote_count BIGINT,
    user_has_upvoted BOOLEAN,
    profile jsonb
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.created_at,
        c.content,
        c.user_id,
        c.perfume_id,
        c.user_name,
        COALESCE(upvote_counts.count, 0) as upvote_count,
        EXISTS(
            SELECT 1
            FROM public.comment_upvotes cu
            WHERE cu.comment_id = c.id AND cu.user_id = auth.uid()
        ) as user_has_upvoted,
        jsonb_build_object('avatar_url', p.avatar_url, 'is_verified', p.is_verified) as profile
    FROM
        public.comments c
    LEFT JOIN
        public.profiles p ON c.user_id = p.id
    LEFT JOIN (
        SELECT comment_id, COUNT(*) as count
        FROM public.comment_upvotes
        GROUP BY comment_id
    ) as upvote_counts ON c.id = upvote_counts.comment_id
    WHERE
        c.perfume_id = p_perfume_id
    ORDER BY
        CASE
            WHEN p_order_by = 'upvote_count' THEN COALESCE(upvote_counts.count, 0)
            ELSE 0 
        END DESC,
        c.created_at DESC;
END;
$$ LANGUAGE plpgsql;