
-- Public can view licitaciones with url_acceso
CREATE POLICY "Public can view licitaciones by url" ON public."Licitaciones"
FOR SELECT TO public
USING (url_acceso IS NOT NULL);

-- Public can view eventos of licitaciones with url_acceso
CREATE POLICY "Public can view eventos by licitacion url" ON public."LicitacionEventos"
FOR SELECT TO public
USING (licitacion_id IN (SELECT id FROM "Licitaciones" WHERE url_acceso IS NOT NULL));

-- Public can view documentos of licitaciones with url_acceso
CREATE POLICY "Public can view documentos by licitacion url" ON public."LicitacionDocumentos"
FOR SELECT TO public
USING (licitacion_id IN (SELECT id FROM "Licitaciones" WHERE url_acceso IS NOT NULL));

-- Public can view items of licitaciones with url_acceso
CREATE POLICY "Public can view items by licitacion url" ON public."LicitacionItems"
FOR SELECT TO public
USING (licitacion_id IN (SELECT id FROM "Licitaciones" WHERE url_acceso IS NOT NULL));
