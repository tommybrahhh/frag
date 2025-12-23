-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable RLS on user_collections
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (handling various naming conventions)
DROP POLICY IF EXISTS "View own collection" ON public.user_collections;
DROP POLICY IF EXISTS "Add to own collection" ON public.user_collections;
DROP POLICY IF EXISTS "Remove from own collection" ON public.user_collections;
DROP POLICY IF EXISTS "Enable read access for own data" ON public.user_collections;
DROP POLICY IF EXISTS "Enable insert for own data" ON public.user_collections;
DROP POLICY IF EXISTS "Enable delete for own data" ON public.user_collections;

-- Create comprehensive policies
-- 1. SELECT: Users can view their own collection
CREATE POLICY "Enable read access for own data" 
ON public.user_collections 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. INSERT: Users can add to their own collection
CREATE POLICY "Enable insert for own data" 
ON public.user_collections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. DELETE: Users can remove from their own collection
CREATE POLICY "Enable delete for own data" 
ON public.user_collections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'user_collections';
