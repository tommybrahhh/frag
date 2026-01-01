-- Add list_type column to user_collections table
ALTER TABLE public.user_collections 
ADD COLUMN list_type text NOT NULL DEFAULT 'owned' CHECK (list_type IN ('owned', 'wishlist', 'tested'));

-- Optional: Create an index if queries filter by list_type often (good practice)
CREATE INDEX idx_user_collections_list_type ON public.user_collections(list_type);
