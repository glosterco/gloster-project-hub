-- Populate contratista_users table with existing contractor data
INSERT INTO public.contratista_users (contratista_id, auth_user_id, permission_level)
SELECT 
  id as contratista_id,
  auth_user_id,
  'admin' as permission_level
FROM public."Contratistas"
WHERE auth_user_id IS NOT NULL
ON CONFLICT DO NOTHING;