-- Agregar columnas a la tabla Licitaciones si no existen
ALTER TABLE public."Licitaciones" 
ADD COLUMN IF NOT EXISTS gastos_generales numeric,
ADD COLUMN IF NOT EXISTS iva_porcentaje numeric DEFAULT 19;

-- Crear tabla LicitacionItems si no existe
CREATE TABLE IF NOT EXISTS public."LicitacionItems" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  licitacion_id bigint NOT NULL REFERENCES public."Licitaciones"(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  unidad text,
  cantidad numeric,
  precio_unitario numeric,
  precio_total numeric,
  orden smallint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public."LicitacionItems" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Mandantes can view items of their licitaciones" ON public."LicitacionItems";
DROP POLICY IF EXISTS "Mandantes can create items for their licitaciones" ON public."LicitacionItems";
DROP POLICY IF EXISTS "Mandantes can update items of their licitaciones" ON public."LicitacionItems";
DROP POLICY IF EXISTS "Mandantes can delete items of their licitaciones" ON public."LicitacionItems";

-- Create RLS policies for LicitacionItems
CREATE POLICY "Mandantes can view items of their licitaciones"
ON public."LicitacionItems"
FOR SELECT
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can create items for their licitaciones"
ON public."LicitacionItems"
FOR INSERT
WITH CHECK (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can update items of their licitaciones"
ON public."LicitacionItems"
FOR UPDATE
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Mandantes can delete items of their licitaciones"
ON public."LicitacionItems"
FOR DELETE
USING (
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
    )
  )
  OR
  licitacion_id IN (
    SELECT id FROM public."Licitaciones"
    WHERE mandante_id IN (
      SELECT mandante_id FROM public.mandante_users WHERE auth_user_id = auth.uid()
    )
  )
);