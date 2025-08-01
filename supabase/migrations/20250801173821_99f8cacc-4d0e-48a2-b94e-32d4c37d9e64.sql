-- Modificar la tabla Mandantes para permitir múltiples usuarios
-- Hacer auth_user_id nullable ya que ahora usaremos user_roles para la relación
ALTER TABLE public."Mandantes" 
ALTER COLUMN auth_user_id DROP NOT NULL;

-- Crear tabla para gestionar permisos específicos de usuarios mandante (opcional)
CREATE TABLE IF NOT EXISTS public.mandante_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mandante_id BIGINT NOT NULL REFERENCES public."Mandantes"(id),
  auth_user_id UUID NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mandante_id, auth_user_id)
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.mandante_users ENABLE ROW LEVEL SECURITY;

-- Crear función de seguridad para obtener mandantes del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_mandante_ids(user_id UUID)
RETURNS BIGINT[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT ARRAY_AGG(entity_id)
  FROM public.user_roles 
  WHERE auth_user_id = user_id AND role_type = 'mandante';
$$;

-- Actualizar políticas RLS de Mandantes para usar la nueva lógica
DROP POLICY IF EXISTS "Authenticated users can update their mandantes" ON public."Mandantes";
DROP POLICY IF EXISTS "Public can read mandantes for email verification" ON public."Mandantes";

-- Nueva política para lectura de mandantes
CREATE POLICY "Users can read their mandantes" 
ON public."Mandantes" 
FOR SELECT 
TO authenticated
USING (
  id = ANY(public.get_user_mandante_ids(auth.uid()))
  OR TRUE -- Mantener acceso público para verificación de emails
);

-- Nueva política para actualización de mandantes
CREATE POLICY "Users can update their mandantes" 
ON public."Mandantes" 
FOR UPDATE 
TO authenticated
USING (id = ANY(public.get_user_mandante_ids(auth.uid())))
WITH CHECK (id = ANY(public.get_user_mandante_ids(auth.uid())));

-- Políticas para la nueva tabla mandante_users
CREATE POLICY "Mandante admins can view users" 
ON public.mandante_users 
FOR SELECT 
TO authenticated
USING (
  mandante_id = ANY(public.get_user_mandante_ids(auth.uid()))
);

CREATE POLICY "Mandante admins can add users" 
ON public.mandante_users 
FOR INSERT 
TO authenticated
WITH CHECK (
  mandante_id = ANY(public.get_user_mandante_ids(auth.uid()))
);

CREATE POLICY "Mandante admins can update users" 
ON public.mandante_users 
FOR UPDATE 
TO authenticated
USING (
  mandante_id = ANY(public.get_user_mandante_ids(auth.uid()))
)
WITH CHECK (
  mandante_id = ANY(public.get_user_mandante_ids(auth.uid()))
);

CREATE POLICY "Mandante admins can remove users" 
ON public.mandante_users 
FOR DELETE 
TO authenticated
USING (
  mandante_id = ANY(public.get_user_mandante_ids(auth.uid()))
);

-- Actualizar política de mandante_project_folders para usar la nueva lógica
DROP POLICY IF EXISTS "Mandantes can view their own folders" ON public.mandante_project_folders;
DROP POLICY IF EXISTS "Mandantes can create their own folders" ON public.mandante_project_folders;
DROP POLICY IF EXISTS "Mandantes can update their own folders" ON public.mandante_project_folders;
DROP POLICY IF EXISTS "Mandantes can delete their own folders" ON public.mandante_project_folders;

CREATE POLICY "Mandante users can view folders" 
ON public.mandante_project_folders 
FOR SELECT 
TO authenticated
USING (mandante_id = ANY(public.get_user_mandante_ids(auth.uid())));

CREATE POLICY "Mandante users can create folders" 
ON public.mandante_project_folders 
FOR INSERT 
TO authenticated
WITH CHECK (mandante_id = ANY(public.get_user_mandante_ids(auth.uid())));

CREATE POLICY "Mandante users can update folders" 
ON public.mandante_project_folders 
FOR UPDATE 
TO authenticated
USING (mandante_id = ANY(public.get_user_mandante_ids(auth.uid())))
WITH CHECK (mandante_id = ANY(public.get_user_mandante_ids(auth.uid())));

CREATE POLICY "Mandante users can delete folders" 
ON public.mandante_project_folders 
FOR DELETE 
TO authenticated
USING (mandante_id = ANY(public.get_user_mandante_ids(auth.uid())));

-- Crear trigger para actualizar updated_at en mandante_users
CREATE TRIGGER update_mandante_users_updated_at
  BEFORE UPDATE ON public.mandante_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();