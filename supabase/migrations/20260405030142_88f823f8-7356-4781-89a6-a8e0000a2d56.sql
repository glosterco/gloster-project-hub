-- Add estado column to LicitacionEventos for tracking event completion
ALTER TABLE public."LicitacionEventos" 
ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'pendiente';

-- Add es_ronda_preguntas flag to identify Q&A events
ALTER TABLE public."LicitacionEventos"
ADD COLUMN IF NOT EXISTS es_ronda_preguntas boolean NOT NULL DEFAULT false;

-- Create trigger function to auto-create rondas from calendar events marked as Q&A
CREATE OR REPLACE FUNCTION public.auto_create_ronda_from_evento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  ronda_count INTEGER;
BEGIN
  IF NEW.requiere_archivos = true OR NEW.es_ronda_preguntas = true THEN
    SELECT COUNT(*) INTO ronda_count
    FROM public."LicitacionRondas"
    WHERE licitacion_id = NEW.licitacion_id;

    INSERT INTO public."LicitacionRondas" (licitacion_id, numero, titulo, estado, fecha_apertura, fecha_cierre)
    VALUES (
      NEW.licitacion_id,
      ronda_count + 1,
      'Ronda ' || (ronda_count + 1) || ' - ' || NEW.titulo,
      'abierta',
      now(),
      NEW.fecha::timestamptz
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on LicitacionEventos
DROP TRIGGER IF EXISTS trigger_auto_create_ronda ON public."LicitacionEventos";
CREATE TRIGGER trigger_auto_create_ronda
  AFTER INSERT ON public."LicitacionEventos"
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_ronda_from_evento();