-- PHASE 1: Remove plaintext passwords and secure authentication

-- Remove the Password column from Contratistas table (CRITICAL SECURITY FIX)
ALTER TABLE public."Contratistas" DROP COLUMN IF EXISTS "Password";

-- Remove the Username column as well since we're using Supabase Auth
ALTER TABLE public."Contratistas" DROP COLUMN IF EXISTS "Username";

-- Remove overly permissive public policies that expose sensitive data
DROP POLICY IF EXISTS "Public access for contractor data in email verification" ON public."Contratistas";
DROP POLICY IF EXISTS "Public access for email verification tokens" ON public."Estados de pago"; 
DROP POLICY IF EXISTS "Public access for project data in email verification" ON public."Proyectos";

-- Create secure RLS policies for Contratistas that protect PII
-- Only allow reading contractor data if user is authenticated and has proper access
CREATE POLICY "Secure contractor data access" 
ON public."Contratistas" 
FOR SELECT 
USING (
  -- User owns this contractor profile
  auth_user_id = auth.uid() OR
  -- User is an associated contractor user
  id IN (
    SELECT cu.contratista_id 
    FROM contratista_users cu 
    WHERE cu.auth_user_id = auth.uid()
  ) OR
  -- User is a mandante who owns projects with this contractor
  id IN (
    SELECT p."Contratista"
    FROM "Proyectos" p
    JOIN "Mandantes" m ON p."Owner" = m.id
    WHERE m.auth_user_id = auth.uid()
  ) OR
  -- User is a mandante user who has access to projects with this contractor
  id IN (
    SELECT p."Contratista"
    FROM "Proyectos" p
    JOIN mandante_users mu ON p."Owner" = mu.mandante_id
    WHERE mu.auth_user_id = auth.uid()
  )
);

-- Create secure RLS policies for Estados de pago that protect financial data
CREATE POLICY "Secure payment data access" 
ON public."Estados de pago" 
FOR SELECT 
USING (
  -- User has access through project ownership or assignment relationships
  "Project" IN (
    -- User owns the contractor
    SELECT p.id
    FROM "Proyectos" p
    JOIN "Contratistas" c ON p."Contratista" = c.id
    WHERE c.auth_user_id = auth.uid()
  ) OR
  "Project" IN (
    -- User is an associated contractor user
    SELECT p.id
    FROM "Proyectos" p
    JOIN contratista_users cu ON p."Contratista" = cu.contratista_id
    WHERE cu.auth_user_id = auth.uid()
  ) OR
  "Project" IN (
    -- User owns the mandante
    SELECT p.id
    FROM "Proyectos" p
    JOIN "Mandantes" m ON p."Owner" = m.id
    WHERE m.auth_user_id = auth.uid()
  ) OR
  "Project" IN (
    -- User is an associated mandante user
    SELECT p.id
    FROM "Proyectos" p
    JOIN mandante_users mu ON p."Owner" = mu.mandante_id
    WHERE mu.auth_user_id = auth.uid()
  )
);

-- Create secure RLS policies for Proyectos that protect business data
CREATE POLICY "Secure project data access" 
ON public."Proyectos" 
FOR SELECT 
USING (
  -- User owns the mandante
  "Owner" IN (
    SELECT m.id
    FROM "Mandantes" m
    WHERE m.auth_user_id = auth.uid()
  ) OR
  -- User is an associated mandante user
  "Owner" IN (
    SELECT mu.mandante_id
    FROM mandante_users mu
    WHERE mu.auth_user_id = auth.uid()
  ) OR
  -- User owns the contractor
  "Contratista" IN (
    SELECT c.id
    FROM "Contratistas" c
    WHERE c.auth_user_id = auth.uid()
  ) OR
  -- User is an associated contractor user
  "Contratista" IN (
    SELECT cu.contratista_id
    FROM contratista_users cu
    WHERE cu.auth_user_id = auth.uid()
  )
);