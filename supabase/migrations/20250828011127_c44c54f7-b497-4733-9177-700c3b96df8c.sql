-- Crear políticas completamente abiertas para permitir registro sin restricciones
-- Eliminar políticas restrictivas y crear políticas permisivas

-- 1. Políticas para Contratistas - Permitir inserción y lectura sin restricciones
DROP POLICY IF EXISTS "Anyone can insert contratistas" ON public."Contratistas";
DROP POLICY IF EXISTS "Strict authenticated contractor access policy" ON public."Contratistas";
DROP POLICY IF EXISTS "Authenticated users can update their contratistas" ON public."Contratistas";

CREATE POLICY "Open contractor registration" ON public."Contratistas" 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Open contractor access" ON public."Contratistas" 
FOR SELECT 
USING (true);

CREATE POLICY "Open contractor updates" ON public."Contratistas" 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 2. Políticas para Mandantes - Permitir inserción y lectura sin restricciones
DROP POLICY IF EXISTS "Anyone can insert mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "Enhanced mandante access policy" ON public."Mandantes";
DROP POLICY IF EXISTS "Users can update their mandantes" ON public."Mandantes";

CREATE POLICY "Open mandante registration" ON public."Mandantes" 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Open mandante access" ON public."Mandantes" 
FOR SELECT 
USING (true);

CREATE POLICY "Open mandante updates" ON public."Mandantes" 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 3. Políticas para Proyectos - Permitir inserción y lectura sin restricciones
DROP POLICY IF EXISTS "Anyone can insert proyectos" ON public."Proyectos";
DROP POLICY IF EXISTS "Strict authenticated project access policy" ON public."Proyectos";
DROP POLICY IF EXISTS "Only related users can update proyectos" ON public."Proyectos";

CREATE POLICY "Open project creation" ON public."Proyectos" 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Open project access" ON public."Proyectos" 
FOR SELECT 
USING (true);

CREATE POLICY "Open project updates" ON public."Proyectos" 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 4. Políticas para Estados de pago - Permitir inserción y lectura sin restricciones
DROP POLICY IF EXISTS "Anyone can insert estados de pago" ON public."Estados de pago";
DROP POLICY IF EXISTS "Strict authenticated payment access policy" ON public."Estados de pago";
DROP POLICY IF EXISTS "Open payment status updates" ON public."Estados de pago";

CREATE POLICY "Open payment creation" ON public."Estados de pago" 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Open payment access" ON public."Estados de pago" 
FOR SELECT 
USING (true);

CREATE POLICY "Open payment updates" ON public."Estados de pago" 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 5. Políticas para user_roles - Permitir inserción sin restricciones
DROP POLICY IF EXISTS "Anyone can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

CREATE POLICY "Open role creation" ON public.user_roles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Open role access" ON public.user_roles 
FOR SELECT 
USING (true);

CREATE POLICY "Open role updates" ON public.user_roles 
FOR UPDATE 
USING (true)
WITH CHECK (true);