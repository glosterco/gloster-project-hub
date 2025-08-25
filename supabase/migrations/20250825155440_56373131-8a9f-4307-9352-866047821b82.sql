-- Crear función para verificar acceso de mandante por email sin auth_user_id
CREATE OR REPLACE FUNCTION public.verify_mandante_email_access(payment_id bigint, email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verificar si el email coincide con el mandante del proyecto asociado al pago
  RETURN EXISTS (
    SELECT 1 
    FROM public."Estados de pago" ep
    JOIN public."Proyectos" p ON p.id = ep."Project"
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE ep.id = payment_id 
    AND LOWER(m."ContactEmail") = LOWER(email)
  );
END;
$$;

-- Crear nueva política para mandantes que acceden por email
CREATE POLICY "Mandantes can update payment status via email access" 
ON public."Estados de pago" 
FOR UPDATE 
USING (
  -- Solo permitir actualización de Status y Notes si el email del mandante coincide
  EXISTS (
    SELECT 1 
    FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Project" 
    AND LOWER(m."ContactEmail") = LOWER(current_setting('request.jwt.claims', true)::json->>'email')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Project" 
    AND LOWER(m."ContactEmail") = LOWER(current_setting('request.jwt.claims', true)::json->>'email')
  )
);