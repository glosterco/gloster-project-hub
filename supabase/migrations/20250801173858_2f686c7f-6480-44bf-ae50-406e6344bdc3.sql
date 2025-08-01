-- Corregir advertencias de seguridad - actualizar funciones con search_path
CREATE OR REPLACE FUNCTION public.get_user_mandante_ids(user_id UUID)
RETURNS BIGINT[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT ARRAY_AGG(entity_id)
  FROM public.user_roles 
  WHERE auth_user_id = user_id AND role_type = 'mandante';
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;