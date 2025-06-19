
-- Actualizar la tabla Estados de pago para asegurar que el campo URLMandante existe y puede almacenar URLs únicas
ALTER TABLE "Estados de pago" 
ALTER COLUMN "URLMandante" TYPE text;

-- Crear un índice para mejorar las consultas por URLMandante
CREATE INDEX IF NOT EXISTS idx_estados_pago_url_mandante ON "Estados de pago"("URLMandante");
