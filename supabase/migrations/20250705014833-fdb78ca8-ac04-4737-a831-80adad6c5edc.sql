
-- Corregir la función para que SOLO cambie de Programado a Pendiente
-- y NUNCA toque estados como Enviado, Aprobado, Rechazado, etc.
CREATE OR REPLACE FUNCTION public.update_payment_states_weekly()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- SOLO actualizar estados de 'Programado' a 'Pendiente' 2 semanas antes del vencimiento
  -- NO tocar ningún otro estado (Enviado, Aprobado, Rechazado)
  UPDATE "Estados de pago"
  SET "Status" = 'Pendiente'
  WHERE "Status" = 'Programado'
    AND "ExpiryDate" <= CURRENT_DATE + INTERVAL '14 days'
    AND "ExpiryDate" > CURRENT_DATE;
    
  -- ELIMINAR la segunda parte que forzaba estados Pendiente
  -- ya que estaba cambiando estados que no debía tocar
  
  RAISE NOTICE 'Function executed: only Programado -> Pendiente transitions allowed';
END;
$function$
