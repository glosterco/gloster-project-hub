-- Primero eliminar la política existente para recrearla con los permisos correctos
DROP POLICY "Unified payment update policy" ON public."Estados de pago";

-- Recrear la política con acceso para mandantes verificados por email
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