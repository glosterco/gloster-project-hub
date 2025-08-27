-- Update URLCC for existing records that don't have it yet but have CCEmail
UPDATE "Contratistas" 
SET "URLCC" = 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com/email-access?redirect=/executive-summary&token=' || gen_random_uuid()::text
WHERE "CCEmail" IS NOT NULL AND ("URLCC" IS NULL OR "URLCC" = '');