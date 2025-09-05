-- Crear función para asegurar URLs CC de mandantes existentes
CREATE OR REPLACE FUNCTION public.ensure_mandante_cc_urls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  mandante_record RECORD;
  unique_token TEXT;
  base_url TEXT := 'https://gloster-project-hub.lovable.app';
  new_cc_url TEXT;
BEGIN
  -- Generate URLCC for mandantes without one
  FOR mandante_record IN 
    SELECT id FROM public."Mandantes" 
    WHERE "CC" IS NULL OR "CC" = ''
  LOOP
    -- Generate unique token
    unique_token := gen_random_uuid()::text;
    new_cc_url := base_url || '/email-access?mandanteId=' || mandante_record.id || '&token=' || unique_token || '&type=cc';
    
    -- Update the mandante's CC URL
    UPDATE public."Mandantes"
    SET "CC" = new_cc_url
    WHERE id = mandante_record.id;
    
    RAISE NOTICE 'Generated CC URL for mandante ID %: %', mandante_record.id, new_cc_url;
  END LOOP;
END;
$function$;

-- Crear trigger function para generar URL CC automáticamente para nuevos mandantes
CREATE OR REPLACE FUNCTION public.generate_mandante_cc_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  unique_token TEXT;
  base_url TEXT := 'https://gloster-project-hub.lovable.app';
  new_cc_url TEXT;
BEGIN
  IF NEW."CC" IS NULL OR NEW."CC" = '' THEN
    unique_token := gen_random_uuid()::text;
    new_cc_url := base_url || '/email-access?mandanteId=' || NEW.id || '&token=' || unique_token || '&type=cc';
    NEW."CC" := new_cc_url;
  END IF;
  RETURN NEW;
END;
$function$;

-- Crear trigger para aplicar la función automáticamente a nuevos mandantes
CREATE TRIGGER generate_mandante_cc_url_trigger
  BEFORE INSERT ON public."Mandantes"
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_mandante_cc_url();

-- Ejecutar la función para generar URLs CC faltantes de mandantes
SELECT public.ensure_mandante_cc_urls();