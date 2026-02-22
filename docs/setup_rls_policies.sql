-- Row Level Security (RLS) Policies for Scentia

-- 1. PROFILES Table Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all profiles (for comments, etc.)
CREATE POLICY "Public read access for profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Allow users to update their own profiles
CREATE POLICY "Users can update their own profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. COMMENTS Table Policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all comments
CREATE POLICY "Public read access for comments"
ON public.comments
FOR SELECT
TO public
USING (is_visible IS NOT FALSE);

-- Allow authenticated users to insert their own comments
CREATE POLICY "Authenticated users can post comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. PERFUMES Table Policies (Already defined in fix_rls_policy.sql, but for completeness)
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable public read access to all perfumes"
ON public.perfumes
FOR SELECT
TO public
USING (true);
