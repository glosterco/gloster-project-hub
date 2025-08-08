-- Actualizar la función ensure_contractor_urls para usar el dominio correcto
CREATE OR REPLACE FUNCTION public.ensure_contractor_urls()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  payment_record RECORD;
  unique_token TEXT;
  base_url TEXT := 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com';
  new_access_url TEXT;
BEGIN
  -- Generar URLs para estados de pago sin URLContratista
  FOR payment_record IN 
    SELECT id FROM public."Estados de pago" 
    WHERE "URLContratista" IS NULL OR "URLContratista" = ''
  LOOP
    -- Generar token único
    unique_token := gen_random_uuid()::text;
    new_access_url := base_url || '/email-access?paymentId=' || payment_record.id || '&token=' || unique_token;
    
    -- Actualizar la URL del contratista
    UPDATE public."Estados de pago"
    SET "URLContratista" = new_access_url
    WHERE id = payment_record.id;
    
    RAISE NOTICE 'Generated URLContratista for payment ID %: %', payment_record.id, new_access_url;
  END LOOP;
END;
$function$