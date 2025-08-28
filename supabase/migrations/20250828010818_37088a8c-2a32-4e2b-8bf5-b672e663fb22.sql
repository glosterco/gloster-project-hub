-- Temporarily disable authentication requirement in hooks by ensuring INSERT is possible without auth
-- First, let's make sure all necessary columns can accept NULL auth_user_id during registration

-- Allow auth_user_id to be NULL in Contratistas (should already be nullable)
-- Check current status and make sure it's nullable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Contratistas' 
        AND column_name = 'auth_user_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public."Contratistas" ALTER COLUMN auth_user_id DROP NOT NULL;
        RAISE NOTICE 'Made Contratistas.auth_user_id nullable';
    ELSE
        RAISE NOTICE 'Contratistas.auth_user_id is already nullable';
    END IF;
END $$;

-- Allow auth_user_id to be NULL in Mandantes (should already be nullable)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Mandantes' 
        AND column_name = 'auth_user_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public."Mandantes" ALTER COLUMN auth_user_id DROP NOT NULL;
        RAISE NOTICE 'Made Mandantes.auth_user_id nullable';
    ELSE
        RAISE NOTICE 'Mandantes.auth_user_id is already nullable';
    END IF;
END $$;