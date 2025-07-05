
-- Verificar si hay triggers en la tabla Estados de pago
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'Estados de pago';

-- Verificar si hay jobs de cron configurados que ejecuten la función
SELECT 
    jobname,
    schedule,
    command
FROM cron.job
WHERE command LIKE '%update_payment_states_weekly%';

-- Verificar la definición actual de la función para asegurar que no tenga lógica oculta
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'update_payment_states_weekly';

-- Verificar si hay alguna política RLS que pueda estar modificando datos
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'Estados de pago';
