-- This script creates a PostgreSQL function to fetch comments for a specific perfume.
-- It efficiently joins comments with user profiles and aggregates upvote data in a single query.
-- This is much more performant than fetching comments and then profiles separately on the client.

CREATE OR REPLACE FUNCTION get_comments_with_upvotes(p_perfume_id UUID)
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
        (SELECT COUNT(*) FROM public.comment_upvotes cu WHERE cu.comment_id = c.id) as upvote_count,
        EXISTS(SELECT 1 FROM public.comment_upvotes cu WHERE cu.comment_id = c.id AND cu.user_id = auth.uid()) as user_has_upvoted,
        jsonb_build_object(
            'avatar_url', p.avatar_url,
            'is_verified', p.is_verified
        ) as profile
    FROM
        public.comments c
    LEFT JOIN
        public.profiles p ON c.user_id = p.id
    WHERE
        c.perfume_id = p_perfume_id;
END;
$$ LANGUAGE plpgsql;
