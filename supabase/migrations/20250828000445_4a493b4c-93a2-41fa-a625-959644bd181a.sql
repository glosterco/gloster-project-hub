-- Fix the mandante access issue by allowing access when user has project relationship
-- Update the Mandantes RLS policy to allow access to mandantes of projects the user has access to

-- First, let's create a function to check if user has access to a mandante through projects
CREATE OR REPLACE FUNCTION public.has_mandante_project_access(_mandante_id bigint, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Check if user is directly associated with the mandante
  SELECT EXISTS (
    SELECT 1 FROM public."Mandantes" m
    WHERE m.id = _mandante_id AND m.auth_user_id = _user_id
  )
  OR EXISTS (
    -- Check if user has access to any project owned by this mandante
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p."Owner" = _mandante_id AND c.auth_user_id = _user_id
  )
  OR EXISTS (
    -- Check if user is in mandante_users for this mandante
    SELECT 1 FROM public.mandante_users mu
    WHERE mu.mandante_id = _mandante_id AND mu.auth_user_id = _user_id
  );
$$;

-- Update the Mandantes RLS policy for SELECT to use the new function
DROP POLICY IF EXISTS "Strict authenticated mandante access policy" ON public."Mandantes";
CREATE POLICY "Enhanced mandante access policy"
ON public."Mandantes"
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    (auth_user_id = auth.uid()) OR 
    (id = ANY (get_user_mandante_ids(auth.uid()))) OR
    has_mandante_project_access(id, auth.uid())
  )
);