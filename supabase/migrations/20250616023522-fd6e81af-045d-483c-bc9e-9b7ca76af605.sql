
-- Crear políticas RLS para la tabla Mandantes
-- Permitir que cualquier usuario autenticado pueda insertar mandantes
CREATE POLICY "Anyone can insert mandantes" 
  ON public."Mandantes" 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Permitir que cualquier usuario autenticado pueda leer mandantes
CREATE POLICY "Anyone can read mandantes" 
  ON public."Mandantes" 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Permitir que cualquier usuario autenticado pueda actualizar mandantes
CREATE POLICY "Anyone can update mandantes" 
  ON public."Mandantes" 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Habilitar RLS en la tabla (por si no está habilitado)
ALTER TABLE public."Mandantes" ENABLE ROW LEVEL SECURITY;
