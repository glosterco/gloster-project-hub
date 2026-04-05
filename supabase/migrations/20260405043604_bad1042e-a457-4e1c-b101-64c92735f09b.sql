-- Backfill url_acceso for existing licitaciones that don't have one
DO $$
DECLARE
  rec RECORD;
  unique_token TEXT;
  base_url TEXT := 'https://gloster-project-hub.lovable.app';
BEGIN
  FOR rec IN SELECT id FROM "Licitaciones" WHERE url_acceso IS NULL OR url_acceso = ''
  LOOP
    unique_token := gen_random_uuid()::text;
    UPDATE "Licitaciones"
    SET url_acceso = base_url || '/licitacion-acceso/' || rec.id || '?token=' || unique_token
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- RLS for LicitacionOferentes (public read by licitacion)
ALTER TABLE "LicitacionOferentes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_oferentes"
  ON "LicitacionOferentes"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Licitaciones" l
      WHERE l.id = "LicitacionOferentes".licitacion_id
      AND l.url_acceso IS NOT NULL
    )
  );

-- RLS for LicitacionRondas (public read)
ALTER TABLE "LicitacionRondas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_rondas"
  ON "LicitacionRondas"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Licitaciones" l
      WHERE l.id = "LicitacionRondas".licitacion_id
      AND l.url_acceso IS NOT NULL
    )
  );

-- RLS for LicitacionPreguntas (public read + insert for oferentes)
ALTER TABLE "LicitacionPreguntas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_preguntas"
  ON "LicitacionPreguntas"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Licitaciones" l
      WHERE l.id = "LicitacionPreguntas".licitacion_id
      AND l.url_acceso IS NOT NULL
    )
  );

CREATE POLICY "oferentes_insert_preguntas"
  ON "LicitacionPreguntas"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "LicitacionOferentes" o
      WHERE o.licitacion_id = "LicitacionPreguntas".licitacion_id
      AND o.email = "LicitacionPreguntas".oferente_email
    )
  );

CREATE POLICY "oferentes_update_preguntas"
  ON "LicitacionPreguntas"
  FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "LicitacionOferentes" o
      WHERE o.licitacion_id = "LicitacionPreguntas".licitacion_id
      AND o.email = "LicitacionPreguntas".oferente_email
    )
  );

CREATE POLICY "oferentes_delete_draft_preguntas"
  ON "LicitacionPreguntas"
  FOR DELETE
  TO anon, authenticated
  USING (
    enviada = false
    AND EXISTS (
      SELECT 1 FROM "LicitacionOferentes" o
      WHERE o.licitacion_id = "LicitacionPreguntas".licitacion_id
      AND o.email = "LicitacionPreguntas".oferente_email
    )
  );