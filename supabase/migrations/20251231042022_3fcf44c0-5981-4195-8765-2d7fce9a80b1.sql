-- Add Correlativo column to Adicionales table
ALTER TABLE public."Adicionales" 
ADD COLUMN IF NOT EXISTS "Correlativo" integer;

-- Add Correlativo column to RFI table
ALTER TABLE public."RFI" 
ADD COLUMN IF NOT EXISTS "Correlativo" integer;

-- Create function to set correlativo for Adicionales
CREATE OR REPLACE FUNCTION public.set_adicional_correlativo()
RETURNS TRIGGER AS $$
DECLARE
  next_correlativo INTEGER;
BEGIN
  -- Get max correlativo for this project and add 1
  SELECT COALESCE(MAX("Correlativo"), 0) + 1 
  INTO next_correlativo
  FROM public."Adicionales"
  WHERE "Proyecto" = NEW."Proyecto";
  
  NEW."Correlativo" := next_correlativo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to set correlativo for RFI
CREATE OR REPLACE FUNCTION public.set_rfi_correlativo()
RETURNS TRIGGER AS $$
DECLARE
  next_correlativo INTEGER;
BEGIN
  -- Get max correlativo for this project and add 1
  SELECT COALESCE(MAX("Correlativo"), 0) + 1 
  INTO next_correlativo
  FROM public."RFI"
  WHERE "Proyecto" = NEW."Proyecto";
  
  NEW."Correlativo" := next_correlativo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_adicional_correlativo_trigger ON public."Adicionales";
DROP TRIGGER IF EXISTS set_rfi_correlativo_trigger ON public."RFI";

-- Create trigger for Adicionales
CREATE TRIGGER set_adicional_correlativo_trigger
BEFORE INSERT ON public."Adicionales"
FOR EACH ROW
EXECUTE FUNCTION public.set_adicional_correlativo();

-- Create trigger for RFI
CREATE TRIGGER set_rfi_correlativo_trigger
BEFORE INSERT ON public."RFI"
FOR EACH ROW
EXECUTE FUNCTION public.set_rfi_correlativo();

-- Backfill existing records with project-specific correlativos
WITH ranked_adicionales AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "Proyecto" ORDER BY created_at, id) as rn
  FROM public."Adicionales"
)
UPDATE public."Adicionales" a
SET "Correlativo" = ra.rn
FROM ranked_adicionales ra
WHERE a.id = ra.id AND a."Correlativo" IS NULL;

WITH ranked_rfi AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "Proyecto" ORDER BY created_at, id) as rn
  FROM public."RFI"
)
UPDATE public."RFI" r
SET "Correlativo" = rr.rn
FROM ranked_rfi rr
WHERE r.id = rr.id AND r."Correlativo" IS NULL;