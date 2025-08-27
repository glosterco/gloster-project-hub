-- SOLUCIÓN: Eliminar la política duplicada que está causando conflicto
DROP POLICY IF EXISTS "Service role can update estados de pago" ON public."Estados de pago";

-- La política "Allow payment updates with email or auth access" ya incluye service_role
-- Así que no necesitamos la política duplicada