-- Añadir campos de autenticación a la tabla Mandantes
ALTER TABLE public."Mandantes" 
ADD COLUMN "Username" text,
ADD COLUMN "Password" text,
ADD COLUMN "auth_user_id" uuid;

-- Crear tabla para gestionar roles de usuario (contratista, mandante, o ambos)
CREATE TABLE public."user_roles" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  auth_user_id uuid NOT NULL,
  role_type text NOT NULL CHECK (role_type IN ('contratista', 'mandante')),
  entity_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(auth_user_id, role_type, entity_id)
);

-- Habilitar RLS en user_roles
ALTER TABLE public."user_roles" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_roles
CREATE POLICY "Users can read their own roles" 
ON public."user_roles" 
FOR SELECT 
USING (auth_user_id = auth.uid());

CREATE POLICY "Public can insert user roles for registration" 
ON public."user_roles" 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own roles" 
ON public."user_roles" 
FOR UPDATE 
USING (auth_user_id = auth.uid());

-- Actualizar políticas RLS para Mandantes para incluir autenticación
CREATE POLICY "Authenticated users can update their mandantes" 
ON public."Mandantes" 
FOR UPDATE 
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());