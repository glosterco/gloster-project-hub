-- Corregir todas las URLs existentes para usar el dominio correcto de Lovable
UPDATE public."Estados de pago" 
SET 
  "URLContratista" = REPLACE("URLContratista", 'https://gloster.cl', 'https://gloster-project-hub.lovable.app'),
  "URLMandante" = REPLACE("URLMandante", 'https://gloster.cl', 'https://gloster-project-hub.lovable.app')
WHERE 
  "URLContratista" LIKE '%gloster.cl%' 
  OR "URLMandante" LIKE '%gloster.cl%';

-- Actualizar URLCC en la tabla Contratistas
UPDATE public."Contratistas" 
SET "URLCC" = REPLACE("URLCC", 'https://gloster.cl', 'https://gloster-project-hub.lovable.app')
WHERE "URLCC" LIKE '%gloster.cl%';