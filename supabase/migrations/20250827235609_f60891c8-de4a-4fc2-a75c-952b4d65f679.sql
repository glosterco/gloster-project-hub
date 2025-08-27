-- Regenerar URLs correctas para URLCC con el dominio correcto
UPDATE "Contratistas" 
SET "URLCC" = 'https://id-preview--b7846f9a-a454-43f5-8060-670f4c2f860a.lovable.app/email-access?contractorId=' || id || '&token=' || gen_random_uuid()::text || '&type=cc'
WHERE "URLCC" IS NOT NULL;

-- Regenerar URLs correctas para URLMandante y URLContratista con el dominio correcto
UPDATE "Estados de pago" 
SET 
  "URLMandante" = 'https://id-preview--b7846f9a-a454-43f5-8060-670f4c2f860a.lovable.app/email-access?paymentId=' || id || '&token=' || gen_random_uuid()::text || '&type=mandante',
  "URLContratista" = 'https://id-preview--b7846f9a-a454-43f5-8060-670f4c2f860a.lovable.app/email-access?paymentId=' || id || '&token=' || gen_random_uuid()::text || '&type=contratista'
WHERE "URLMandante" IS NOT NULL OR "URLContratista" IS NOT NULL;