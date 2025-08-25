-- Create function to verify email access for payment modifications
CREATE OR REPLACE FUNCTION public.verify_email_payment_access(payment_id bigint, user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if email belongs to mandante of the project
  IF EXISTS (
    SELECT 1 
    FROM public."Estados de pago" ep
    JOIN public."Proyectos" p ON p.id = ep."Project"
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE ep.id = payment_id 
    AND LOWER(m."ContactEmail") = LOWER(user_email)
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if email belongs to contratista of the project
  IF EXISTS (
    SELECT 1 
    FROM public."Estados de pago" ep
    JOIN public."Proyectos" p ON p.id = ep."Project"
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE ep.id = payment_id 
    AND LOWER(c."ContactEmail") = LOWER(user_email)
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Add new policy for email-based payment status updates
CREATE POLICY "Email verified users can update payment status" 
ON public."Estados de pago" 
FOR UPDATE 
USING (
  -- Allow if user has auth_user_id and is related to project
  is_project_related("Project", auth.uid())
  OR
  -- Allow if email matches mandante or contratista (for users without auth_user_id)
  verify_email_payment_access(id, current_setting('request.jwt.claims', true)::json->>'email')
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  is_project_related("Project", auth.uid())
  OR
  verify_email_payment_access(id, current_setting('request.jwt.claims', true)::json->>'email')
);