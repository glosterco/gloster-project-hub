
-- SOLUCIÓN COMPLETA PARA TODOS LOS POSIBLES CASOS

-- 1. DESACTIVAR LA FUNCIÓN SOSPECHOSA
-- Comentar o deshabilitar la función update_payment_states_weekly
DROP FUNCTION IF EXISTS public.update_payment_states_weekly();

-- 2. VERIFICAR Y ELIMINAR CUALQUIER CRON JOB EXISTENTE
-- Eliminar jobs de cron que puedan estar ejecutando la función
DO $$
BEGIN
    -- Intentar eliminar jobs de cron si existen
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule(jobname) 
        FROM cron.job 
        WHERE command LIKE '%update_payment_states_weekly%';
    END IF;
END $$;

-- 3. VERIFICAR TRIGGERS EXISTENTES EN LA TABLA
-- Mostrar todos los triggers en la tabla Estados de pago
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'Estados de pago'
  AND trigger_schema = 'public';

-- 4. ELIMINAR CUALQUIER TRIGGER SOSPECHOSO (si existe)
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'Estados de pago'
          AND trigger_schema = 'public'
          AND trigger_name LIKE '%update%payment%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON "Estados de pago"';
    END LOOP;
END $$;

-- 5. CREAR TRIGGER DE AUDITORÍA PARA DETECTAR CAMBIOS
CREATE OR REPLACE FUNCTION public.audit_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar cualquier cambio no autorizado
    RAISE NOTICE 'PAYMENT STATUS CHANGE DETECTED: Table=%, Action=%, Old Status=%, New Status=%, User=%, Time=%', 
        TG_TABLE_NAME, TG_OP, 
        COALESCE(OLD."Status", 'NULL'), 
        COALESCE(NEW."Status", 'NULL'),
        COALESCE(current_user, 'UNKNOWN'),
        now();
    
    -- Registrar en logs
    INSERT INTO public.payment_audit_log (
        payment_id,
        old_status,
        new_status,
        changed_by,
        changed_at,
        operation
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        OLD."Status",
        NEW."Status",
        current_user,
        now(),
        TG_OP
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS public.payment_audit_log (
    id SERIAL PRIMARY KEY,
    payment_id BIGINT,
    old_status TEXT,
    new_status TEXT,
    changed_by TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    operation TEXT
);

-- Aplicar trigger de auditoría
DROP TRIGGER IF EXISTS audit_payment_status_changes ON "Estados de pago";
CREATE TRIGGER audit_payment_status_changes
    BEFORE UPDATE ON "Estados de pago"
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_payment_changes();

-- 6. VERIFICAR POLÍTICAS RLS PROBLEMÁTICAS
-- Mostrar todas las políticas RLS en la tabla
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'Estados de pago';

-- 7. CREAR FUNCIÓN DE SOLO LECTURA SEGURA
CREATE OR REPLACE FUNCTION public.get_payment_states_readonly(project_id_param BIGINT)
RETURNS TABLE (
    id BIGINT,
    "Name" TEXT,
    "Status" TEXT,
    "Total" BIGINT,
    "ExpiryDate" DATE,
    "Completion" BOOLEAN,
    "Mes" TEXT,
    "Año" SMALLINT
) AS $$
BEGIN
    -- Función de solo lectura sin efectos secundarios
    RETURN QUERY
    SELECT 
        ep.id,
        ep."Name",
        ep."Status",
        ep."Total",
        ep."ExpiryDate",
        ep."Completion",
        ep."Mes",
        ep."Año"
    FROM "Estados de pago" ep
    WHERE ep."Project" = project_id_param
    ORDER BY ep."ExpiryDate" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 8. VERIFICAR EXTENSIONES ACTIVAS
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net', 'http');

-- 9. VERIFICAR CONFIGURACIÓN DE REALTIME
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 10. LOGS DE DIAGNÓSTICO
RAISE NOTICE 'COMPREHENSIVE DEBUG COMPLETED - Function disabled, triggers checked, audit enabled';
