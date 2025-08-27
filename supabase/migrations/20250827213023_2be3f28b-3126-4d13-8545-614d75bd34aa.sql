-- Crear función set_config que permita establecer configuraciones custom para RLS
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text, is_local boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, is_local);
END;
$$;