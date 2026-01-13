-- FIX: Row Level Security (RLS) Policy for Public Perfume Access
--
-- PROBLEM:
-- The perfume page (e.g., /perfume/dior-sauvage) fails when using a 'slug' in the URL 
-- because the underlying database query is blocked by Row Level Security (RLS).
-- The application uses the public anonymous key to query the database, which is subject to RLS.
-- The existing RLS policy on the 'perfumes' table does not allow read access for non-authenticated users 
-- or when querying by the 'slug' column.
--
-- SOLUTION:
-- This script creates a new, permissive RLS policy on the 'perfumes' table.
-- This policy grants read-only ('SELECT') access to everyone ('public').
-- The `USING (true)` clause means it applies to all rows, allowing lookups by any column,
-- including both 'id' and 'slug'.
--
-- USAGE:
-- 1. Go to your Supabase project's dashboard.
-- 2. Navigate to the "SQL Editor".
-- 3. Paste the entire content of this script into the editor.
-- 4. Click the "Run" button.
--
-- After applying this, the perfume pages should load correctly using slugs in the URL.

-- Drop the existing policy first, if it exists, to avoid conflicts.
-- You may need to replace "Enable read access for all users" with the actual name of your existing policy.
-- Look in Database -> Policies to find the name. If you are unsure, you can skip this line,
-- but you might get an error if a conflicting policy exists.
-- 
-- Example of a possible existing policy name to drop:
-- DROP POLICY IF EXISTS "Public can read all perfumes" ON public.perfumes;


-- Create the new policy that allows general read access.
CREATE POLICY "Enable public read access to all perfumes"
ON public.perfumes
FOR SELECT
TO public
USING (true);

-- After running, you should also ensure that RLS is actually enabled for the `perfumes` table.
-- You can check this in the Supabase Dashboard under Database -> Policies.
