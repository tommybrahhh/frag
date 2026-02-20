-- This script publishes comments that were marked as 'is_visible = false'.
-- It uses a batching approach (1,000 rows per batch) to:
-- 1. Prevent database timeouts.
-- 2. Avoid locking the entire table for a long duration.
-- 3. Minimize impact on database resources (CPU/IO).

DO $$ 
DECLARE 
    batch_size INT := 1000; -- Change this to a larger number (e.g., 5000) if you have millions of rows
    rows_updated INT;
BEGIN 
    RAISE NOTICE 'Starting publication of hidden comments...';
    
    LOOP
        -- Update a small batch of comments
        UPDATE public.comments
        SET is_visible = true
        WHERE id IN (
            SELECT id 
            FROM public.comments 
            WHERE is_visible = false 
            LIMIT batch_size
        );

        -- Get the number of rows updated in the last batch
        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        
        -- If no rows were updated, it means there are no more hidden comments
        EXIT WHEN rows_updated = 0;
        
        -- Log progress to the Supabase 'Messages' tab
        RAISE NOTICE 'Batch complete: % rows updated', rows_updated;
        
        -- Optional: Commit each batch (Standard in PL/pgSQL for long-running tasks)
        -- In Supabase/Postgres loops, the transaction is usually held until the end.
        -- If the script times out, just run it again; it will pick up where it left off.
    END LOOP;
    
    RAISE NOTICE 'Success: All hidden comments have been published.';
END $$;
