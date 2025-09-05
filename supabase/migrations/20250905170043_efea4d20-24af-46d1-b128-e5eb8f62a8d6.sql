-- CORRECCIÓN CRÍTICA: Actualizar todas las funciones de trigger para usar el dominio correcto
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

-- Corregir función de trigger para mandante URLs
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

-- Corregir función de trigger para CC URLs
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

-- Corregir función de trigger para mandante CC URLs
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

-- Corregir TODAS las funciones auxiliares
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
  FOR payment_record IN 
    SELECT id FROM public."Estados de pago" 
    WHERE "URLContratista" IS NULL OR "URLContratista" = ''
  LOOP
    unique_token := gen_random_uuid()::text;
    new_access_url := base_url || '/email-access?paymentId=' || payment_record.id || '&token=' || unique_token;
    
    UPDATE public."Estados de pago"
    SET "URLContratista" = new_access_url
    WHERE id = payment_record.id;
    
    RAISE NOTICE 'Generated URLContratista for payment ID %: %', payment_record.id, new_access_url;
  END LOOP;
END;
$function$;

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
  FOR contractor_record IN 
    SELECT id FROM public."Contratistas" 
    WHERE "URLCC" IS NULL OR "URLCC" = ''
  LOOP
    unique_token := gen_random_uuid()::text;
    new_cc_url := base_url || '/email-access?contractorId=' || contractor_record.id || '&token=' || unique_token || '&type=cc';
    
    UPDATE public."Contratistas"
    SET "URLCC" = new_cc_url
    WHERE id = contractor_record.id;
    
    RAISE NOTICE 'Generated URLCC for contractor ID %: %', contractor_record.id, new_cc_url;
  END LOOP;
END;
$function$;

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
  FOR payment_record IN 
    SELECT id FROM public."Estados de pago" 
    WHERE "URLMandante" IS NULL OR "URLMandante" = ''
  LOOP
    unique_token := gen_random_uuid()::text;
    new_mandante_url := base_url || '/email-access?paymentId=' || payment_record.id || '&token=' || unique_token || '&type=mandante';
    
    UPDATE public."Estados de pago"
    SET "URLMandante" = new_mandante_url
    WHERE id = payment_record.id;
    
    RAISE NOTICE 'Generated URLMandante for payment ID %: %', payment_record.id, new_mandante_url;
  END LOOP;
END;
$function$;

-- CREAR TRIGGERS NECESARIOS SI NO EXISTEN
DROP TRIGGER IF EXISTS set_contractor_url_on_insert ON public."Estados de pago";
CREATE TRIGGER set_contractor_url_on_insert
  BEFORE INSERT ON public."Estados de pago"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contractor_url_for_new_payment();

DROP TRIGGER IF EXISTS set_mandante_url_on_insert ON public."Estados de pago";
CREATE TRIGGER set_mandante_url_on_insert
  BEFORE INSERT ON public."Estados de pago"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mandante_url_for_new_payment();

-- LIMPIEZA COMPLETA: Actualizar TODOS los registros existentes con dominio incorrecto
UPDATE public."Estados de pago" 
SET "URLContratista" = REPLACE("URLContratista", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://gloster-project-hub.lovable.app')
WHERE "URLContratista" LIKE '%b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com%';

UPDATE public."Estados de pago" 
SET "URLMandante" = REPLACE("URLMandante", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://gloster-project-hub.lovable.app')
WHERE "URLMandante" LIKE '%b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com%';

UPDATE public."Contratistas" 
SET "URLCC" = REPLACE("URLCC", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://gloster-project-hub.lovable.app')
WHERE "URLCC" LIKE '%b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com%';

UPDATE public."Mandantes" 
SET "CC" = REPLACE("CC", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://gloster-project-hub.lovable.app')
WHERE "CC" LIKE '%b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com%';