-- Actualizar el mandante existente con id=63 para agregar los campos faltantes
UPDATE "Mandantes" 
SET 
  "Username" = 'mandante@gloster.com',
  "Password" = 'A1234567',
  auth_user_id = '2638b2ad-93e2-4268-b92c-7e9e70b6b519'
WHERE id = 63;