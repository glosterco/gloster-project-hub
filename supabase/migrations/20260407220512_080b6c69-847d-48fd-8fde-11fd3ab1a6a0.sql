CREATE OR REPLACE FUNCTION public.sync_ronda_from_evento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      NEW.fecha_fin
    )
    ON CONFLICT (evento_id)
    DO UPDATE SET
      licitacion_id = EXCLUDED.licitacion_id,
      titulo = EXCLUDED.titulo,
      fecha_apertura = EXCLUDED.fecha_apertura,
      fecha_cierre = EXCLUDED.fecha_cierre;
  ELSE
    DELETE FROM public."LicitacionRondas"
    WHERE evento_id = NEW.id;
  END IF;

  PERFORM public.renumber_licitacion_rondas(NEW.licitacion_id);
  RETURN NEW;
END;
$function$;