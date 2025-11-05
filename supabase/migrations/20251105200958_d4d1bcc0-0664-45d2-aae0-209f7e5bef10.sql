-- Crear tabla de licitaciones
CREATE TABLE public."Licitaciones" (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  mensaje_oferentes TEXT,
  oferentes_emails JSONB DEFAULT '[]'::jsonb,
  calendario_eventos JSONB DEFAULT '[]'::jsonb,
  especificaciones TEXT,
  documentos JSONB DEFAULT '[]'::jsonb,
  estado TEXT DEFAULT 'abierta',
  mandante_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public."Licitaciones" ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para licitaciones
-- Los mandantes pueden ver sus propias licitaciones
CREATE POLICY "Mandantes can view their licitaciones"
ON public."Licitaciones"
FOR SELECT
USING (
  mandante_id IN (
    SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
  )
  OR
  mandante_id IN (
    SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
  )
);

-- Los mandantes pueden crear licitaciones
CREATE POLICY "Mandantes can create licitaciones"
ON public."Licitaciones"
FOR INSERT
WITH CHECK (
  mandante_id IN (
    SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
  )
  OR
  mandante_id IN (
    SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
  )
);

-- Los mandantes pueden actualizar sus licitaciones
CREATE POLICY "Mandantes can update their licitaciones"
ON public."Licitaciones"
FOR UPDATE
USING (
  mandante_id IN (
    SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
  )
  OR
  mandante_id IN (
    SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
  )
);

-- Los mandantes pueden eliminar sus licitaciones
CREATE POLICY "Mandantes can delete their licitaciones"
ON public."Licitaciones"
FOR DELETE
USING (
  mandante_id IN (
    SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
  )
  OR
  mandante_id IN (
    SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
  )
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_licitaciones_updated_at
BEFORE UPDATE ON public."Licitaciones"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();