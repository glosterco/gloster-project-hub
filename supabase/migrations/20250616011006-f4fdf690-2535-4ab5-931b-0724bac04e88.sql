
-- Agregar columna para vincular contratistas con usuarios de auth (si no existe)
ALTER TABLE "Contratistas" 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear función corregida para registrar usuarios basados en contratistas existentes
CREATE OR REPLACE FUNCTION create_auth_users_from_contratistas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contratista_record RECORD;
    new_user_id UUID;
BEGIN
    -- Iterar sobre todos los contratistas que no tienen auth_user_id
    FOR contratista_record IN 
        SELECT id, "ContactEmail", "Password" 
        FROM "Contratistas" 
        WHERE auth_user_id IS NULL AND "ContactEmail" IS NOT NULL AND "Password" IS NOT NULL
    LOOP
        -- Crear usuario en auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            contratista_record."ContactEmail",
            crypt(contratista_record."Password", gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO new_user_id;

        -- Actualizar el contratista con el auth_user_id
        UPDATE "Contratistas" 
        SET auth_user_id = new_user_id 
        WHERE id = contratista_record.id;
        
        -- Crear entrada en auth.identities (sin el campo email generado)
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            new_user_id,
            json_build_object('sub', new_user_id::text, 'email', contratista_record."ContactEmail"),
            'email',
            contratista_record."ContactEmail",
            NOW(),
            NOW()
        );
        
    END LOOP;
END;
$$;

-- Ejecutar la función para crear los usuarios
SELECT create_auth_users_from_contratistas();

-- Eliminar la función temporal
DROP FUNCTION create_auth_users_from_contratistas();
