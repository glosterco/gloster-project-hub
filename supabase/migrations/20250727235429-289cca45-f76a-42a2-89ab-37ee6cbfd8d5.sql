-- Limpiar códigos temporales con formato incorrecto (6 dígitos numéricos en lugar de alfanuméricos)
-- y códigos expirados
DELETE FROM temporary_access_codes 
WHERE code ~ '^[0-9]{6}$' 
   OR expires_at < NOW();

-- Verificar códigos temporales restantes
SELECT 
  id,
  payment_id,
  email,
  code,
  used,
  expires_at,
  created_at
FROM temporary_access_codes 
WHERE used = false
ORDER BY created_at DESC;