ALTER TABLE public."LicitacionRondas"
ADD COLUMN IF NOT EXISTS evento_id bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'LicitacionRondas_evento_id_fkey'
  ) THEN
    ALTER TABLE public."LicitacionRondas"
    ADD CONSTRAINT "LicitacionRondas_evento_id_fkey"
    FOREIGN KEY (evento_id)
    REFERENCES public."LicitacionEventos"(id)
    ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_licitacion_rondas_evento_id_unique
ON public."LicitacionRondas" (evento_id)
WHERE evento_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.renumber_licitacion_rondas(_licitacion_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  WITH ordered AS (
    SELECT r.id,
           row_number() OVER (ORDER BY e.fecha, e.id) AS seq,
           e.titulo
    FROM public."LicitacionRondas" r
    JOIN public."LicitacionEventos" e ON e.id = r.evento_id
    WHERE r.licitacion_id = _licitacion_id
      AND e.es_ronda_preguntas = true
  )
  UPDATE public."LicitacionRondas" r
  SET numero = ordered.seq,
      titulo = COALESCE(NULLIF(BTRIM(ordered.titulo), ''), 'Ronda ' || ordered.seq)
  FROM ordered
  WHERE r.id = ordered.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_ronda_from_evento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public."LicitacionRondas"
    WHERE evento_id = OLD.id;

    PERFORM public.renumber_licitacion_rondas(OLD.licitacion_id);
    RETURN OLD;
  END IF;

  IF NEW.es_ronda_preguntas = true THEN
    INSERT INTO public."LicitacionRondas" (
      licitacion_id,
      evento_id,
      numero,
      titulo,
      estado,
      fecha_apertura,
      fecha_cierre
    )
    VALUES (
      NEW.licitacion_id,
      NEW.id,
      0,
      COALESCE(NULLIF(BTRIM(NEW.titulo), ''), 'Ronda'),
      'programada',
      NEW.fecha::timestamptz,
      NULL
    )
    ON CONFLICT (evento_id)
    DO UPDATE SET
      licitacion_id = EXCLUDED.licitacion_id,
      titulo = EXCLUDED.titulo,
      fecha_apertura = EXCLUDED.fecha_apertura,
      fecha_cierre = NULL;
  ELSE
    DELETE FROM public."LicitacionRondas"
    WHERE evento_id = NEW.id;
  END IF;

  PERFORM public.renumber_licitacion_rondas(NEW.licitacion_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_ronda_from_evento_trigger ON public."LicitacionEventos";
CREATE TRIGGER sync_ronda_from_evento_trigger
AFTER INSERT OR UPDATE OR DELETE ON public."LicitacionEventos"
FOR EACH ROW
EXECUTE FUNCTION public.sync_ronda_from_evento();

WITH eventos_consulta AS (
  SELECT e.id AS evento_id,
         e.licitacion_id,
         e.titulo,
         e.fecha,
         row_number() OVER (PARTITION BY e.licitacion_id ORDER BY e.fecha, e.id) AS rn
  FROM public."LicitacionEventos" e
  WHERE e.es_ronda_preguntas = true
),
rondas_existentes AS (
  SELECT r.id AS ronda_id,
         r.licitacion_id,
         row_number() OVER (PARTITION BY r.licitacion_id ORDER BY r.numero, r.id) AS rn
  FROM public."LicitacionRondas" r
)
UPDATE public."LicitacionRondas" r
SET evento_id = ec.evento_id,
    fecha_apertura = ec.fecha::timestamptz,
    fecha_cierre = NULL,
    estado = CASE WHEN now() >= ec.fecha::timestamptz THEN 'abierta' ELSE 'programada' END,
    titulo = COALESCE(NULLIF(BTRIM(ec.titulo), ''), r.titulo)
FROM rondas_existentes re
JOIN eventos_consulta ec
  ON ec.licitacion_id = re.licitacion_id
 AND ec.rn = re.rn
WHERE r.id = re.ronda_id;

DELETE FROM public."LicitacionRondas" r
WHERE NOT EXISTS (
  SELECT 1
  FROM public."LicitacionEventos" e
  WHERE e.id = r.evento_id
    AND e.es_ronda_preguntas = true
)
AND EXISTS (
  SELECT 1
  FROM public."LicitacionEventos" e2
  WHERE e2.licitacion_id = r.licitacion_id
    AND e2.es_ronda_preguntas = true
);

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT DISTINCT licitacion_id
    FROM public."LicitacionRondas"
  LOOP
    UPDATE public."LicitacionRondas" r
    SET estado = CASE
      WHEN r.fecha_cierre IS NOT NULL AND now() > r.fecha_cierre THEN 'cerrada'
      WHEN now() >= r.fecha_apertura THEN 'abierta'
      ELSE 'programada'
    END
    WHERE r.licitacion_id = rec.licitacion_id;

    PERFORM public.renumber_licitacion_rondas(rec.licitacion_id);
  END LOOP;
END $$;