Below are CREATE TYPE and CREATE TABLE statements reconstructed from the public schema metadata you gave. These include enums, defaults, constraints, indexes implied by PKs, and foreign key constraints. Review and run in your environment as needed.

-- Enums CREATE TYPE public.brand_tier_type AS ENUM ('Designer', 'Niche', 'Indie', 'Celebrity', 'Historical');

CREATE TYPE public.gender_type AS ENUM ('Male', 'Female', 'Unisex');

CREATE TYPE public.concentration_type AS ENUM ('EDT', 'EDP', 'Parfum', 'Extrait', 'Cologne');

CREATE TYPE public.note_position_type AS ENUM ('Top', 'Heart', 'Base');

-- Note: a "vector" type is user-defined (extension like pgvector). If present, keep as-is. -- Ensure pgvector (or equivalent) extension is installed if using the embedding column.

-- Table: brands CREATE TABLE public.brands ( id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name text UNIQUE NOT NULL, tier brand_tier_type NOT NULL DEFAULT 'Designer'::brand_tier_type, logo_url text, website_url text, created_at timestamptz DEFAULT timezone('utc'::text, now()), brand_color varchar DEFAULT '#000000'::character varying );

-- Table: notes CREATE TABLE public.notes ( id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name text UNIQUE NOT NULL, family text, color_hex varchar, description text, created_at timestamptz DEFAULT timezone('utc'::text, now()), volatility text CHECK (volatility = ANY (ARRAY['Top'::text, 'Heart'::text, 'Base'::text])), default_intensity integer DEFAULT 5 CHECK (default_intensity >= 1 AND default_intensity <= 10) );

-- Table: perfumes -- Note: embedding column uses a user-defined 'vector' type CREATE TABLE public.perfumes ( id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name text UNIQUE NOT NULL, brand_id uuid, gender gender_type DEFAULT 'Unisex'::gender_type, concentration concentration_type, release_year integer, image_url text, vibe_tags text[], embedding vector, created_at timestamptz DEFAULT timezone('utc'::text, now()), perfumer text, price_tier varchar, best_season varchar[], best_time varchar, longevity_rating integer DEFAULT 0, sillage_rating integer DEFAULT 0, rating numeric DEFAULT NULL::numeric, scenario text, scent_profile jsonb DEFAULT '{"depth": 0, "fresh": 0, "spicy": 0, "sweet": 0}'::jsonb, occasions text[], olfactory_family text[] );

ALTER TABLE public.perfumes ADD CONSTRAINT perfumes_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);

-- Table: perfume_notes CREATE TABLE public.perfume_notes ( id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), perfume_id uuid, note_id uuid, type note_position_type NOT NULL, prominence_score integer CHECK (prominence_score >= 1 AND prominence_score <= 10) );

ALTER TABLE public.perfume_notes ADD CONSTRAINT perfume_notes_perfume_id_fkey FOREIGN KEY (perfume_id) REFERENCES public.perfumes(id);

ALTER TABLE public.perfume_notes ADD CONSTRAINT perfume_notes_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id);

-- Table: user_collections CREATE TABLE public.user_collections ( id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, perfume_id uuid NOT NULL, created_at timestamp DEFAULT now() );

ALTER TABLE public.user_collections ADD CONSTRAINT user_collections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.user_collections ADD CONSTRAINT user_collections_perfume_id_fkey FOREIGN KEY (perfume_id) REFERENCES public.perfumes(id);

-- Table: profiles CREATE TABLE public.profiles ( id uuid PRIMARY KEY, display_name text, bio text, created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now(), signature_scent_id uuid, favorite_notes text[] DEFAULT '{}'::text[], vibe_tags text[], best_season text );

ALTER TABLE public.profiles ADD CONSTRAINT profiles_signature_scent_id_fkey FOREIGN KEY (signature_scent_id) REFERENCES public.perfumes(id);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);

-- Indexes (implied from PKs are created automatically). Create additional indexes if needed: -- Example: index on perfumes(brand_id) CREATE INDEX IF NOT EXISTS idx_perfumes_brand_id ON public.perfumes(brand_id);

-- Notes: -- 1) The "embedding vector" column requires the appropriate extension (e.g., pgvector). If not present, remove or replace that column. -- 2) Functions used for defaults: uuid_generate_v4() and gen_random_uuid() come from pgcrypto or uuid-ossp; ensure those extensions are enabled: -- CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- 3) Validate ENUM names and presence before creating types to avoid conflicts. -- 4) This export was reconstructed from metadata; confirm any additional constraints, triggers, or indexes present in your DB before applying.

