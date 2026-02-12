-- Function to get email by username (display_name)
-- This allows users to sign in with their username instead of email
CREATE OR REPLACE FUNCTION get_email_by_username(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
    found_email TEXT;
BEGIN
    -- Search for the user in public.profiles first
    SELECT u.email INTO found_email
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id
    WHERE p.display_name = username_input
       OR p.display_name ILIKE username_input
    LIMIT 1;

    RETURN found_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile when a new user signs up
-- This ensures the display_name is captured from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uncomment the following lines to create the trigger if it doesn't exist
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
