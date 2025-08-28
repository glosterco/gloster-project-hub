-- Drop existing restrictive INSERT policies and create permissive ones
-- Allow anyone to create contratistas
DROP POLICY IF EXISTS "Public can insert contratistas for registration" ON public."Contratistas";
CREATE POLICY "Anyone can insert contratistas" ON public."Contratistas" 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to create mandantes  
DROP POLICY IF EXISTS "Public can insert mandantes for registration" ON public."Mandantes";
CREATE POLICY "Anyone can insert mandantes" ON public."Mandantes" 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to create proyectos
DROP POLICY IF EXISTS "Public can insert proyectos for registration" ON public."Proyectos";
CREATE POLICY "Anyone can insert proyectos" ON public."Proyectos" 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to create estados de pago
DROP POLICY IF EXISTS "Public can insert estados de pago for registration" ON public."Estados de pago";
CREATE POLICY "Anyone can insert estados de pago" ON public."Estados de pago" 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to create user roles
DROP POLICY IF EXISTS "Authenticated users can insert their own roles" ON public.user_roles;
CREATE POLICY "Anyone can insert user roles" ON public.user_roles 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to create contratista_users
DROP POLICY IF EXISTS "Contratista users can add users" ON public.contratista_users;
CREATE POLICY "Anyone can insert contratista users" ON public.contratista_users 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to create mandante_users
DROP POLICY IF EXISTS "Mandante admins can add users" ON public.mandante_users;
CREATE POLICY "Anyone can insert mandante users" ON public.mandante_users 
FOR INSERT 
WITH CHECK (true);