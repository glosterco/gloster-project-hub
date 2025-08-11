-- Fix security issues by updating RLS policies for sensitive data tables

-- 1. Update Contratistas table RLS policies to secure personal data
DROP POLICY IF EXISTS "Public can read contratistas for verification" ON public."Contratistas";

-- Allow contractors to read their own data and related users
CREATE POLICY "Contractors can read own data and related users" 
ON public."Contratistas" 
FOR SELECT 
USING (
  auth_user_id = auth.uid() OR  -- Own contractor data
  id IN (
    -- Related contractor users can see the main contractor
    SELECT cu.contratista_id 
    FROM public.contratista_users cu 
    WHERE cu.auth_user_id = auth.uid()
  ) OR
  id IN (
    -- Mandantes can see contractors from their projects
    SELECT p."Contratista"
    FROM public."Proyectos" p
    INNER JOIN public."Mandantes" m ON p."Owner" = m.id
    WHERE m.auth_user_id = auth.uid()
  ) OR
  id IN (
    -- Associated mandante users can see contractors from their projects
    SELECT p."Contratista"
    FROM public."Proyectos" p
    INNER JOIN public.mandante_users mu ON p."Owner" = mu.mandante_id
    WHERE mu.auth_user_id = auth.uid()
  )
);

-- 2. Update Estados de pago table RLS policies to secure financial data
DROP POLICY IF EXISTS "Public can read estados de pago for email verification" ON public."Estados de pago";

-- Allow access based on project relationships
CREATE POLICY "Estados de pago access by project relationship" 
ON public."Estados de pago" 
FOR SELECT 
USING (
  "Project" IN (
    -- Contractors can see their project payments
    SELECT p.id
    FROM public."Proyectos" p
    INNER JOIN public."Contratistas" c ON p."Contratista" = c.id
    WHERE c.auth_user_id = auth.uid()
  ) OR
  "Project" IN (
    -- Contractor users can see their contractor's project payments
    SELECT p.id
    FROM public."Proyectos" p
    INNER JOIN public.contratista_users cu ON p."Contratista" = cu.contratista_id
    WHERE cu.auth_user_id = auth.uid()
  ) OR
  "Project" IN (
    -- Mandantes can see their project payments
    SELECT p.id
    FROM public."Proyectos" p
    INNER JOIN public."Mandantes" m ON p."Owner" = m.id
    WHERE m.auth_user_id = auth.uid()
  ) OR
  "Project" IN (
    -- Associated mandante users can see their mandante's project payments
    SELECT p.id
    FROM public."Proyectos" p
    INNER JOIN public.mandante_users mu ON p."Owner" = mu.mandante_id
    WHERE mu.auth_user_id = auth.uid()
  )
);

-- 3. Update Proyectos table RLS policies to secure project data
DROP POLICY IF EXISTS "Public can read proyectos for email verification" ON public."Proyectos";

-- Allow access based on project ownership and contractor assignment
CREATE POLICY "Proyectos access by ownership and assignment" 
ON public."Proyectos" 
FOR SELECT 
USING (
  "Owner" IN (
    -- Mandantes can see their projects
    SELECT m.id
    FROM public."Mandantes" m
    WHERE m.auth_user_id = auth.uid()
  ) OR
  "Owner" IN (
    -- Associated mandante users can see their mandante's projects
    SELECT mu.mandante_id
    FROM public.mandante_users mu
    WHERE mu.auth_user_id = auth.uid()
  ) OR
  "Contratista" IN (
    -- Contractors can see their assigned projects
    SELECT c.id
    FROM public."Contratistas" c
    WHERE c.auth_user_id = auth.uid()
  ) OR
  "Contratista" IN (
    -- Contractor users can see their contractor's projects
    SELECT cu.contratista_id
    FROM public.contratista_users cu
    WHERE cu.auth_user_id = auth.uid()
  )
);