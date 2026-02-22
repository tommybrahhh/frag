DROP FUNCTION IF EXISTS get_perfume_comments(UUID);

CREATE OR REPLACE FUNCTION get_perfume_comments(p_perfume_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  perfume_id UUID,
  content TEXT,
  user_name TEXT,
  created_at TIMESTAMP,
  avatar_url TEXT,
  is_verified BOOLEAN,
  is_owner BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.perfume_id,
    c.content,
    COALESCE(p.display_name, c.user_name) as user_name,
    c.created_at,
    p.avatar_url,
    COALESCE(p.is_verified, false) as is_verified,
    EXISTS (
      SELECT 1 
      FROM user_collections uc 
      WHERE uc.user_id = c.user_id 
        AND uc.perfume_id = c.perfume_id 
        AND uc.list_type = 'owned'
    ) as is_owner
  FROM comments c
  LEFT JOIN profiles p ON p.id = c.user_id
  WHERE c.perfume_id = p_perfume_id
    AND (c.is_visible = true OR c.is_visible IS NULL)
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
