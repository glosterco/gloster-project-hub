
-- Habilitar RLS en la tabla Contratistas (por si no está habilitado)
ALTER TABLE public."Contratistas" ENABLE ROW LEVEL SECURITY;

-- Permitir que cualquier usuario autenticado pueda insertar contratistas
CREATE POLICY "Anyone can insert contratistas" 
  ON public."Contratistas" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Permitir que cualquier usuario autenticado pueda leer contratistas
CREATE POLICY "Anyone can read contratistas" 
  ON public."Contratistas" 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Permitir que cualquier usuario autenticado pueda actualizar contratistas
CREATE POLICY "Anyone can update contratistas" 
  ON public."Contratistas" 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Permitir que cualquier usuario autenticado pueda eliminar contratistas
CREATE POLICY "Anyone can delete contratistas" 
  ON public."Contratistas" 
  FOR DELETE 
  TO authenticated 
  USING (true);
