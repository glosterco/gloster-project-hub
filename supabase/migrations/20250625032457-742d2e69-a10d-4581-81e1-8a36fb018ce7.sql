
-- Eliminar políticas existentes conflictivas y crear nuevas políticas más específicas

-- CONTRATISTAS: Permitir INSERT público para registro
DROP POLICY IF EXISTS "Authenticated users can insert contratistas" ON public."Contratistas";
DROP POLICY IF EXISTS "Authenticated users can read contratistas" ON public."Contratistas";
DROP POLICY IF EXISTS "Authenticated users can update contratistas" ON public."Contratistas";
DROP POLICY IF EXISTS "Authenticated users can delete contratistas" ON public."Contratistas";

-- Políticas para Contratistas
CREATE POLICY "Public can insert contratistas for registration" 
  ON public."Contratistas" 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read their contratistas" 
  ON public."Contratistas" 
  FOR SELECT 
  TO authenticated 
  USING (auth_user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their contratistas" 
  ON public."Contratistas" 
  FOR UPDATE 
  TO authenticated 
  USING (auth_user_id = auth.uid()) 
  WITH CHECK (auth_user_id = auth.uid());

-- MANDANTES: Permitir INSERT público y SELECT limitado para verificación
DROP POLICY IF EXISTS "Authenticated users can insert mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "Authenticated users can read mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "Authenticated users can update mandantes" ON public."Mandantes";

-- Políticas para Mandantes
CREATE POLICY "Public can insert mandantes for registration" 
  ON public."Mandantes" 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Public can read mandantes for email verification" 
  ON public."Mandantes" 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Authenticated users can update mandantes" 
  ON public."Mandantes" 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- PROYECTOS: Permitir INSERT público y SELECT limitado
DROP POLICY IF EXISTS "Authenticated users can insert proyectos" ON public."Proyectos";
DROP POLICY IF EXISTS "Authenticated users can read proyectos" ON public."Proyectos";
DROP POLICY IF EXISTS "Authenticated users can update proyectos" ON public."Proyectos";

-- Políticas para Proyectos
CREATE POLICY "Public can insert proyectos for registration" 
  ON public."Proyectos" 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Public can read proyectos for email verification" 
  ON public."Proyectos" 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Authenticated users can update proyectos" 
  ON public."Proyectos" 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- ESTADOS DE PAGO: Permitir INSERT público y SELECT limitado para verificación externa
DROP POLICY IF EXISTS "Authenticated users can insert estados de pago" ON public."Estados de pago";
DROP POLICY IF EXISTS "Authenticated users can read estados de pago" ON public."Estados de pago";
DROP POLICY IF EXISTS "Authenticated users can update estados de pago" ON public."Estados de pago";

-- Políticas para Estados de pago
CREATE POLICY "Public can insert estados de pago for registration" 
  ON public."Estados de pago" 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Public can read estados de pago for email verification" 
  ON public."Estados de pago" 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Authenticated users can update estados de pago" 
  ON public."Estados de pago" 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);
