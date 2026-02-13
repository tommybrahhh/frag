-- Performance Optimization Indexes

-- 1. Index the slug column for fast perfume lookups
CREATE INDEX IF NOT EXISTS idx_perfumes_slug ON perfumes(slug);

-- 2. Index for note searches (perfume_notes table)
CREATE INDEX IF NOT EXISTS idx_perfume_notes_perfume_id ON perfume_notes(perfume_id);
CREATE INDEX IF NOT EXISTS idx_perfume_notes_note_id ON perfume_notes(note_id);

-- 3. Index for brand id
CREATE INDEX IF NOT EXISTS idx_perfumes_brand_id ON perfumes(brand_id);

-- 4. Index for vibe_tags and olfactory_family (GIN indexes for array overlap)
CREATE INDEX IF NOT EXISTS idx_perfumes_vibe_tags ON perfumes USING gin (vibe_tags);
CREATE INDEX IF NOT EXISTS idx_perfumes_olfactory_family ON perfumes USING gin (olfactory_family);

-- 5. Index for rating/ranking lookups
CREATE INDEX IF NOT EXISTS idx_perfumes_rating ON perfumes(rating DESC NULLS LAST);
