-- Enable RLS on Documentos table
ALTER TABLE public."Documentos" ENABLE ROW LEVEL SECURITY;

-- Policy for users to view documentos of accessible projects
CREATE POLICY "Users can view documentos of accessible projects"
ON public."Documentos"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Documentos"."Proyecto" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Documentos"."Proyecto" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Documentos"."Proyecto" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Documentos"."Proyecto" AND cu.auth_user_id = auth.uid()
  )
);

-- Policy for users to create documentos for accessible projects
CREATE POLICY "Users can create documentos for accessible projects"
ON public."Documentos"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Documentos"."Proyecto" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Documentos"."Proyecto" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Documentos"."Proyecto" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Documentos"."Proyecto" AND cu.auth_user_id = auth.uid()
  )
);

-- Policy for users to update documentos of accessible projects
CREATE POLICY "Users can update documentos of accessible projects"
ON public."Documentos"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Documentos"."Proyecto" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Documentos"."Proyecto" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Documentos"."Proyecto" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Documentos"."Proyecto" AND cu.auth_user_id = auth.uid()
  )
);

-- Policy for users to delete documentos of accessible projects
CREATE POLICY "Users can delete documentos of accessible projects"
ON public."Documentos"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Documentos"."Proyecto" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public."Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Documentos"."Proyecto" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Documentos"."Proyecto" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public."Proyectos" p
    JOIN public.contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Documentos"."Proyecto" AND cu.auth_user_id = auth.uid()
  )
);