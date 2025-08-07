-- Función para generar URLs de contratista automáticamente
CREATE OR REPLACE FUNCTION public.ensure_contractor_urls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  payment_record RECORD;
  unique_token TEXT;
  base_url TEXT := 'https://mqzuvqwsaeguphqjwvap.lovable.app';
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
$function$;

-- Función para enviar recordatorios automáticos de pago a contratistas
CREATE OR REPLACE FUNCTION public.send_contractor_payment_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  payment_record RECORD;
  contractor_data RECORD;
  project_data RECORD;
  mandante_data RECORD;
BEGIN
  -- Buscar estados de pago que vencen en 2 semanas y están en status Pendiente o Programado
  FOR payment_record IN 
    SELECT ep.id, ep."Name", ep."Año", ep."Mes", ep."Total", ep."ExpiryDate", 
           ep."URLContratista", ep."Project", ep."Status"
    FROM public."Estados de pago" ep
    WHERE ep."ExpiryDate" = CURRENT_DATE + INTERVAL '14 days'
      AND ep."Status" IN ('Pendiente', 'Programado')
      AND ep."URLContratista" IS NOT NULL
  LOOP
    -- Obtener datos del proyecto
    SELECT p."Name" as project_name, p."Currency", p."Contratista", p."Owner"
    INTO project_data
    FROM public."Proyectos" p
    WHERE p.id = payment_record."Project";
    
    -- Obtener datos del contratista
    SELECT c."ContactEmail", c."ContactName", c."CompanyName"
    INTO contractor_data
    FROM public."Contratistas" c
    WHERE c.id = project_data."Contratista";
    
    -- Obtener datos del mandante
    SELECT m."CompanyName"
    INTO mandante_data
    FROM public."Mandantes" m
    WHERE m.id = project_data."Owner";
    
    -- Verificar que tenemos todos los datos necesarios
    IF contractor_data."ContactEmail" IS NOT NULL AND contractor_data."ContactName" IS NOT NULL THEN
      -- Llamar a la edge function para enviar el email
      PERFORM net.http_post(
        url := 'https://mqzuvqwsaeguphqjwvap.supabase.co/functions/v1/send-contractor-payment',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xenV2cXdzYWVndXBocWp3dmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMTkwMzgsImV4cCI6MjA2NTU5NTAzOH0.NjN6dcoIXfmGkbwle0_EeKziDysY5RSkTNZzz9LpwIA"}'::jsonb,
        body := json_build_object(
          'paymentId', payment_record.id::text,
          'contractorEmail', contractor_data."ContactEmail",
          'contractorName', contractor_data."ContactName",
          'contractorCompany', contractor_data."CompanyName",
          'mandanteCompany', mandante_data."CompanyName",
          'proyecto', project_data.project_name,
          'mes', payment_record."Mes",
          'año', payment_record."Año",
          'amount', payment_record."Total",
          'dueDate', payment_record."ExpiryDate"::text,
          'currency', project_data."Currency",
          'urlContratista', payment_record."URLContratista",
          'isReminder', true
        )::jsonb
      );
      
      RAISE NOTICE 'Sent automatic payment reminder for payment ID % to contractor %', 
        payment_record.id, contractor_data."ContactEmail";
    END IF;
  END LOOP;
END;
$function$;