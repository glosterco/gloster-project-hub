-- Simplificar políticas RLS para Estados de pago
-- Eliminar políticas conflictivas de UPDATE

DROP POLICY IF EXISTS "Allow payment status updates for authenticated and email verifi" ON public."Estados de pago";
DROP POLICY IF EXISTS "Only related users can update estados de pago" ON public."Estados de pago";

-- Crear una sola política unificada para UPDATE que permita:
-- 1. Usuarios autenticados relacionados con el proyecto
-- 2. Usuarios con acceso vía email (mandantes)
CREATE POLICY "Unified payment update policy" 
ON public."Estados de pago" 
FOR UPDATE 
USING (
  -- Usuario autenticado relacionado al proyecto
  is_project_related("Project", auth.uid()) 
  OR 
  -- Acceso vía email del mandante (para approval workflow)
  EXISTS (
    SELECT 1 
    FROM "Proyectos" p
    JOIN "Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Estados de pago"."Project" 
    AND LOWER(m."ContactEmail") = LOWER(
      COALESCE(
        current_setting('custom.email_access', true),
        ((current_setting('request.jwt.claims', true))::json ->> 'email')
      )
    )
  )
)
WITH CHECK (
  -- Usuario autenticado relacionado al proyecto
  is_project_related("Project", auth.uid()) 
  OR 
  -- Acceso vía email del mandante (para approval workflow)
  EXISTS (
    SELECT 1 
    FROM "Proyectos" p
    JOIN "Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Estados de pago"."Project" 
    AND LOWER(m."ContactEmail") = LOWER(
      COALESCE(
        current_setting('custom.email_access', true),
        ((current_setting('request.jwt.claims', true))::json ->> 'email')
      )
    )
  )
);