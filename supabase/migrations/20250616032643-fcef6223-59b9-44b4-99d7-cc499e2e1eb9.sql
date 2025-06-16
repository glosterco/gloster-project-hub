
-- Habilitar RLS para la tabla Proyectos si no está habilitado
ALTER TABLE public."Proyectos" ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuarios autenticados puedan insertar proyectos
CREATE POLICY "Users can create projects" 
  ON public."Proyectos" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Política para permitir que usuarios autenticados puedan ver proyectos donde son contratistas
CREATE POLICY "Users can view their projects" 
  ON public."Proyectos" 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public."Contratistas" 
      WHERE "Contratistas".id = "Proyectos"."Contratista" 
      AND "Contratistas".auth_user_id = auth.uid()
    )
  );

-- Política para permitir que usuarios autenticados puedan actualizar proyectos donde son contratistas
CREATE POLICY "Users can update their projects" 
  ON public."Proyectos" 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public."Contratistas" 
      WHERE "Contratistas".id = "Proyectos"."Contratista" 
      AND "Contratistas".auth_user_id = auth.uid()
    )
  );

-- Habilitar RLS para Estados de pago si no está habilitado
ALTER TABLE public."Estados de pago" ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuarios autenticados puedan insertar estados de pago
CREATE POLICY "Users can create payment states" 
  ON public."Estados de pago" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Proyectos" p
      JOIN public."Contratistas" c ON p."Contratista" = c.id
      WHERE p.id = "Estados de pago"."Project" 
      AND c.auth_user_id = auth.uid()
    )
  );

-- Política para permitir que usuarios autenticados puedan ver estados de pago de sus proyectos
CREATE POLICY "Users can view their payment states" 
  ON public."Estados de pago" 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public."Proyectos" p
      JOIN public."Contratistas" c ON p."Contratista" = c.id
      WHERE p.id = "Estados de pago"."Project" 
      AND c.auth_user_id = auth.uid()
    )
  );

-- Política para permitir que usuarios autenticados puedan actualizar estados de pago de sus proyectos
CREATE POLICY "Users can update their payment states" 
  ON public."Estados de pago" 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public."Proyectos" p
      JOIN public."Contratistas" c ON p."Contratista" = c.id
      WHERE p.id = "Estados de pago"."Project" 
      AND c.auth_user_id = auth.uid()
    )
  );

-- Habilitar RLS para Contratistas si no está habilitado
ALTER TABLE public."Contratistas" ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuarios autenticados puedan insertar su propio perfil de contratista
CREATE POLICY "Users can create their contractor profile" 
  ON public."Contratistas" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth_user_id = auth.uid());

-- Política para permitir que usuarios autenticados puedan ver su propio perfil de contratista
CREATE POLICY "Users can view their contractor profile" 
  ON public."Contratistas" 
  FOR SELECT 
  TO authenticated 
  USING (auth_user_id = auth.uid());

-- Política para permitir que usuarios autenticados puedan actualizar su propio perfil de contratista
CREATE POLICY "Users can update their contractor profile" 
  ON public."Contratistas" 
  FOR UPDATE 
  TO authenticated 
  USING (auth_user_id = auth.uid());

-- Habilitar RLS para Mandantes si no está habilitado
ALTER TABLE public."Mandantes" ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuarios autenticados puedan insertar mandantes
CREATE POLICY "Users can create mandantes" 
  ON public."Mandantes" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Política para permitir que usuarios autenticados puedan ver mandantes
CREATE POLICY "Users can view mandantes" 
  ON public."Mandantes" 
  FOR SELECT 
  TO authenticated 
  USING (true);
