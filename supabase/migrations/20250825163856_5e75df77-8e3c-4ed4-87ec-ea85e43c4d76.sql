-- Simplificar la RLS policy para permitir actualizaciones por email sin funciones adicionales
DROP POLICY IF EXISTS "Allow payment status updates for project members and verified e" ON public."Estados de pago";

-- Crear una policy más simple que permita actualización directa por verificación de email
CREATE POLICY "Allow payment status updates for authenticated and email verified users" 
ON public."Estados de pago" 
FOR UPDATE 
USING (
  -- Usuarios autenticados relacionados al proyecto
  is_project_related("Project", auth.uid()) 
  OR 
  -- Verificación directa de email del mandante del proyecto
  EXISTS (
    SELECT 1 
    FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Project" 
    AND LOWER(m."ContactEmail") = LOWER(COALESCE(
      ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), 
      current_setting('custom.email_access'::text, true)
    ))
  )
)