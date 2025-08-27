-- Eliminar la política duplicada y crear la correcta para mandantes
DROP POLICY IF EXISTS "Service role can update estados de pago" ON public."Estados de pago";

-- Crear política unificada que permita UPDATE tanto a mandantes autenticados como verificados por email
CREATE POLICY "Unified payment update policy" 
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
  OR
  -- O si es service role para automatizaciones
  auth.role() = 'service_role'
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
  OR
  auth.role() = 'service_role'
);