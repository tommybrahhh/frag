-- 1. Ensure extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create GIN index for fuzzy searching on notes
CREATE INDEX IF NOT EXISTS idx_notes_name_trgm ON notes USING gin (name gin_trgm_ops);

-- 3. Optimization: B-Tree index for exact/prefix matches if not already present
-- (Most PKs/Unique constraints already have this, but for safety)
CREATE INDEX IF NOT EXISTS idx_notes_name_btree ON notes(name);
