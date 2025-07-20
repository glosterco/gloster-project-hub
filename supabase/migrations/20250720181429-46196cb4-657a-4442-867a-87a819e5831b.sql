-- Emergency debug: Check if there are any triggers, functions, or RPC calls 
-- that might be referencing the old column names

-- Check for any functions that reference Adress or City
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.proname, p.prosrc 
        FROM pg_proc p 
        WHERE p.prosrc ILIKE '%Adress%' OR p.prosrc ILIKE '%City%'
    LOOP
        RAISE NOTICE 'Function % contains Adress/City reference', func_record.proname;
    END LOOP;
END $$;

-- Check for any triggers that might reference these columns
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT t.tgname, p.prosrc
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE p.prosrc ILIKE '%Adress%' OR p.prosrc ILIKE '%City%'
    LOOP
        RAISE NOTICE 'Trigger % contains Adress/City reference', trigger_record.tgname;
    END LOOP;
END $$;

-- Final verification of table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Contratistas' 
ORDER BY ordinal_position;