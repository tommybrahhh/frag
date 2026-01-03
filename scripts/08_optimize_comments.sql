-- Optimize comments fetching performance
-- This script addresses the "Request timed out" error by adding missing indexes 
-- and ensuring the comments fetching function is efficient.

-- 1. Ensure index on comments.perfume_id exists (Crucial for filtering comments by perfume)
-- Without this, fetching comments for a specific perfume performs a sequential scan on the entire comments table.
CREATE INDEX IF NOT EXISTS idx_comments_perfume_id ON public.comments(perfume_id);

-- 2. Ensure index on comment_upvotes.comment_id exists (Crucial for counting upvotes)
-- This speeds up the counting and existence checks for upvotes.
CREATE INDEX IF NOT EXISTS idx_comment_upvotes_comment_id ON public.comment_upvotes(comment_id);

-- 3. Analyze tables to update statistics so the query planner knows about the new indexes
ANALYZE public.comments;
ANALYZE public.comment_upvotes;

-- 4. Re-apply the function definition to ensure it matches the expected signature and logic.
-- This version uses the same logic as 06_fix_comment_author_name.sql but benefits from the indexes.

DROP FUNCTION IF EXISTS get_comments_with_upvotes(p_perfume_id UUID, p_order_by TEXT);

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
    IF p_order_by = 'upvote_count' THEN
        RETURN QUERY
        SELECT
            c.id,
            c.created_at::TIMESTAMPTZ,
            c.content,
            c.user_id,
            c.perfume_id,
            p.display_name AS user_name,
            (SELECT COUNT(*) FROM public.comment_upvotes cu WHERE cu.comment_id = c.id) as upvote_count,
            EXISTS(SELECT 1 FROM public.comment_upvotes cu WHERE cu.comment_id = c.id AND cu.user_id = auth.uid()) as user_has_upvoted,
            jsonb_build_object('avatar_url', p.avatar_url, 'is_verified', p.is_verified) as profile
        FROM
            public.comments c LEFT JOIN public.profiles p ON c.user_id = p.id
        WHERE
            c.perfume_id = p_perfume_id
        ORDER BY
            upvote_count DESC, c.created_at DESC;
    ELSE
        RETURN QUERY
        SELECT
            c.id,
            c.created_at::TIMESTAMPTZ,
            c.content,
            c.user_id,
            c.perfume_id,
            p.display_name AS user_name,
            (SELECT COUNT(*) FROM public.comment_upvotes cu WHERE cu.comment_id = c.id) as upvote_count,
            EXISTS(SELECT 1 FROM public.comment_upvotes cu WHERE cu.comment_id = c.id AND cu.user_id = auth.uid()) as user_has_upvoted,
            jsonb_build_object('avatar_url', p.avatar_url, 'is_verified', p.is_verified) as profile
        FROM
            public.comments c LEFT JOIN public.profiles p ON c.user_id = p.id
        WHERE
            c.perfume_id = p_perfume_id
        ORDER BY
            c.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;
