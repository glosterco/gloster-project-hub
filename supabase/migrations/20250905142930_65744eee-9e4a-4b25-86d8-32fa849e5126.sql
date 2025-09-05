-- Actualizar todos los URLs de contratista que apuntan a dominios incorrectos
UPDATE "Estados de pago" 
SET "URLContratista" = REPLACE(
  REPLACE(
    REPLACE("URLContratista", 'https://mqzuvqwsaeguphqjwvap.supabase.co', 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com'),
    'https://gloster-project-hub.lovable.app', 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com'
  ),
  'https://id-preview--b7846f9a-a454-43f5-8060-670f4c2f860a.lovable.app', 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com'
)
WHERE "URLContratista" LIKE '%supabase.co%' 
   OR "URLContratista" LIKE '%gloster-project-hub.lovable.app%'
   OR "URLContratista" LIKE '%id-preview--%';

-- Actualizar todos los URLs de mandante que apuntan a dominios incorrectos  
UPDATE "Estados de pago" 
SET "URLMandante" = REPLACE(
  REPLACE(
    REPLACE("URLMandante", 'https://mqzuvqwsaeguphqjwvap.supabase.co', 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com'),
    'https://gloster-project-hub.lovable.app', 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com'
  ),
  'https://id-preview--b7846f9a-a454-43f5-8060-670f4c2f860a.lovable.app', 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com'
)
WHERE "URLMandante" LIKE '%supabase.co%' 
   OR "URLMandante" LIKE '%gloster-project-hub.lovable.app%'
   OR "URLMandante" LIKE '%id-preview--%';