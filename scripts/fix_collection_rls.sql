-- Enable RLS
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own collection
CREATE POLICY "View own collection" 
ON user_collections 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to add items to their collection
CREATE POLICY "Add to own collection" 
ON user_collections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to remove items from their collection
CREATE POLICY "Remove from own collection" 
ON user_collections 
FOR DELETE 
USING (auth.uid() = user_id);