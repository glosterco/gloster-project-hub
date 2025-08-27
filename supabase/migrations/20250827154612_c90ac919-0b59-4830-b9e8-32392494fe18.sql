-- Add CC (carbon copy) email column to Contratistas table
ALTER TABLE public."Contratistas" 
ADD COLUMN "CCEmail" text;

-- Add comment for documentation
COMMENT ON COLUMN public."Contratistas"."CCEmail" IS 'Carbon copy email address for notifications when payment states are sent to mandante';