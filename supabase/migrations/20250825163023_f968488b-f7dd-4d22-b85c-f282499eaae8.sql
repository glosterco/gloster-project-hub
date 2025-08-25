-- Eliminar la edge function innecesaria y crear una política RLS que permita actualizaciones por email
-- Primero, creamos una política que permita a usuarios no autenticados actualizar estados de pago
-- cuando el email coincide con el mandante del proyecto

-- Eliminar políticas conflictivas si existen
DROP POLICY IF EXISTS "Email verified users can update payment status" ON public."Estados de pago";
DROP POLICY IF EXISTS "Mandantes can update payment status via email access" ON public."Estados de pago";

-- Crear una nueva política que permita actualizaciones basadas en verificación de email
-- Esta política permite actualizar estados de pago cuando:
-- 1. El usuario está autenticado Y está relacionado con el proyecto (mantiene funcionalidad existente)
-- 2. O cuando el email en la sesión coincide con el email del mandante del proyecto (nuevo)
CREATE POLICY "Allow payment status updates for project members and verified emails" 
ON public."Estados de pago"
FOR UPDATE 
USING (
  -- Usuario autenticado relacionado con el proyecto
  is_project_related("Project", auth.uid())
  OR 
  -- Verificación por email del mandante (para acceso sin cuenta)
  verify_mandante_email_access("id", COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'email'),
    (current_setting('custom.email_access', true))
  ))
)
WITH CHECK (
  -- Usuario autenticado relacionado con el proyecto
  is_project_related("Project", auth.uid())
  OR 
  -- Verificación por email del mandante (para acceso sin cuenta)
  verify_mandante_email_access("id", COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'email'),
    (current_setting('custom.email_access', true))
  ))
);