-- Enable RLS on Presupuesto table
ALTER TABLE "Presupuesto" ENABLE ROW LEVEL SECURITY;

-- Allow users to view presupuesto items for projects they have access to
CREATE POLICY "Users can view presupuesto of accessible projects"
ON "Presupuesto"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN "Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Presupuesto"."Project_ID" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN "Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Presupuesto"."Project_ID" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Presupuesto"."Project_ID" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Presupuesto"."Project_ID" AND cu.auth_user_id = auth.uid()
  )
);

-- Allow users to create presupuesto items for projects they have access to
CREATE POLICY "Users can create presupuesto for accessible projects"
ON "Presupuesto"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN "Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Presupuesto"."Project_ID" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN "Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Presupuesto"."Project_ID" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Presupuesto"."Project_ID" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Presupuesto"."Project_ID" AND cu.auth_user_id = auth.uid()
  )
);

-- Allow users to update presupuesto items for projects they have access to
CREATE POLICY "Users can update presupuesto of accessible projects"
ON "Presupuesto"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN "Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "Presupuesto"."Project_ID" AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN "Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "Presupuesto"."Project_ID" AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "Presupuesto"."Project_ID" AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "Presupuesto"."Project_ID" AND cu.auth_user_id = auth.uid()
  )
);