-- Add Especialidad column to Adicionales table
ALTER TABLE public."Adicionales" 
ADD COLUMN IF NOT EXISTS "Especialidad" text;

-- Add approval-related columns for Adicionales
ALTER TABLE public."Adicionales" 
ADD COLUMN IF NOT EXISTS "approved_by_email" text,
ADD COLUMN IF NOT EXISTS "approved_by_name" text,
ADD COLUMN IF NOT EXISTS "approved_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "rejection_notes" text;

-- Create index for faster queries by category and specialty
CREATE INDEX IF NOT EXISTS idx_adicionales_categoria ON public."Adicionales"("Categoria");
CREATE INDEX IF NOT EXISTS idx_adicionales_especialidad ON public."Adicionales"("Especialidad");