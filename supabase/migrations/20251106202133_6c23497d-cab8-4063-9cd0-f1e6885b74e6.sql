-- Add missing foreign key relationships for Licitaciones tables
-- Only add constraints that don't already exist

-- Add foreign key from LicitacionItems to Licitaciones (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LicitacionItems_licitacion_id_fkey'
  ) THEN
    ALTER TABLE public."LicitacionItems"
    ADD CONSTRAINT "LicitacionItems_licitacion_id_fkey"
    FOREIGN KEY (licitacion_id)
    REFERENCES public."Licitaciones"(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from LicitacionEventos to Licitaciones (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LicitacionEventos_licitacion_id_fkey'
  ) THEN
    ALTER TABLE public."LicitacionEventos"
    ADD CONSTRAINT "LicitacionEventos_licitacion_id_fkey"
    FOREIGN KEY (licitacion_id)
    REFERENCES public."Licitaciones"(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from LicitacionOferentes to Licitaciones (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LicitacionOferentes_licitacion_id_fkey'
  ) THEN
    ALTER TABLE public."LicitacionOferentes"
    ADD CONSTRAINT "LicitacionOferentes_licitacion_id_fkey"
    FOREIGN KEY (licitacion_id)
    REFERENCES public."Licitaciones"(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from Licitaciones to Mandantes (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Licitaciones_mandante_id_fkey'
  ) THEN
    ALTER TABLE public."Licitaciones"
    ADD CONSTRAINT "Licitaciones_mandante_id_fkey"
    FOREIGN KEY (mandante_id)
    REFERENCES public."Mandantes"(id)
    ON DELETE CASCADE;
  END IF;
END $$;