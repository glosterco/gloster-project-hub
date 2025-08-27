-- Eliminar política problemática actual y crear una nueva más simple
DROP POLICY IF EXISTS "Unified payment update policy" ON public."Estados de pago";

-- Crear nueva política que permita actualización cuando hay acceso por email
CREATE POLICY "Allow payment updates for mandante email access" 
ON public."Estados de pago" 
FOR UPDATE 
USING (
  -- Acceso normal por usuario autenticado relacionado al proyecto
  is_project_related("Project", auth.uid()) 
  OR 
  -- Acceso por email del mandante (para usuarios sin auth)
  EXISTS (
    SELECT 1 
    FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Estados de pago"."Project" 
    AND lower(m."ContactEmail") = lower(COALESCE(current_setting('custom.email_access'::text, true), ''))
  )
  OR
  -- Service role siempre puede actualizar
  auth.role() = 'service_role'
) 
WITH CHECK (
  -- Mismas condiciones para el check
  is_project_related("Project", auth.uid()) 
  OR 
  EXISTS (
    SELECT 1 
    FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Estados de pago"."Project" 
    AND lower(m."ContactEmail") = lower(COALESCE(current_setting('custom.email_access'::text, true), ''))
  )
  OR
  auth.role() = 'service_role'
);