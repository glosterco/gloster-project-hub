-- Crear políticas RLS para la tabla Adicionales

-- Política para lectura: permitir a mandantes y contratistas ver adicionales de proyectos a los que tienen acceso
CREATE POLICY "Users can view adicionales of accessible projects" 
ON public."Adicionales" 
FOR SELECT 
USING (
  -- Verificar si el usuario es mandante del proyecto
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND m.auth_user_id = auth.uid()
  )
  OR
  -- Verificar si el usuario es contratista del proyecto
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND c.auth_user_id = auth.uid()
  )
  OR
  -- Verificar si el usuario tiene acceso a través de mandante_users
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND mu.auth_user_id = auth.uid()
  )
  OR
  -- Verificar si el usuario tiene acceso a través de contratista_users
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND cu.auth_user_id = auth.uid()
  )
);

-- Política para inserción: permitir a mandantes y contratistas crear adicionales en proyectos a los que tienen acceso
CREATE POLICY "Users can create adicionales for accessible projects" 
ON public."Adicionales" 
FOR INSERT 
WITH CHECK (
  -- Verificar si el usuario es mandante del proyecto
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND m.auth_user_id = auth.uid()
  )
  OR
  -- Verificar si el usuario es contratista del proyecto
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND c.auth_user_id = auth.uid()
  )
  OR
  -- Verificar si el usuario tiene acceso a través de mandante_users
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND mu.auth_user_id = auth.uid()
  )
  OR
  -- Verificar si el usuario tiene acceso a través de contratista_users
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND cu.auth_user_id = auth.uid()
  )
);

-- Política para actualización: permitir a mandantes y contratistas actualizar adicionales de proyectos a los que tienen acceso
CREATE POLICY "Users can update adicionales of accessible projects" 
ON public."Adicionales" 
FOR UPDATE 
USING (
  -- Verificar si el usuario es mandante del proyecto
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND m.auth_user_id = auth.uid()
  )
  OR
  -- Verificar si el usuario es contratista del proyecto
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND c.auth_user_id = auth.uid()
  )
  OR
  -- Verificar si el usuario tiene acceso a través de mandante_users
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND mu.auth_user_id = auth.uid()
  )
  OR
  -- Verificar si el usuario tiene acceso a través de contratista_users
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Adicionales"."Proyecto" 
    AND cu.auth_user_id = auth.uid()
  )
);