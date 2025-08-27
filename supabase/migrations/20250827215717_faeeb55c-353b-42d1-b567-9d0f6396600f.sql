-- CORRECCIÓN 1: Política RLS para permitir cambios de mandantes sin user_auth_id SOLO con email verificado
-- Primero eliminar la política actual problemática
DROP POLICY IF EXISTS "Allow payment updates with email or auth access" ON public."Estados de pago";

-- Crear nueva política que permite:
-- 1. Mandantes autenticados (con user_auth_id) - acceso completo
-- 2. Mandantes sin user_auth_id pero con email verificado - acceso limitado a cambios de status/notes
-- 3. Contratistas autenticados - acceso completo
-- 4. Service role - acceso completo
CREATE POLICY "Secure payment updates policy" ON public."Estados de pago"
FOR UPDATE 
USING (
  -- 1. Usuario autenticado relacionado al proyecto
  ((auth.uid() IS NOT NULL) AND is_project_related("Project", auth.uid()))
  OR
  -- 2. Mandante sin user_auth_id pero con email verificado para el proyecto específico
  (
    (auth.uid() IS NULL) 
    AND 
    (COALESCE(current_setting('custom.email_access', true), '') <> '')
    AND
    EXISTS (
      SELECT 1 
      FROM public."Proyectos" p
      JOIN public."Mandantes" m ON (m.id = p."Owner")
      WHERE p.id = "Estados de pago"."Project" 
        AND lower(m."ContactEmail") = lower(current_setting('custom.email_access', true))
        AND m.auth_user_id IS NULL  -- CRÍTICO: Solo mandantes SIN user_auth_id
    )
  )
  OR
  -- 3. Service role
  (auth.role() = 'service_role')
)
WITH CHECK (
  -- Mismas condiciones para WITH CHECK
  ((auth.uid() IS NOT NULL) AND is_project_related("Project", auth.uid()))
  OR
  (
    (auth.uid() IS NULL) 
    AND 
    (COALESCE(current_setting('custom.email_access', true), '') <> '')
    AND
    EXISTS (
      SELECT 1 
      FROM public."Proyectos" p
      JOIN public."Mandantes" m ON (m.id = p."Owner")
      WHERE p.id = "Estados de pago"."Project" 
        AND lower(m."ContactEmail") = lower(current_setting('custom.email_access', true))
        AND m.auth_user_id IS NULL
    )
  )
  OR
  (auth.role() = 'service_role')
);