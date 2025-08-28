-- Fix all URLs to use consistent domain and ensure proper token format
-- Update Estados de pago URLs
UPDATE "Estados de pago" 
SET 
  "URLContratista" = 'https://id-preview--b7846f9a-a454-43f5-8060-670f4c2f860a.lovable.app/email-access?paymentId=' || id || '&token=' || split_part(split_part("URLContratista", 'token=', 2), '&', 1) || '&type=contratista',
  "URLMandante" = 'https://id-preview--b7846f9a-a454-43f5-8060-670f4c2f860a.lovable.app/email-access?paymentId=' || id || '&token=' || split_part(split_part("URLMandante", 'token=', 2), '&', 1) || '&type=mandante'
WHERE "URLContratista" IS NOT NULL OR "URLMandante" IS NOT NULL;

-- Fix URLMandante that don't have type parameter
UPDATE "Estados de pago" 
SET "URLMandante" = "URLMandante" || '&type=mandante'
WHERE "URLMandante" IS NOT NULL 
  AND "URLMandante" NOT LIKE '%type=mandante%';

-- Update Contratistas URLCC
UPDATE "Contratistas" 
SET "URLCC" = 'https://id-preview--b7846f9a-a454-43f5-8060-670f4c2f860a.lovable.app/email-access?contractorId=' || id || '&token=' || split_part(split_part("URLCC", 'token=', 2), '&', 1) || '&type=cc'
WHERE "URLCC" IS NOT NULL;