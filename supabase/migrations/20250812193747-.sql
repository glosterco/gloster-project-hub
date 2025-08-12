-- Fix recursion and restore access while keeping security
-- 1) Helper function to check contractor-related access without recursive policies
CREATE OR REPLACE FUNCTION public.is_contractor_related(_contratista_id bigint, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contratista_users cu
    WHERE cu.contratista_id = _contratista_id AND cu.auth_user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p."Contratista" = _contratista_id AND m.auth_user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p."Contratista" = _contratista_id AND mu.auth_user_id = _user_id
  );
$$;

-- 2) Replace problematic Contratistas SELECT policies to avoid recursion
DROP POLICY IF EXISTS "Contractors can read own data and related users" ON public."Contratistas";
DROP POLICY IF EXISTS "Secure contractor data access" ON public."Contratistas";

CREATE POLICY "Read contratistas by ownership or relation"
ON public."Contratistas"
FOR SELECT
USING (
  auth.uid() = auth_user_id
  OR public.is_contractor_related(id, auth.uid())
);

-- Keep existing UPDATE/INSERT policies unchanged

-- 3) Auto-generate URLContratista on payment state creation (specific to new row)
CREATE OR REPLACE FUNCTION public.set_contractor_url_for_new_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  unique_token TEXT;
  base_url TEXT := 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com';
  new_access_url TEXT;
BEGIN
  IF NEW."URLContratista" IS NULL OR NEW."URLContratista" = '' THEN
    unique_token := gen_random_uuid()::text;
    new_access_url := base_url || '/email-access?paymentId=' || NEW.id || '&token=' || unique_token;
    NEW."URLContratista" := new_access_url;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_contractor_url_on_insert ON public."Estados de pago";
CREATE TRIGGER set_contractor_url_on_insert
BEFORE INSERT ON public."Estados de pago"
FOR EACH ROW
EXECUTE FUNCTION public.set_contractor_url_for_new_payment();

-- 4) Add missing foreign keys
ALTER TABLE public.contratista_users
  ADD CONSTRAINT contratista_users_contratista_fkey
  FOREIGN KEY (contratista_id) REFERENCES public."Contratistas"(id) ON DELETE CASCADE;

ALTER TABLE public.mandante_project_folders
  ADD CONSTRAINT mandante_project_folders_mandante_fkey
  FOREIGN KEY (mandante_id) REFERENCES public."Mandantes"(id) ON DELETE CASCADE;
