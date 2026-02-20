-- DELETE PERFUME AND RELATED DATA BY ID: 8914c64f-dbc8-4b59-af1f-3b7c9ed09d2e

DO $$
DECLARE
    p_id UUID := '8914c64f-dbc8-4b59-af1f-3b7c9ed09d2e';
BEGIN
    -- 1. Remove from perfume_notes
    DELETE FROM public.perfume_notes WHERE perfume_id = p_id;

    -- 2. Remove from user_collections
    DELETE FROM public.user_collections WHERE perfume_id = p_id;

    -- 3. Remove from comments
    DELETE FROM public.comments WHERE perfume_id = p_id;

    -- 4. Remove from reviews (if table exists)
    DELETE FROM public.reviews WHERE perfume_id = p_id;

    -- 5. Remove from perfume_dupes (both sides)
    DELETE FROM public.perfume_dupes WHERE original_id = p_id OR dupe_id = p_id;

    -- 6. Remove from saved_mixes (both sides)
    DELETE FROM public.saved_mixes WHERE base_perfume_id = p_id OR top_perfume_id = p_id;

    -- 7. Reset signature_scent_id in profiles
    UPDATE public.profiles SET signature_scent_id = NULL WHERE signature_scent_id = p_id;

    -- 8. Finally, remove the perfume itself
    DELETE FROM public.perfumes WHERE id = p_id;

    RAISE NOTICE 'Successfully deleted perfume and all related data for ID %', p_id;
END $$;
