-- Add Especialidad column to RFI table
ALTER TABLE public."RFI" 
ADD COLUMN IF NOT EXISTS "Especialidad" text;

-- Add comment for documentation
COMMENT ON COLUMN public."RFI"."Especialidad" IS 'Specialty/discipline associated with the RFI';