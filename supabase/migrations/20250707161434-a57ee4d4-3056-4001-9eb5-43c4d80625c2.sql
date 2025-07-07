-- Permitir updates públicos en Estados de pago para mandantes
DROP POLICY IF EXISTS "Authenticated users can update estados de pago" ON public."Estados de pago";

-- Crear nueva política que permita updates públicos
CREATE POLICY "Public can update estados de pago for approval" 
  ON public."Estados de pago" 
  FOR UPDATE 
  TO public 
  USING (true)
  WITH CHECK (true);