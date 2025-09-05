-- Update all existing URLs in Estados de pago to use the correct domain
UPDATE public."Estados de pago" 
SET 
  "URLContratista" = REPLACE("URLContratista", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://gloster.cl'),
  "URLMandante" = REPLACE("URLMandante", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://gloster.cl')
WHERE 
  "URLContratista" LIKE '%lovableproject.com%' 
  OR "URLMandante" LIKE '%lovableproject.com%';

-- Also update any sandbox URLs
UPDATE public."Estados de pago" 
SET 
  "URLContratista" = REPLACE("URLContratista", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.sandbox.lovable.dev', 'https://gloster.cl'),
  "URLMandante" = REPLACE("URLMandante", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.sandbox.lovable.dev', 'https://gloster.cl')
WHERE 
  "URLContratista" LIKE '%sandbox.lovable.dev%' 
  OR "URLMandante" LIKE '%sandbox.lovable.dev%';

-- Update URLCC in Contratistas table
UPDATE public."Contratistas" 
SET "URLCC" = REPLACE("URLCC", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://gloster.cl')
WHERE "URLCC" LIKE '%lovableproject.com%';

UPDATE public."Contratistas" 
SET "URLCC" = REPLACE("URLCC", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.sandbox.lovable.dev', 'https://gloster.cl')
WHERE "URLCC" LIKE '%sandbox.lovable.dev%';