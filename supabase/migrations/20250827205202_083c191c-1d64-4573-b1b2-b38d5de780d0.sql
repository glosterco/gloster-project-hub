-- Create function to generate URLCC for contractors
CREATE OR REPLACE FUNCTION public.generate_contractor_cc_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  unique_token TEXT;
  base_url TEXT := 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com';
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

-- Create trigger for automatic URLCC generation on new contractors
CREATE TRIGGER set_contractor_cc_url_for_new_contractor
  BEFORE INSERT ON public."Contratistas"
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_contractor_cc_url();

-- Function to generate URLCC for existing contractors
CREATE OR REPLACE FUNCTION public.ensure_contractor_cc_urls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  contractor_record RECORD;
  unique_token TEXT;
  base_url TEXT := 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com';
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

-- Execute the function to generate URLCC for existing contractors
SELECT public.ensure_contractor_cc_urls();