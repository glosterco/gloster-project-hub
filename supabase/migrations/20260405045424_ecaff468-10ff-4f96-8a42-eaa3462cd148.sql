
-- Add invitation acceptance tracking to LicitacionOferentes
ALTER TABLE "LicitacionOferentes" ADD COLUMN IF NOT EXISTS aceptada boolean NOT NULL DEFAULT false;
ALTER TABLE "LicitacionOferentes" ADD COLUMN IF NOT EXISTS aceptada_at timestamp with time zone;
ALTER TABLE "LicitacionOferentes" ADD COLUMN IF NOT EXISTS aceptada_por_nombre text;
ALTER TABLE "LicitacionOferentes" ADD COLUMN IF NOT EXISTS archivo_aceptacion_url text;
ALTER TABLE "LicitacionOferentes" ADD COLUMN IF NOT EXISTS archivo_aceptacion_nombre text;

-- Allow oferentes to update their own acceptance record
CREATE POLICY "oferentes_update_own_acceptance"
  ON "LicitacionOferentes"
  FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Licitaciones" l
      WHERE l.id = "LicitacionOferentes".licitacion_id
      AND l.url_acceso IS NOT NULL
    )
  );

-- Add oferente-created items to LicitacionItems
ALTER TABLE "LicitacionItems" ADD COLUMN IF NOT EXISTS agregado_por_oferente boolean NOT NULL DEFAULT false;
ALTER TABLE "LicitacionItems" ADD COLUMN IF NOT EXISTS oferente_email text;

-- Allow oferentes to insert items for licitaciones with url_acceso
CREATE POLICY "oferentes_insert_items"
  ON "LicitacionItems"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    agregado_por_oferente = true
    AND EXISTS (
      SELECT 1 FROM "Licitaciones" l
      WHERE l.id = "LicitacionItems".licitacion_id
      AND l.url_acceso IS NOT NULL
    )
  );

CREATE POLICY "oferentes_update_own_items"
  ON "LicitacionItems"
  FOR UPDATE
  TO anon, authenticated
  USING (
    agregado_por_oferente = true
    AND EXISTS (
      SELECT 1 FROM "Licitaciones" l
      WHERE l.id = "LicitacionItems".licitacion_id
      AND l.url_acceso IS NOT NULL
    )
  );

CREATE POLICY "oferentes_delete_own_items"
  ON "LicitacionItems"
  FOR DELETE
  TO anon, authenticated
  USING (
    agregado_por_oferente = true
    AND EXISTS (
      SELECT 1 FROM "Licitaciones" l
      WHERE l.id = "LicitacionItems".licitacion_id
      AND l.url_acceso IS NOT NULL
    )
  );

-- Add duration and attachment fields to LicitacionOfertas
ALTER TABLE "LicitacionOfertas" ADD COLUMN IF NOT EXISTS duracion_dias integer;
ALTER TABLE "LicitacionOfertas" ADD COLUMN IF NOT EXISTS archivo_oferta_url text;
ALTER TABLE "LicitacionOfertas" ADD COLUMN IF NOT EXISTS archivo_oferta_nombre text;
