-- Poblar la tabla mandante_users con datos existentes
-- Insertar registros basados en user_roles existentes (estos tienen la relación correcta)
INSERT INTO public.mandante_users (mandante_id, auth_user_id, permission_level)
SELECT DISTINCT
  ur.entity_id as mandante_id,
  ur.auth_user_id,
  'admin' as permission_level  -- Asignar permisos de admin por defecto
FROM public.user_roles ur
WHERE ur.role_type = 'mandante'
  AND ur.entity_id IS NOT NULL
  AND ur.auth_user_id IS NOT NULL
ON CONFLICT (mandante_id, auth_user_id) DO NOTHING;

-- Insertar registros para mandantes que tienen auth_user_id pero no están en user_roles
-- (estos son casos donde el auth_user_id está directamente en la tabla Mandantes)
INSERT INTO public.mandante_users (mandante_id, auth_user_id, permission_level)
SELECT DISTINCT
  m.id as mandante_id,
  m.auth_user_id,
  'admin' as permission_level
FROM public."Mandantes" m
WHERE m.auth_user_id IS NOT NULL
  AND m."Status" = true
  -- Solo insertar si no existe ya una relación en user_roles
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.entity_id = m.id 
    AND ur.role_type = 'mandante' 
    AND ur.auth_user_id = m.auth_user_id
  )
ON CONFLICT (mandante_id, auth_user_id) DO NOTHING;

-- Crear user_roles para mandantes que tienen auth_user_id pero no tienen entrada en user_roles
INSERT INTO public.user_roles (auth_user_id, role_type, entity_id)
SELECT DISTINCT
  m.auth_user_id,
  'mandante' as role_type,
  m.id as entity_id
FROM public."Mandantes" m
WHERE m.auth_user_id IS NOT NULL
  AND m."Status" = true
  -- Solo insertar si no existe ya
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.entity_id = m.id 
    AND ur.role_type = 'mandante' 
    AND ur.auth_user_id = m.auth_user_id
  )
ON CONFLICT DO NOTHING;