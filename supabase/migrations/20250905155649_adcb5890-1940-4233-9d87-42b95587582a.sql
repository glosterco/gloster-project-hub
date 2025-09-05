-- Actualizar funciones que generan URLs con dominios incorrectos usando CASCADE
-- Primero eliminar el trigger que depende de la función
DROP TRIGGER IF EXISTS set_contractor_cc_url_for_new_contractor ON public."Contratistas";

-- Eliminar y recrear función generate_contractor_cc_url
DROP FUNCTION IF EXISTS public.generate_contractor_cc_url() CASCADE;
CREATE OR REPLACE FUNCTION public.generate_contractor_cc_url()
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
  IF NEW."URLCC" IS NULL OR NEW."URLCC" = '' THEN
    unique_token := gen_random_uuid()::text;
    new_cc_url := base_url || '/email-access?contractorId=' || NEW.id || '&token=' || unique_token || '&type=cc';
    NEW."URLCC" := new_cc_url;
  END IF;
  RETURN NEW;
END;
$function$;

-- Recrear el trigger
CREATE TRIGGER set_contractor_cc_url_for_new_contractor
    BEFORE INSERT ON public."Contratistas"
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_contractor_cc_url();

-- Actualizar función ensure_contractor_urls
DROP FUNCTION IF EXISTS public.ensure_contractor_urls() CASCADE;
CREATE OR REPLACE FUNCTION public.ensure_contractor_urls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  payment_record RECORD;
  unique_token TEXT;
  base_url TEXT := 'https://gloster-project-hub.lovable.app';
  new_access_url TEXT;
BEGIN
  -- Generate URLs for estados de pago without URLContratista
  FOR payment_record IN 
    SELECT id FROM public."Estados de pago" 
    WHERE "URLContratista" IS NULL OR "URLContratista" = ''
  LOOP
    -- Generate unique token
    unique_token := gen_random_uuid()::text;
    new_access_url := base_url || '/email-access?paymentId=' || payment_record.id || '&token=' || unique_token;
    
    -- Update contractor URL
    UPDATE public."Estados de pago"
    SET "URLContratista" = new_access_url
    WHERE id = payment_record.id;
    
    RAISE NOTICE 'Generated URLContratista for payment ID %: %', payment_record.id, new_access_url;
  END LOOP;
END;
$function$;

-- Actualizar función ensure_contractor_cc_urls
DROP FUNCTION IF EXISTS public.ensure_contractor_cc_urls() CASCADE;
CREATE OR REPLACE FUNCTION public.ensure_contractor_cc_urls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  contractor_record RECORD;
  unique_token TEXT;
  base_url TEXT := 'https://gloster-project-hub.lovable.app';
  new_cc_url TEXT;
BEGIN
  -- Generate URLCC for contractors without one
  FOR contractor_record IN 
    SELECT id FROM public."Contratistas" 
    WHERE "URLCC" IS NULL OR "URLCC" = ''
  LOOP
    -- Generate unique token
    unique_token := gen_random_uuid()::text;
    new_cc_url := base_url || '/email-access?contractorId=' || contractor_record.id || '&token=' || unique_token || '&type=cc';
    
    -- Update the contractor's URLCC
    UPDATE public."Contratistas"
    SET "URLCC" = new_cc_url
    WHERE id = contractor_record.id;
    
    RAISE NOTICE 'Generated URLCC for contractor ID %: %', contractor_record.id, new_cc_url;
  END LOOP;
END;
$function$;

-- Actualizar trigger function set_contractor_url_for_new_payment
DROP FUNCTION IF EXISTS public.set_contractor_url_for_new_payment() CASCADE;
CREATE OR REPLACE FUNCTION public.set_contractor_url_for_new_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  unique_token TEXT;
  base_url TEXT := 'https://gloster-project-hub.lovable.app';
  new_access_url TEXT;
BEGIN
  IF NEW."URLContratista" IS NULL OR NEW."URLContratista" = '' THEN
    unique_token := gen_random_uuid()::text;
    new_access_url := base_url || '/email-access?paymentId=' || NEW.id || '&token=' || unique_token;
    NEW."URLContratista" := new_access_url;
  END IF;
  RETURN NEW;
END;
$function$;