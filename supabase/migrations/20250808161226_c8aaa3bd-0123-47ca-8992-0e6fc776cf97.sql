-- Actualizar todas las URLContratista y URLMandante existentes al dominio actual
UPDATE public."Estados de pago"
SET "URLContratista" = REPLACE("URLContratista", 'mqzuvqwsaeguphqjwvap.lovable.app', 'b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com')
WHERE "URLContratista" IS NOT NULL 
  AND "URLContratista" LIKE '%mqzuvqwsaeguphqjwvap.lovable.app%';

UPDATE public."Estados de pago"
SET "URLMandante" = REPLACE("URLMandante", 'mqzuvqwsaeguphqjwvap.lovable.app', 'b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com')
WHERE "URLMandante" IS NOT NULL 
  AND "URLMandante" LIKE '%mqzuvqwsaeguphqjwvap.lovable.app%';

-- También actualizar URLs que usen otros dominios viejos si existen
UPDATE public."Estados de pago"
SET "URLContratista" = REPLACE("URLContratista", 'localhost:5173', 'b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com')
WHERE "URLContratista" IS NOT NULL 
  AND "URLContratista" LIKE '%localhost:5173%';

UPDATE public."Estados de pago"
SET "URLMandante" = REPLACE("URLMandante", 'localhost:5173', 'b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com')
WHERE "URLMandante" IS NOT NULL 
  AND "URLMandante" LIKE '%localhost:5173%';