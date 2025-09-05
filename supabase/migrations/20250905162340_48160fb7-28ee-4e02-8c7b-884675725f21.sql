-- Crear función para asegurar URLs de mandante en estados de pago existentes
CREATE OR REPLACE FUNCTION public.ensure_mandante_urls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  payment_record RECORD;
  unique_token TEXT;
  base_url TEXT := 'https://gloster-project-hub.lovable.app';
  new_mandante_url TEXT;
BEGIN
  -- Generate URLs for estados de pago without URLMandante
  FOR payment_record IN 
    SELECT id FROM public."Estados de pago" 
    WHERE "URLMandante" IS NULL OR "URLMandante" = ''
  LOOP
    -- Generate unique token
    unique_token := gen_random_uuid()::text;
    new_mandante_url := base_url || '/email-access?paymentId=' || payment_record.id || '&token=' || unique_token || '&type=mandante';
    
    -- Update mandante URL
    UPDATE public."Estados de pago"
    SET "URLMandante" = new_mandante_url
    WHERE id = payment_record.id;
    
    RAISE NOTICE 'Generated URLMandante for payment ID %: %', payment_record.id, new_mandante_url;
  END LOOP;
END;
$function$;

-- Crear trigger function para establecer URL de mandante automáticamente en nuevos pagos
CREATE OR REPLACE FUNCTION public.set_mandante_url_for_new_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  unique_token TEXT;
  base_url TEXT := 'https://gloster-project-hub.lovable.app';
  new_mandante_url TEXT;
BEGIN
  IF NEW."URLMandante" IS NULL OR NEW."URLMandante" = '' THEN
    unique_token := gen_random_uuid()::text;
    new_mandante_url := base_url || '/email-access?paymentId=' || NEW.id || '&token=' || unique_token || '&type=mandante';
    NEW."URLMandante" := new_mandante_url;
  END IF;
  RETURN NEW;
END;
$function$;

-- Crear trigger para aplicar la función automáticamente
CREATE TRIGGER set_mandante_url_trigger
  BEFORE INSERT ON public."Estados de pago"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mandante_url_for_new_payment();

-- Ejecutar la función para generar URLs faltantes de mandantes
SELECT public.ensure_mandante_urls();