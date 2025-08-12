-- Tighten RLS update policies to prevent unauthorized modifications

-- 1) Drop overly permissive UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can update mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "Authenticated users can update proyectos" ON public."Proyectos";
DROP POLICY IF EXISTS "Public can update estados de pago for approval" ON public."Estados de pago";

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

-- 3) Create strict UPDATE policies
-- Mandantes: only owners can update their mandantes
CREATE POLICY IF NOT EXISTS "Only owners can update mandantes"
ON public."Mandantes"
FOR UPDATE
USING (id = ANY (public.get_user_mandante_ids(auth.uid())))
WITH CHECK (id = ANY (public.get_user_mandante_ids(auth.uid())));

-- Proyectos: only related users (owner/assigned contractor or their invited users) can update
CREATE POLICY IF NOT EXISTS "Only related users can update proyectos"
ON public."Proyectos"
FOR UPDATE
USING (public.is_project_related(id, auth.uid()))
WITH CHECK (public.is_project_related(id, auth.uid()));

-- Estados de pago: only related users can update
CREATE POLICY IF NOT EXISTS "Only related users can update estados de pago"
ON public."Estados de pago"
FOR UPDATE
USING (public.is_project_related("Project", auth.uid()))
WITH CHECK (public.is_project_related("Project", auth.uid()));

-- Allow backend/service role updates for automation and edge functions
CREATE POLICY IF NOT EXISTS "Service role can update estados de pago"
ON public."Estados de pago"
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');