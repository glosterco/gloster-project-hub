-- Actualizar política RLS para permitir que mandantes actualicen status y notes
-- independientemente de si tienen user_auth_id o solo verificación por email

-- Primero eliminar la política existente que puede estar limitando el acceso
DROP POLICY IF EXISTS "Unified payment update policy" ON public."Estados de pago";

-- Crear nueva política que permita actualización a mandantes con verificación por email o autenticados
CREATE POLICY "Mandante can update payment status and notes" 
ON public."Estados de pago" 
FOR UPDATE 
USING (
  -- Permitir acceso si el usuario está relacionado con el proyecto (autenticado)
  is_project_related("Project", auth.uid())
  OR 
  -- O si es mandante verificado por email (usando configuración custom)
  EXISTS (
    SELECT 1
    FROM public."Proyectos" p
    JOIN public."Mandantes" m ON (m.id = p."Owner")
    WHERE p.id = "Estados de pago"."Project" 
    AND lower(m."ContactEmail") = lower(COALESCE(current_setting('custom.email_access', true), ''))
  )
)
WITH CHECK (
  -- Mismo check para verificar permisos al actualizar
  is_project_related("Project", auth.uid())
  OR 
  EXISTS (
    SELECT 1
    FROM public."Proyectos" p
    JOIN public."Mandantes" m ON (m.id = p."Owner")
    WHERE p.id = "Estados de pago"."Project" 
    AND lower(m."ContactEmail") = lower(COALESCE(current_setting('custom.email_access', true), ''))
  )
);

-- Mantener la política de service role para automatizaciones
CREATE POLICY "Service role can update estados de pago" 
ON public."Estados de pago" 
FOR UPDATE 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');