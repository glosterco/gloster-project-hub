-- Eliminar política problemática y crear una nueva que maneje correctamente auth.uid() NULL
DROP POLICY IF EXISTS "Allow payment updates for mandante email access" ON public."Estados de pago";

-- Crear política que evalúa correctamente cuando auth.uid() es NULL
CREATE POLICY "Allow payment updates with email or auth access" 
ON public."Estados de pago" 
FOR UPDATE 
USING (
  -- Acceso por email del mandante (prioridad para usuarios sin auth)
  EXISTS (
    SELECT 1 
    FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Estados de pago"."Project" 
    AND lower(m."ContactEmail") = lower(COALESCE(current_setting('custom.email_access'::text, true), ''))
    AND COALESCE(current_setting('custom.email_access'::text, true), '') != ''
  )
  OR 
  -- Acceso normal por usuario autenticado (solo si auth.uid() no es NULL)
  (auth.uid() IS NOT NULL AND is_project_related("Project", auth.uid()))
  OR
  -- Service role siempre puede actualizar
  auth.role() = 'service_role'
) 
WITH CHECK (
  -- Mismas condiciones para el check
  EXISTS (
    SELECT 1 
    FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Estados de pago"."Project" 
    AND lower(m."ContactEmail") = lower(COALESCE(current_setting('custom.email_access'::text, true), ''))
    AND COALESCE(current_setting('custom.email_access'::text, true), '') != ''
  )
  OR 
  (auth.uid() IS NOT NULL AND is_project_related("Project", auth.uid()))
  OR
  auth.role() = 'service_role'
);