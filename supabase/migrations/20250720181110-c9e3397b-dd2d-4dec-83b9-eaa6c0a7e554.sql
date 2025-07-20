-- Force complete schema refresh and ensure no legacy references exist
-- This migration will force Supabase to refresh the schema cache completely

-- First, list current columns to verify state (this won't show in result but helps with cache)
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Check if problematic columns still exist
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Contratistas' 
        AND column_name IN ('Adress', 'City')
    ) INTO col_exists;
    
    IF col_exists THEN
        -- Force drop if they somehow still exist
        ALTER TABLE "Contratistas" DROP COLUMN IF EXISTS "Adress";
        ALTER TABLE "Contratistas" DROP COLUMN IF EXISTS "City";
        RAISE NOTICE 'Dropped remaining Adress/City columns';
    ELSE
        RAISE NOTICE 'No Adress/City columns found - schema is clean';
    END IF;
END $$;

-- Force a table constraint update to refresh schema cache
ALTER TABLE "Contratistas" ADD CONSTRAINT temp_constraint CHECK (length("CompanyName") > 0);
ALTER TABLE "Contratistas" DROP CONSTRAINT temp_constraint;

-- Verify the final structure
DO $$
DECLARE
    column_list text;
BEGIN
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO column_list
    FROM information_schema.columns
    WHERE table_name = 'Contratistas' AND table_schema = 'public';
    
    RAISE NOTICE 'Current Contratistas columns: %', column_list;
END $$;