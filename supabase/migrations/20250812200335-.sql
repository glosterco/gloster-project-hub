-- 1) Drop legacy columns from Mandantes (if they still exist)
ALTER TABLE public."Mandantes"
  DROP COLUMN IF EXISTS "Username",
  DROP COLUMN IF EXISTS "Password";

-- 2) Strengthen user_roles structure to store local credentials securely
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS local_username text,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS login_provider text NOT NULL DEFAULT 'supabase';

-- 3) Tighten RLS policy for INSERT on user_roles (only allow user to insert their own rows)
DO $$
BEGIN
  -- Drop existing INSERT policy if present
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Public can insert user roles for registration'
  ) THEN
    DROP POLICY "Public can insert user roles for registration" ON public.user_roles;
  END IF;
END$$;

-- Create stricter INSERT policy (authenticated user must own the row)
CREATE POLICY "Users can insert their own roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- Ensure SELECT and UPDATE policies exist as expected (idempotent recreation guarded by checks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Users can read their own roles'
  ) THEN
    CREATE POLICY "Users can read their own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Users can update their own roles'
  ) THEN
    CREATE POLICY "Users can update their own roles"
    ON public.user_roles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);
  END IF;
END$$;

-- 4) Add missing foreign keys
DO $$
BEGIN
  -- contratista_users -> Contratistas(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_contratista_users_contratista'
  ) THEN
    ALTER TABLE public.contratista_users
      ADD CONSTRAINT fk_contratista_users_contratista
      FOREIGN KEY (contratista_id)
      REFERENCES public."Contratistas"(id)
      ON DELETE CASCADE;
  END IF;

  -- mandante_project_folders -> Mandantes(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_mandante_project_folders_mandante'
  ) THEN
    ALTER TABLE public.mandante_project_folders
      ADD CONSTRAINT fk_mandante_project_folders_mandante
      FOREIGN KEY (mandante_id)
      REFERENCES public."Mandantes"(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- 5) Auto-generate URLContratista for new payment states via trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_contractor_url_before_insert'
  ) THEN
    CREATE TRIGGER set_contractor_url_before_insert
    BEFORE INSERT ON public."Estados de pago"
    FOR EACH ROW
    EXECUTE FUNCTION public.set_contractor_url_for_new_payment();
  END IF;
END$$;