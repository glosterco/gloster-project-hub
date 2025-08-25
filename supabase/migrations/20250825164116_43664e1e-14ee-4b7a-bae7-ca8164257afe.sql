-- Corregir la función set_config con search_path para seguridad
DROP FUNCTION IF EXISTS public.set_config(text, text, boolean);

CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text, is_local boolean DEFAULT false)
RETURNS void AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, is_local);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';