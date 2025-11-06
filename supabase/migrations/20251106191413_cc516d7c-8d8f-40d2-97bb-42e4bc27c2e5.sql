-- Habilitar RLS en la tabla Fotos
ALTER TABLE public."Fotos" ENABLE ROW LEVEL SECURITY;

-- Política para ver fotos de proyectos accesibles
CREATE POLICY "Users can view fotos of accessible projects"
ON public."Fotos"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Fotos"."Proyecto" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Fotos"."Proyecto" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Fotos"."Proyecto" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Fotos"."Proyecto" AND cu.auth_user_id = auth.uid()
  )
);

-- Política para crear fotos en proyectos accesibles
CREATE POLICY "Users can create fotos for accessible projects"
ON public."Fotos"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Fotos"."Proyecto" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Fotos"."Proyecto" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Fotos"."Proyecto" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Fotos"."Proyecto" AND cu.auth_user_id = auth.uid()
  )
);

-- Política para actualizar fotos de proyectos accesibles
CREATE POLICY "Users can update fotos of accessible projects"
ON public."Fotos"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Fotos"."Proyecto" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Fotos"."Proyecto" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Fotos"."Proyecto" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Fotos"."Proyecto" AND cu.auth_user_id = auth.uid()
  )
);

-- Política para eliminar fotos de proyectos accesibles
CREATE POLICY "Users can delete fotos of accessible projects"
ON public."Fotos"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Fotos"."Proyecto" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Fotos"."Proyecto" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Fotos"."Proyecto" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Fotos"."Proyecto" AND cu.auth_user_id = auth.uid()
  )
);