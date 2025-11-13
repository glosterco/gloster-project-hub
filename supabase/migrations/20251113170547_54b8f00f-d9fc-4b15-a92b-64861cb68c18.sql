-- Permitir eliminar registros duplicados en PresupuestoHistorico
CREATE POLICY "Users can delete historico of accessible projects"
ON "PresupuestoHistorico"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN "Mandantes" m ON m.id = p."Owner"
    WHERE p.id = "PresupuestoHistorico"."Project_ID"
    AND m.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN "Contratistas" c ON c.id = p."Contratista"
    WHERE p.id = "PresupuestoHistorico"."Project_ID"
    AND c.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN mandante_users mu ON mu.mandante_id = p."Owner"
    WHERE p.id = "PresupuestoHistorico"."Project_ID"
    AND mu.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN contratista_users cu ON cu.contratista_id = p."Contratista"
    WHERE p.id = "PresupuestoHistorico"."Project_ID"
    AND cu.auth_user_id = auth.uid()
  )
);