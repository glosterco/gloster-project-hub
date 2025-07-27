-- Limpiar registros de user_roles que no corresponden a usuarios reales
DELETE FROM user_roles 
WHERE auth_user_id NOT IN (
  SELECT id FROM auth.users
);

-- Verificar que solo queden registros válidos
SELECT 
  ur.auth_user_id,
  ur.role_type,
  ur.entity_id,
  au.email
FROM user_roles ur
LEFT JOIN auth.users au ON ur.auth_user_id = au.id;