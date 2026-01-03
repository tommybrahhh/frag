-- This script fixes the "structure of query does not match function result type" error
-- by explicitly casting the created_at column to the correct TIMESTAMPTZ type.

-- Drop the function again to be safe
DROP FUNCTION IF EXISTS get_comments_with_upvotes(p_perfume_id UUID, p_order_by TEXT);

-- Re-create the function with the timestamp cast
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
            c.created_at::TIMESTAMPTZ, -- Explicitly cast the column
            c.content,
            c.user_id,
            c.perfume_id,
            c.user_name,
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
            c.created_at::TIMESTAMPTZ, -- Explicitly cast the column
            c.content,
            c.user_id,
            c.perfume_id,
            c.user_name,
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
