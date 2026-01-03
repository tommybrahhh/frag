-- This script fixes the "Could not choose the best candidate function" error
-- by explicitly dropping all known versions of the function before creating the final, correct one.

-- Drop the version that takes two arguments
DROP FUNCTION IF EXISTS get_comments_with_upvotes(p_perfume_id UUID, p_order_by TEXT);

-- Drop the version that takes one argument
DROP FUNCTION IF EXISTS get_comments_with_upvotes(p_perfume_id UUID);

-- Re-create the function with the correct signature and logic
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
            c.id, c.created_at, c.content, c.user_id, c.perfume_id, c.user_name,
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
            c.id, c.created_at, c.content, c.user_id, c.perfume_id, c.user_name,
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
