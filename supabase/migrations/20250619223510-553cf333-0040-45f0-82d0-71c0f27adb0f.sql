
-- Eliminar políticas existentes conflictivas para Mandantes
DROP POLICY IF EXISTS "Anyone can insert mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "Anyone can read mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "Anyone can update mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "Users can create mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "Users can view mandantes" ON public."Mandantes";

-- Crear nuevas políticas más permisivas para Mandantes
CREATE POLICY "Authenticated users can insert mandantes" 
  ON public."Mandantes" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read mandantes" 
  ON public."Mandantes" 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can update mandantes" 
  ON public."Mandantes" 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Eliminar políticas existentes conflictivas para Contratistas
DROP POLICY IF EXISTS "Anyone can insert contratistas" ON public."Contratistas";
DROP POLICY IF EXISTS "Anyone can read contratistas" ON public."Contratistas";
DROP POLICY IF EXISTS "Anyone can update contratistas" ON public."Contratistas";
DROP POLICY IF EXISTS "Anyone can delete contratistas" ON public."Contratistas";
DROP POLICY IF EXISTS "Users can create their contractor profile" ON public."Contratistas";
DROP POLICY IF EXISTS "Users can view their contractor profile" ON public."Contratistas";
DROP POLICY IF EXISTS "Users can update their contractor profile" ON public."Contratistas";

-- Crear nuevas políticas más permisivas para Contratistas
CREATE POLICY "Authenticated users can insert contratistas" 
  ON public."Contratistas" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read contratistas" 
  ON public."Contratistas" 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can update contratistas" 
  ON public."Contratistas" 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contratistas" 
  ON public."Contratistas" 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Eliminar políticas existentes conflictivas para Proyectos
DROP POLICY IF EXISTS "Users can create projects" ON public."Proyectos";
DROP POLICY IF EXISTS "Users can view their projects" ON public."Proyectos";
DROP POLICY IF EXISTS "Users can update their projects" ON public."Proyectos";

-- Crear nuevas políticas más permisivas para Proyectos
CREATE POLICY "Authenticated users can insert proyectos" 
  ON public."Proyectos" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read proyectos" 
  ON public."Proyectos" 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can update proyectos" 
  ON public."Proyectos" 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Eliminar políticas existentes conflictivas para Estados de pago
DROP POLICY IF EXISTS "Users can create payment states" ON public."Estados de pago";
DROP POLICY IF EXISTS "Users can view their payment states" ON public."Estados de pago";
DROP POLICY IF EXISTS "Users can update their payment states" ON public."Estados de pago";

-- Crear nuevas políticas más permisivas para Estados de pago
CREATE POLICY "Authenticated users can insert estados de pago" 
  ON public."Estados de pago" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read estados de pago" 
  ON public."Estados de pago" 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can update estados de pago" 
  ON public."Estados de pago" 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);
