-- This script fixes the user name display issue in comments.
-- It updates the function to always fetch the latest 'display_name' from the 'profiles' table,
-- ensuring that even if a user updates their name, all their comments will show the new one.

-- Drop the function to ensure a clean update
DROP FUNCTION IF EXISTS get_comments_with_upvotes(p_perfume_id UUID, p_order_by TEXT);

-- Re-create the function with the corrected name source
CREATE OR REPLACE FUNCTION get_comments_with_upvotes(p_perfume_id UUID, p_order_by TEXT DEFAULT 'created_at')
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    content TEXT,
    user_id UUID,
    perfume_id UUID,
    user_name TEXT, -- This will now be populated by the profile's display_name
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
            p.display_name AS user_name, -- FIX: Get name from profiles table
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
            p.display_name AS user_name, -- FIX: Get name from profiles table
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