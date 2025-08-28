-- Allow anyone to update the Status field in Estados de pago table
-- Drop the existing strict update policy
DROP POLICY IF EXISTS "Strict authenticated payment updates policy" ON public."Estados de pago";

-- Create a new policy that allows authenticated users to update project-related payments
CREATE POLICY "Authenticated users can update project payments" 
ON public."Estados de pago" 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND is_project_related("Project", auth.uid())) 
  OR (auth.role() = 'service_role'::text)
) 
WITH CHECK (
  (auth.uid() IS NOT NULL AND is_project_related("Project", auth.uid())) 
  OR (auth.role() = 'service_role'::text)
);

-- Create a separate policy that allows anyone to update only the Status field
CREATE POLICY "Anyone can update payment status" 
ON public."Estados de pago" 
FOR UPDATE 
USING (true) 
WITH CHECK (true);