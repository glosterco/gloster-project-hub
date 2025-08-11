-- Add public access policies for email verification flows while maintaining security

-- Allow public read access for Estados de pago when accessed via URL tokens
-- This is needed for email verification functionality
CREATE POLICY "Public access for email verification tokens" 
ON public."Estados de pago" 
FOR SELECT 
USING (
  ("URLContratista" IS NOT NULL AND "URLContratista" != '') OR
  ("URLMandante" IS NOT NULL AND "URLMandante" != '')
);

-- Allow public read access for Proyectos when related to payments with URL tokens
-- This is needed for email verification functionality  
CREATE POLICY "Public access for project data in email verification" 
ON public."Proyectos" 
FOR SELECT 
USING (
  id IN (
    SELECT ep."Project"
    FROM public."Estados de pago" ep
    WHERE (ep."URLContratista" IS NOT NULL AND ep."URLContratista" != '') OR
          (ep."URLMandante" IS NOT NULL AND ep."URLMandante" != '')
  )
);

-- Allow public read access for Contratistas when related to projects with URL tokens
-- This is needed for email verification functionality
CREATE POLICY "Public access for contractor data in email verification" 
ON public."Contratistas" 
FOR SELECT 
USING (
  id IN (
    SELECT p."Contratista"
    FROM public."Proyectos" p
    WHERE p.id IN (
      SELECT ep."Project"
      FROM public."Estados de pago" ep
      WHERE (ep."URLContratista" IS NOT NULL AND ep."URLContratista" != '') OR
            (ep."URLMandante" IS NOT NULL AND ep."URLMandante" != '')
    )
  )
);