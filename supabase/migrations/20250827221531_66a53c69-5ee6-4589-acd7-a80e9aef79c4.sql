-- Drop the problematic RLS policy that allows email access to contractor data
DROP POLICY IF EXISTS "Secure payment updates policy" ON public."Estados de pago";

-- Create a strict RLS policy that ONLY allows authenticated users or service role
CREATE POLICY "Strict authenticated payment updates policy" 
ON public."Estados de pago" 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND is_project_related("Project", auth.uid())) 
  OR auth.role() = 'service_role'
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND is_project_related("Project", auth.uid())) 
  OR auth.role() = 'service_role'
);

-- Drop the problematic SELECT policies that allow email access
DROP POLICY IF EXISTS "CC can read payment states via token verification" ON public."Estados de pago";
DROP POLICY IF EXISTS "Estados de pago access by project relationship" ON public."Estados de pago";
DROP POLICY IF EXISTS "Secure payment data access" ON public."Estados de pago";

-- Create a strict SELECT policy that ONLY allows authenticated users
CREATE POLICY "Strict authenticated payment access policy" 
ON public."Estados de pago" 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND is_project_related("Project", auth.uid())
);

-- Update Proyectos table to remove email-based access
DROP POLICY IF EXISTS "Proyectos access by ownership and assignment" ON public."Proyectos";
DROP POLICY IF EXISTS "Secure project data access" ON public."Proyectos";
DROP POLICY IF EXISTS "CC can read projects via contractor relation" ON public."Proyectos";

-- Create strict authenticated-only project access
CREATE POLICY "Strict authenticated project access policy" 
ON public."Proyectos" 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND is_project_related(id, auth.uid())
);

-- Update Contratistas table to remove email access
DROP POLICY IF EXISTS "Read contratistas by ownership or relation" ON public."Contratistas";
DROP POLICY IF EXISTS "CC can read contractor data" ON public."Contratistas";

-- Create strict authenticated-only contractor access
CREATE POLICY "Strict authenticated contractor access policy" 
ON public."Contratistas" 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth_user_id = auth.uid() OR 
    is_contractor_related(id, auth.uid())
  )
);

-- Update Mandantes table to be strict as well
DROP POLICY IF EXISTS "Users can read their mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "CC can read mandante data via project relation" ON public."Mandantes";

-- Create strict authenticated-only mandante access
CREATE POLICY "Strict authenticated mandante access policy" 
ON public."Mandantes" 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth_user_id = auth.uid() OR 
    id = ANY (get_user_mandante_ids(auth.uid()))
  )
);