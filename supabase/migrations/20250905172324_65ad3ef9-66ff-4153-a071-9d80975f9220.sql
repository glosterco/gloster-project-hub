-- CORREGIR TRIGGERS QUE GENERAN URLS INCORRECTAS

-- 1. Eliminar triggers existentes que pueden estar usando dominios incorrectos
DROP TRIGGER IF EXISTS set_contractor_url_trigger ON public."Estados de pago";
DROP TRIGGER IF EXISTS set_mandante_url_trigger ON public."Estados de pago";
DROP TRIGGER IF EXISTS generate_contractor_cc_url_trigger ON public."Contratistas";
DROP TRIGGER IF EXISTS generate_mandante_cc_url_trigger ON public."Mandantes";

-- 2. Recrear las funciones con el dominio correcto
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
    new_mandante_url := base_url || '/email-access?paymentId=' || NEW.id || '&token=' || unique_token;
    NEW."URLMandante" := new_mandante_url;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Recrear los triggers
CREATE TRIGGER set_contractor_url_trigger
  BEFORE INSERT ON public."Estados de pago"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contractor_url_for_new_payment();

CREATE TRIGGER set_mandante_url_trigger
  BEFORE INSERT ON public."Estados de pago"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mandante_url_for_new_payment();

-- 4. Corregir las URLs incorrectas existentes (payment 297 y 298)
UPDATE public."Estados de pago" 
SET "URLMandante" = REPLACE("URLMandante", 'b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'gloster-project-hub.lovable.app')
WHERE "URLMandante" LIKE '%b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com%';

-- 5. Verificar que todas las URLs estén correctas
UPDATE public."Estados de pago" 
SET "URLMandante" = REPLACE("URLMandante", 'lovableproject.com', 'lovable.app')
WHERE "URLMandante" LIKE '%lovableproject.com%';

UPDATE public."Estados de pago" 
SET "URLContratista" = REPLACE("URLContratista", 'lovableproject.com', 'lovable.app')
WHERE "URLContratista" LIKE '%lovableproject.com%';