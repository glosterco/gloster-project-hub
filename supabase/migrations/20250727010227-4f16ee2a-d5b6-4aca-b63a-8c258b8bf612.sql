-- Arreglar las funciones existentes para incluir search_path
CREATE OR REPLACE FUNCTION public.log_payment_status_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RAISE NOTICE 'PAYMENT STATUS CHANGE: ID=%, Name=%, Old Status=%, New Status=%, Project=%, Time=%', 
    NEW.id, NEW."Name", OLD."Status", NEW."Status", NEW."Project", now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_payment_states_weekly()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- CRÍTICO: SOLO actualizar estados de 'Programado' a 'Pendiente' 2 semanas antes del vencimiento
  -- NUNCA tocar otros estados (Enviado, Aprobado, Rechazado, En Progreso, etc.)
  UPDATE public."Estados de pago"
  SET "Status" = 'Pendiente'
  WHERE "Status" = 'Programado'  -- CONDICIÓN CRÍTICA: solo si el estado actual es exactamente 'Programado'
    AND "ExpiryDate" <= CURRENT_DATE + INTERVAL '14 days'
    AND "ExpiryDate" > CURRENT_DATE;
    
  -- Log para debugging
  RAISE NOTICE 'Function executed: ONLY Programado -> Pendiente transitions allowed at %, affected rows: %', 
    now(), (SELECT COUNT(*) FROM public."Estados de pago" WHERE "Status" = 'Pendiente' AND "ExpiryDate" <= CURRENT_DATE + INTERVAL '14 days');
END;
$function$;