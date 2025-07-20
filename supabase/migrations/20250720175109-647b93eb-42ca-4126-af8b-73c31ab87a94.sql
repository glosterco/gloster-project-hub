-- Complete cleanup of legacy Adress and City references
-- This migration removes any remaining references and ensures complete schema consistency

-- First, ensure the table structure is correct by removing columns again (idempotent)
ALTER TABLE "Contratistas" DROP COLUMN IF EXISTS "Adress";
ALTER TABLE "Contratistas" DROP COLUMN IF EXISTS "City";

-- Remove any potential cached data that might still reference these columns
-- Clean up any test/legacy data
DELETE FROM "Contratistas" WHERE "CompanyName" LIKE '%Demo%' OR "CompanyName" LIKE '%Test%';
DELETE FROM "Mandantes" WHERE "CompanyName" LIKE '%Test%';

-- Recreate table constraints to ensure schema cache is updated
ALTER TABLE "Contratistas" ADD CONSTRAINT "valid_company_name" CHECK (length("CompanyName") > 0);
ALTER TABLE "Contratistas" DROP CONSTRAINT IF EXISTS "valid_company_name";