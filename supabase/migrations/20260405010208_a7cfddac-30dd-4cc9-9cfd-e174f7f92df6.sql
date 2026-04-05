
-- Rondas de preguntas (Q&A rounds)
CREATE TABLE public."LicitacionRondas" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  licitacion_id bigint NOT NULL REFERENCES public."Licitaciones"(id) ON DELETE CASCADE,
  numero smallint NOT NULL DEFAULT 1,
  titulo text NOT NULL DEFAULT 'Ronda de Preguntas',
  estado text NOT NULL DEFAULT 'abierta',
  fecha_apertura timestamp with time zone NOT NULL DEFAULT now(),
  fecha_cierre timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Preguntas de oferentes
CREATE TABLE public."LicitacionPreguntas" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  licitacion_id bigint NOT NULL REFERENCES public."Licitaciones"(id) ON DELETE CASCADE,
  ronda_id bigint NOT NULL REFERENCES public."LicitacionRondas"(id) ON DELETE CASCADE,
  oferente_email text NOT NULL,
  pregunta text NOT NULL,
  especialidad text,
  grupo_similar_id bigint,
  respuesta text,
  respuesta_ia text,
  respuesta_ia_fuentes jsonb,
  respondida boolean NOT NULL DEFAULT false,
  publicada boolean NOT NULL DEFAULT false,
  respondida_por text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ofertas de oferentes
CREATE TABLE public."LicitacionOfertas" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  licitacion_id bigint NOT NULL REFERENCES public."Licitaciones"(id) ON DELETE CASCADE,
  oferente_email text NOT NULL,
  oferente_nombre text,
  oferente_empresa text,
  estado text NOT NULL DEFAULT 'borrador',
  gastos_generales numeric,
  utilidades numeric,
  total numeric,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(licitacion_id, oferente_email)
);

-- Items desglosados por oferta
CREATE TABLE public."LicitacionOfertaItems" (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  oferta_id bigint NOT NULL REFERENCES public."LicitacionOfertas"(id) ON DELETE CASCADE,
  item_referencia_id bigint REFERENCES public."LicitacionItems"(id),
  descripcion text NOT NULL,
  unidad text,
  cantidad numeric,
  precio_unitario numeric,
  precio_total numeric,
  orden smallint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add access URL to licitaciones for oferente access
ALTER TABLE public."Licitaciones" ADD COLUMN IF NOT EXISTS url_acceso text;

-- RLS for LicitacionRondas
ALTER TABLE public."LicitacionRondas" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mandantes can manage rondas" ON public."LicitacionRondas"
  FOR ALL TO public
  USING (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT id FROM "Mandantes" WHERE auth_user_id = auth.uid()
    )
  ) OR licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT mandante_id FROM mandante_users WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT id FROM "Mandantes" WHERE auth_user_id = auth.uid()
    )
  ) OR licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT mandante_id FROM mandante_users WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Public can view rondas by licitacion url" ON public."LicitacionRondas"
  FOR SELECT TO public
  USING (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE url_acceso IS NOT NULL
  ));

-- RLS for LicitacionPreguntas
ALTER TABLE public."LicitacionPreguntas" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mandantes can manage preguntas" ON public."LicitacionPreguntas"
  FOR ALL TO public
  USING (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT id FROM "Mandantes" WHERE auth_user_id = auth.uid()
    )
  ) OR licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT mandante_id FROM mandante_users WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT id FROM "Mandantes" WHERE auth_user_id = auth.uid()
    )
  ) OR licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT mandante_id FROM mandante_users WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Public can view and create preguntas" ON public."LicitacionPreguntas"
  FOR ALL TO public
  USING (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE url_acceso IS NOT NULL
  ))
  WITH CHECK (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE url_acceso IS NOT NULL
  ));

-- RLS for LicitacionOfertas
ALTER TABLE public."LicitacionOfertas" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mandantes can manage ofertas" ON public."LicitacionOfertas"
  FOR ALL TO public
  USING (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT id FROM "Mandantes" WHERE auth_user_id = auth.uid()
    )
  ) OR licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT mandante_id FROM mandante_users WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT id FROM "Mandantes" WHERE auth_user_id = auth.uid()
    )
  ) OR licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE mandante_id IN (
      SELECT mandante_id FROM mandante_users WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Public can manage ofertas by url" ON public."LicitacionOfertas"
  FOR ALL TO public
  USING (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE url_acceso IS NOT NULL
  ))
  WITH CHECK (licitacion_id IN (
    SELECT id FROM "Licitaciones" WHERE url_acceso IS NOT NULL
  ));

-- RLS for LicitacionOfertaItems
ALTER TABLE public."LicitacionOfertaItems" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mandantes can manage oferta items" ON public."LicitacionOfertaItems"
  FOR ALL TO public
  USING (oferta_id IN (
    SELECT lo.id FROM "LicitacionOfertas" lo
    JOIN "Licitaciones" l ON l.id = lo.licitacion_id
    WHERE l.mandante_id IN (SELECT id FROM "Mandantes" WHERE auth_user_id = auth.uid())
    OR l.mandante_id IN (SELECT mandante_id FROM mandante_users WHERE auth_user_id = auth.uid())
  ))
  WITH CHECK (oferta_id IN (
    SELECT lo.id FROM "LicitacionOfertas" lo
    JOIN "Licitaciones" l ON l.id = lo.licitacion_id
    WHERE l.mandante_id IN (SELECT id FROM "Mandantes" WHERE auth_user_id = auth.uid())
    OR l.mandante_id IN (SELECT mandante_id FROM mandante_users WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Public can manage oferta items by url" ON public."LicitacionOfertaItems"
  FOR ALL TO public
  USING (oferta_id IN (
    SELECT lo.id FROM "LicitacionOfertas" lo
    JOIN "Licitaciones" l ON l.id = lo.licitacion_id
    WHERE l.url_acceso IS NOT NULL
  ))
  WITH CHECK (oferta_id IN (
    SELECT lo.id FROM "LicitacionOfertas" lo
    JOIN "Licitaciones" l ON l.id = lo.licitacion_id
    WHERE l.url_acceso IS NOT NULL
  ));

-- Trigger for url_acceso on new licitacion
CREATE OR REPLACE FUNCTION public.set_licitacion_url_acceso()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  unique_token TEXT;
  base_url TEXT := 'https://gloster-project-hub.lovable.app';
BEGIN
  IF NEW.url_acceso IS NULL OR NEW.url_acceso = '' THEN
    unique_token := gen_random_uuid()::text;
    NEW.url_acceso := base_url || '/licitacion-acceso/' || NEW.id || '?token=' || unique_token;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_licitacion_url_acceso_trigger
  BEFORE INSERT ON public."Licitaciones"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_licitacion_url_acceso();
