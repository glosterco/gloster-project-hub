-- Remove all existing update policies for Estados de pago
DROP POLICY IF EXISTS "Strict authenticated payment updates policy" ON public."Estados de pago";
DROP POLICY IF EXISTS "Authenticated users can update project payments" ON public."Estados de pago";
DROP POLICY IF EXISTS "Anyone can update payment status" ON public."Estados de pago";

-- Create a permissive policy that allows anyone to update the Status field
-- This replaces the previous restrictive policy
CREATE POLICY "Open payment status updates" 
ON public."Estados de pago" 
FOR UPDATE 
USING (true) 
WITH CHECK (true);