-- Fix base URL in contractor CC URL generation function
CREATE OR REPLACE FUNCTION public.generate_contractor_cc_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  unique_token TEXT;
  base_url TEXT := 'https://mqzuvqwsaeguphqjwvap.supabase.co';
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

-- Fix base URL in contractor URL generation function  
CREATE OR REPLACE FUNCTION public.set_contractor_url_for_new_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  unique_token TEXT;
  base_url TEXT := 'https://mqzuvqwsaeguphqjwvap.supabase.co';
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

-- Update existing URLs to use correct domain
UPDATE public."Estados de pago" 
SET "URLContratista" = REPLACE("URLContratista", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://mqzuvqwsaeguphqjwvap.supabase.co')
WHERE "URLContratista" LIKE '%b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com%';

UPDATE public."Estados de pago" 
SET "URLMandante" = REPLACE("URLMandante", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://mqzuvqwsaeguphqjwvap.supabase.co')
WHERE "URLMandante" LIKE '%b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com%';

UPDATE public."Contratistas" 
SET "URLCC" = REPLACE("URLCC", 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com', 'https://mqzuvqwsaeguphqjwvap.supabase.co')
WHERE "URLCC" LIKE '%b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com%';