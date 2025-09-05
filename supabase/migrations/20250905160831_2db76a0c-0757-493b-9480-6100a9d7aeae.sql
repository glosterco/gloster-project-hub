-- Actualizar todas las URLs de mandante incorrectas
UPDATE public."Estados de pago" 
SET "URLMandante" = REPLACE("URLMandante", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://gloster-project-hub.lovable.app')
WHERE "URLMandante" LIKE '%lovableproject.com%' OR "URLMandante" LIKE '%b7846f9a%';

-- Actualizar todas las URLs de contratista incorrectas  
UPDATE public."Estados de pago"
SET "URLContratista" = REPLACE("URLContratista", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://gloster-project-hub.lovable.app')
WHERE "URLContratista" LIKE '%lovableproject.com%' OR "URLContratista" LIKE '%b7846f9a%';

-- Actualizar todas las URLs CC de contratistas incorrectas
UPDATE public."Contratistas"
SET "URLCC" = REGEXP_REPLACE("URLCC", 'https://[^/]+', 'https://gloster-project-hub.lovable.app')
WHERE "URLCC" NOT LIKE '%gloster-project-hub.lovable.app%' AND "URLCC" IS NOT NULL AND "URLCC" != '';

-- Verificar las correcciones
SELECT 'Estados de pago URLs corregidas' as tabla, COUNT(*) as total 
FROM public."Estados de pago" 
WHERE "URLMandante" LIKE '%gloster-project-hub.lovable.app%' 
   OR "URLContratista" LIKE '%gloster-project-hub.lovable.app%'

UNION ALL

SELECT 'Contratistas URLs corregidas' as tabla, COUNT(*) as total
FROM public."Contratistas" 
WHERE "URLCC" LIKE '%gloster-project-hub.lovable.app%';