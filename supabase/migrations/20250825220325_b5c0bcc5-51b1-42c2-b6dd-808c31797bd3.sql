-- SOLUCIÓN 1: Permitir inserción desde el frontend para usuarios autenticados
-- Eliminar las políticas restrictivas actuales de user_roles
DROP POLICY IF EXISTS "Only service role can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only service role can insert user_roles" ON public.user_roles; 
DROP POLICY IF EXISTS "Only service role can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only service role can delete user_roles" ON public.user_roles;

-- Crear nuevas políticas que permitan que los usuarios autenticados gestionen sus propios roles
CREATE POLICY "Users can read their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = auth_user_id);

CREATE POLICY "Authenticated users can insert their own roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Service role can manage all user_roles" 
ON public.user_roles 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');