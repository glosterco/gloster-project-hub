
-- Habilitar realtime para la tabla Estados de pago
ALTER TABLE "Estados de pago" REPLICA IDENTITY FULL;

-- Agregar la tabla a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE "Estados de pago";

-- Crear índice para mejorar performance de consultas por proyecto
CREATE INDEX IF NOT EXISTS idx_estados_pago_project ON "Estados de pago"("Project");

-- Crear función para log de cambios (para debugging adicional)
CREATE OR REPLACE FUNCTION log_payment_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'PAYMENT STATUS CHANGE: ID=%, Name=%, Old Status=%, New Status=%, Project=%, Time=%', 
    NEW.id, NEW."Name", OLD."Status", NEW."Status", NEW."Project", now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para loguear cambios
DROP TRIGGER IF EXISTS payment_status_change_logger ON "Estados de pago";
CREATE TRIGGER payment_status_change_logger
  AFTER UPDATE ON "Estados de pago"
  FOR EACH ROW
  WHEN (OLD."Status" IS DISTINCT FROM NEW."Status")
  EXECUTE FUNCTION log_payment_status_changes();
