-- Fix RLS policies: remove permissive updates and add strict ones where missing

-- 1) Drop overly permissive UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can update mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "Authenticated users can update proyectos" ON public."Proyectos";
DROP POLICY IF EXISTS "Public can update estados de pago for approval" ON public."Estados de pago";

-- Also drop any prior custom policies to recreate cleanly
DROP POLICY IF EXISTS "Only related users can update proyectos" ON public."Proyectos";
DROP POLICY IF EXISTS "Only related users can update estados de pago" ON public."Estados de pago";
DROP POLICY IF EXISTS "Service role can update estados de pago" ON public."Estados de pago";

-- 2) Helper function to check if a user is related to a project
CREATE OR REPLACE FUNCTION public.is_project_related(_project_id bigint, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = _project_id AND m.auth_user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = _project_id AND mu.auth_user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = _project_id AND c.auth_user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = _project_id AND cu.auth_user_id = _user_id
  );
$$;

-- 3) Create strict UPDATE policies where needed
-- Mandantes: rely on existing strict policy (users can update their mandantes). We removed the permissive one above.

-- Proyectos: only related users (owner/assigned contractor or their invited users) can update
CREATE POLICY "Only related users can update proyectos"
ON public."Proyectos"
FOR UPDATE
USING (public.is_project_related(id, auth.uid()))
WITH CHECK (public.is_project_related(id, auth.uid()));

-- Estados de pago: only related users can update
CREATE POLICY "Only related users can update estados de pago"
ON public."Estados de pago"
FOR UPDATE
USING (public.is_project_related("Project", auth.uid()))
WITH CHECK (public.is_project_related("Project", auth.uid()));

-- Allow backend/service role updates for automation and edge functions
CREATE POLICY "Service role can update estados de pago"
ON public."Estados de pago"
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');