-- Actualizar la función para que SOLO cambie estados de "Programado" a "Pendiente"
-- No debe tocar ningún otro estado, especialmente "Enviado", "Aprobado" o "Rechazado"
CREATE OR REPLACE FUNCTION public.update_payment_states_weekly()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- CRÍTICO: SOLO actualizar estados de 'Programado' a 'Pendiente' 2 semanas antes del vencimiento
  -- NUNCA tocar otros estados (Enviado, Aprobado, Rechazado, En Progreso, etc.)
  UPDATE "Estados de pago"
  SET "Status" = 'Pendiente'
  WHERE "Status" = 'Programado'  -- CONDICIÓN CRÍTICA: solo si el estado actual es exactamente 'Programado'
    AND "ExpiryDate" <= CURRENT_DATE + INTERVAL '14 days'
    AND "ExpiryDate" > CURRENT_DATE;
    
  -- Log para debugging
  RAISE NOTICE 'Function executed: ONLY Programado -> Pendiente transitions allowed at %, affected rows: %', 
    now(), (SELECT COUNT(*) FROM "Estados de pago" WHERE "Status" = 'Pendiente' AND "ExpiryDate" <= CURRENT_DATE + INTERVAL '14 days');
END;
$function$;