-- Remove address and city columns from Contratistas table
ALTER TABLE "Contratistas" DROP COLUMN IF EXISTS "Adress";
ALTER TABLE "Contratistas" DROP COLUMN IF EXISTS "City";