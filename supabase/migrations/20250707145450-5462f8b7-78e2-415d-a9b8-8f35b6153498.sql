-- Eliminar política restrictiva actual
DROP POLICY IF EXISTS "Authenticated users can read their contratistas" ON public."Contratistas";

-- Crear nueva política que permita lectura pública para verificación de email
CREATE POLICY "Public can read contratistas for verification" 
  ON public."Contratistas" 
  FOR SELECT 
  TO public 
  USING (true);