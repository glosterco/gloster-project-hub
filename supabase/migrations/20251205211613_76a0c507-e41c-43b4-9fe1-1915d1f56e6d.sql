-- Fase 1: Crear tablas para sistema de aprobación multi-persona

-- 1. Tabla de configuración de aprobación por proyecto
CREATE TABLE public.project_approval_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id BIGINT NOT NULL REFERENCES public."Proyectos"(id) ON DELETE CASCADE,
  required_approvals SMALLINT NOT NULL DEFAULT 1,
  approval_order_matters BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- 2. Tabla relacional para aprobadores del proyecto (sin arrays)
CREATE TABLE public.project_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.project_approval_config(id) ON DELETE CASCADE,
  approver_email TEXT NOT NULL,
  approver_name TEXT,
  approval_order SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(config_id, approver_email)
);

-- 3. Tabla de aprobaciones individuales por estado de pago
CREATE TABLE public.payment_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id BIGINT NOT NULL REFERENCES public."Estados de pago"(id) ON DELETE CASCADE,
  approver_email TEXT NOT NULL,
  approver_name TEXT,
  approval_status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (approval_status IN ('Aprobado', 'Rechazado', 'Pendiente')),
  notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(payment_id, approver_email)
);

-- 4. Agregar columnas de progreso a Estados de pago
ALTER TABLE public."Estados de pago" 
ADD COLUMN IF NOT EXISTS approval_progress SMALLINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_approvals_required SMALLINT DEFAULT 1;

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE public.project_approval_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_approvals ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para project_approval_config
CREATE POLICY "Open approval config access"
ON public.project_approval_config
FOR SELECT
USING (true);

CREATE POLICY "Open approval config creation"
ON public.project_approval_config
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Open approval config updates"
ON public.project_approval_config
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Open approval config deletion"
ON public.project_approval_config
FOR DELETE
USING (true);

-- 7. Políticas RLS para project_approvers
CREATE POLICY "Open approvers access"
ON public.project_approvers
FOR SELECT
USING (true);

CREATE POLICY "Open approvers creation"
ON public.project_approvers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Open approvers updates"
ON public.project_approvers
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Open approvers deletion"
ON public.project_approvers
FOR DELETE
USING (true);

-- 8. Políticas RLS para payment_approvals
CREATE POLICY "Open payment approvals access"
ON public.payment_approvals
FOR SELECT
USING (true);

CREATE POLICY "Open payment approvals creation"
ON public.payment_approvals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Open payment approvals updates"
ON public.payment_approvals
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Open payment approvals deletion"
ON public.payment_approvals
FOR DELETE
USING (true);

-- 9. Trigger para actualizar updated_at
CREATE TRIGGER update_project_approval_config_updated_at
BEFORE UPDATE ON public.project_approval_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Poblar con datos existentes: crear configuración para cada proyecto existente
-- usando el email del mandante como aprobador por defecto
INSERT INTO public.project_approval_config (project_id, required_approvals, approval_order_matters)
SELECT p.id, 1, false
FROM public."Proyectos" p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_approval_config pac WHERE pac.project_id = p.id
);

-- 11. Insertar aprobadores por defecto usando el email del mandante de cada proyecto
INSERT INTO public.project_approvers (config_id, approver_email, approver_name, approval_order)
SELECT 
  pac.id,
  m."ContactEmail",
  m."ContactName",
  1
FROM public.project_approval_config pac
JOIN public."Proyectos" p ON p.id = pac.project_id
JOIN public."Mandantes" m ON m.id = p."Owner"
WHERE m."ContactEmail" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.project_approvers pa WHERE pa.config_id = pac.id
);

-- 12. Función para verificar si un email tiene acceso de aprobación a un pago
CREATE OR REPLACE FUNCTION public.verify_approver_email_access(payment_id BIGINT, user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verificar si el email está en la lista de aprobadores del proyecto del pago
  RETURN EXISTS (
    SELECT 1 
    FROM public."Estados de pago" ep
    JOIN public.project_approval_config pac ON pac.project_id = ep."Project"
    JOIN public.project_approvers pa ON pa.config_id = pac.id
    WHERE ep.id = payment_id 
    AND LOWER(pa.approver_email) = LOWER(user_email)
  );
END;
$$;