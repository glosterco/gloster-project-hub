-- Crear tabla para histórico de actualizaciones de presupuesto
CREATE TABLE IF NOT EXISTS public."PresupuestoHistorico" (
  id bigserial PRIMARY KEY,
  "Project_ID" bigint NOT NULL,
  "TotalAcumulado" double precision NOT NULL DEFAULT 0,
  "TotalParcial" double precision NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fk_project FOREIGN KEY ("Project_ID") 
    REFERENCES public."Proyectos"(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE public."PresupuestoHistorico" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para PresupuestoHistorico
CREATE POLICY "Users can view historico of accessible projects" 
ON public."PresupuestoHistorico"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "PresupuestoHistorico"."Project_ID" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "PresupuestoHistorico"."Project_ID" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "PresupuestoHistorico"."Project_ID" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "PresupuestoHistorico"."Project_ID" AND cu.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create historico for accessible projects" 
ON public."PresupuestoHistorico"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "PresupuestoHistorico"."Project_ID" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "PresupuestoHistorico"."Project_ID" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "PresupuestoHistorico"."Project_ID" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "PresupuestoHistorico"."Project_ID" AND cu.auth_user_id = auth.uid()
  )
);

-- Crear índice para búsquedas más rápidas
CREATE INDEX idx_presupuesto_historico_project ON public."PresupuestoHistorico"("Project_ID", created_at DESC);