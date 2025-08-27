-- Add URLCC column to Contratistas table
ALTER TABLE "Contratistas" ADD COLUMN "URLCC" text;

-- Update existing records with CC URLs
UPDATE "Contratistas" 
SET "URLCC" = 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com/email-access?redirect=/executive-summary&token=' || gen_random_uuid()::text
WHERE "CCEmail" IS NOT NULL;