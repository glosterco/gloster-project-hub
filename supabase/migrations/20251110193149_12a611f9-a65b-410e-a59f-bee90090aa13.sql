-- Crear función para calcular el total del presupuesto
CREATE OR REPLACE FUNCTION public.calculate_presupuesto_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Calcular Total = Cantidad * PU
  -- Solo calcular si ambos valores no son NULL
  IF NEW."Cantidad" IS NOT NULL AND NEW."PU" IS NOT NULL THEN
    NEW."Total" := NEW."Cantidad" * NEW."PU";
  ELSE
    NEW."Total" := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecuta antes de INSERT o UPDATE
DROP TRIGGER IF EXISTS calculate_total_trigger ON public."Presupuesto";
CREATE TRIGGER calculate_total_trigger
  BEFORE INSERT OR UPDATE OF "Cantidad", "PU"
  ON public."Presupuesto"
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_presupuesto_total();

-- Actualizar todos los registros existentes para recalcular el Total
UPDATE public."Presupuesto"
SET "Total" = "Cantidad" * "PU"
WHERE "Cantidad" IS NOT NULL AND "PU" IS NOT NULL;