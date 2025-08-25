-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

-- Rename password_hash column to password
ALTER TABLE public.user_roles 
RENAME COLUMN password_hash TO password;

-- Create new restrictive RLS policies - only service_role (admin) can access
CREATE POLICY "Only service role can read user_roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can insert user_roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update user_roles" 
ON public.user_roles 
FOR UPDATE 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can delete user_roles" 
ON public.user_roles 
FOR DELETE 
USING (auth.role() = 'service_role');