-- Crear tabla para guardar el detalle de cada actualización de presupuesto
CREATE TABLE IF NOT EXISTS public."PresupuestoHistoricoDetalle" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "Project_ID" bigint NOT NULL,
  "Item_ID" bigint NOT NULL,
  "Item_Nombre" text,
  "Monto_Parcial" double precision NOT NULL DEFAULT 0,
  "Monto_Total" double precision,
  "Porcentaje_Parcial" double precision,
  "Porcentaje_Acumulado" double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public."PresupuestoHistoricoDetalle" ENABLE ROW LEVEL SECURITY;

-- Política para ver el detalle histórico (mismo acceso que PresupuestoHistorico)
CREATE POLICY "Users can view historico detalle of accessible projects"
ON public."PresupuestoHistoricoDetalle"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "PresupuestoHistoricoDetalle"."Project_ID"
    AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "PresupuestoHistoricoDetalle"."Project_ID"
    AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "PresupuestoHistoricoDetalle"."Project_ID"
    AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "PresupuestoHistoricoDetalle"."Project_ID"
    AND cu.auth_user_id = auth.uid()
  )
);

-- Política para crear detalle histórico (mismo acceso que PresupuestoHistorico)
CREATE POLICY "Users can create historico detalle for accessible projects"
ON public."PresupuestoHistoricoDetalle"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "PresupuestoHistoricoDetalle"."Project_ID"
    AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "PresupuestoHistoricoDetalle"."Project_ID"
    AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "PresupuestoHistoricoDetalle"."Project_ID"
    AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "PresupuestoHistoricoDetalle"."Project_ID"
    AND cu.auth_user_id = auth.uid()
  )
);

-- Crear índices para mejorar el performance
CREATE INDEX IF NOT EXISTS idx_presupuesto_historico_detalle_project_id 
ON public."PresupuestoHistoricoDetalle"("Project_ID");

CREATE INDEX IF NOT EXISTS idx_presupuesto_historico_detalle_item_id 
ON public."PresupuestoHistoricoDetalle"("Item_ID");

CREATE INDEX IF NOT EXISTS idx_presupuesto_historico_detalle_created_at 
ON public."PresupuestoHistoricoDetalle"(created_at);

-- Comentarios para documentación
COMMENT ON TABLE public."PresupuestoHistoricoDetalle" IS 'Detalle de cada actualización individual de ítems del presupuesto para evitar duplicados cuando un ítem se actualiza múltiples veces en el mismo día';
COMMENT ON COLUMN public."PresupuestoHistoricoDetalle"."Item_ID" IS 'ID del ítem del presupuesto que se actualizó';
COMMENT ON COLUMN public."PresupuestoHistoricoDetalle"."Monto_Parcial" IS 'Monto parcial en valor absoluto de esta actualización específica';
COMMENT ON COLUMN public."PresupuestoHistoricoDetalle"."Porcentaje_Parcial" IS 'Porcentaje de avance de esta actualización específica';