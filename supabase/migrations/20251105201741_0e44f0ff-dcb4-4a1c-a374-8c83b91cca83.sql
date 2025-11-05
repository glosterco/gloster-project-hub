-- Crear tabla para oferentes de licitaciones
CREATE TABLE public."LicitacionOferentes" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  licitacion_id bigint NOT NULL REFERENCES public."Licitaciones"(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla para eventos del calendario de licitaciones
CREATE TABLE public."LicitacionEventos" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  licitacion_id bigint NOT NULL REFERENCES public."Licitaciones"(id) ON DELETE CASCADE,
  fecha timestamp with time zone NOT NULL,
  titulo text NOT NULL,
  descripcion text,
  requiere_archivos boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla para documentos de licitaciones
CREATE TABLE public."LicitacionDocumentos" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  licitacion_id bigint NOT NULL REFERENCES public."Licitaciones"(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  size bigint,
  tipo text,
  url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public."LicitacionOferentes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LicitacionEventos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LicitacionDocumentos" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para LicitacionOferentes
CREATE POLICY "Mandantes can view oferentes of their licitaciones"
ON public."LicitacionOferentes"
FOR SELECT
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones" 
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can create oferentes for their licitaciones"
ON public."LicitacionOferentes"
FOR INSERT
WITH CHECK (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can update oferentes of their licitaciones"
ON public."LicitacionOferentes"
FOR UPDATE
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can delete oferentes of their licitaciones"
ON public."LicitacionOferentes"
FOR DELETE
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

-- Políticas RLS para LicitacionEventos
CREATE POLICY "Mandantes can view eventos of their licitaciones"
ON public."LicitacionEventos"
FOR SELECT
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can create eventos for their licitaciones"
ON public."LicitacionEventos"
FOR INSERT
WITH CHECK (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can update eventos of their licitaciones"
ON public."LicitacionEventos"
FOR UPDATE
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can delete eventos of their licitaciones"
ON public."LicitacionEventos"
FOR DELETE
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

-- Políticas RLS para LicitacionDocumentos
CREATE POLICY "Mandantes can view documentos of their licitaciones"
ON public."LicitacionDocumentos"
FOR SELECT
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can create documentos for their licitaciones"
ON public."LicitacionDocumentos"
FOR INSERT
WITH CHECK (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can update documentos of their licitaciones"
ON public."LicitacionDocumentos"
FOR UPDATE
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can delete documentos of their licitaciones"
ON public."LicitacionDocumentos"
FOR DELETE
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

-- Eliminar las columnas JSONB de la tabla Licitaciones
ALTER TABLE public."Licitaciones" DROP COLUMN IF EXISTS oferentes_emails;
ALTER TABLE public."Licitaciones" DROP COLUMN IF EXISTS calendario_eventos;
ALTER TABLE public."Licitaciones" DROP COLUMN IF EXISTS documentos;