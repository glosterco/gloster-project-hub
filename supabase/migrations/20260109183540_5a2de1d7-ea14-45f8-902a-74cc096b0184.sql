-- ============================================
-- MIGRACIÓN: REFACTORIZACIÓN COMPLETA DE ADICIONALES
-- ============================================

-- 1. Agregar columnas nuevas para el estado Pausado y control de tiempos
ALTER TABLE public."Adicionales"
ADD COLUMN IF NOT EXISTS "paused_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "paused_days" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "action_notes" TEXT,
ADD COLUMN IF NOT EXISTS "Utilidades" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "Subtotal" DOUBLE PRECISION DEFAULT 0;

-- 2. Actualizar el status por defecto de 'Pendiente' a 'Enviado'
ALTER TABLE public."Adicionales" 
ALTER COLUMN "Status" SET DEFAULT 'Enviado';

-- 3. Actualizar registros existentes con status 'Pendiente' a 'Enviado'
UPDATE public."Adicionales" 
SET "Status" = 'Enviado' 
WHERE "Status" = 'Pendiente';

-- 4. Agregar política RLS pública para lectura (necesaria para ProjectAccess)
DROP POLICY IF EXISTS "Public read adicionales by project token" ON public."Adicionales";
CREATE POLICY "Public read adicionales by project token"
ON public."Adicionales"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    WHERE p.id = "Adicionales"."Proyecto"
    AND p."URL" IS NOT NULL
  )
);

-- 5. Agregar política RLS pública para UPDATE (necesaria para aprobar/rechazar/pausar desde ProjectAccess)
DROP POLICY IF EXISTS "Public update adicionales by mandante access" ON public."Adicionales";
CREATE POLICY "Public update adicionales by mandante access"
ON public."Adicionales"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    WHERE p.id = "Adicionales"."Proyecto"
    AND p."URL" IS NOT NULL
  )
);

-- 6. Comentarios para documentar el esquema
COMMENT ON COLUMN public."Adicionales"."paused_at" IS 'Fecha y hora cuando se pausó el adicional';
COMMENT ON COLUMN public."Adicionales"."paused_days" IS 'Total de días que el adicional ha estado en pausa';
COMMENT ON COLUMN public."Adicionales"."action_notes" IS 'Notas del mandante al aprobar/rechazar/pausar';
COMMENT ON COLUMN public."Adicionales"."Utilidades" IS 'Porcentaje de utilidades aplicado';
COMMENT ON COLUMN public."Adicionales"."Subtotal" IS 'Subtotal antes de GG y Utilidades';