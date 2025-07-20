-- Clean up any potential schema cache issues and ensure columns are fully removed
-- This migration ensures complete removal of Adress and City columns and cleans any orphaned references

-- Double-check that columns are removed (should be no-op since previous migration already did this)
ALTER TABLE "Contratistas" DROP COLUMN IF EXISTS "Adress";
ALTER TABLE "Contratistas" DROP COLUMN IF EXISTS "City";

-- Update any existing test data that might reference these columns
-- No action needed since columns are already removed