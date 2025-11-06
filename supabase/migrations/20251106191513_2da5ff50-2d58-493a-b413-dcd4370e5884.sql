-- Agregar políticas RLS para la tabla Reuniones
ALTER TABLE public."Reuniones" ENABLE ROW LEVEL SECURITY;

-- Permitir acceso temporal público para no romper funcionalidad existente
-- Estas políticas deberían ajustarse según los requisitos reales del negocio
CREATE POLICY "Open reuniones access"
ON public."Reuniones"
FOR SELECT
USING (true);

CREATE POLICY "Open reuniones creation"
ON public."Reuniones"
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Open reuniones updates"
ON public."Reuniones"
FOR UPDATE
USING (true);

CREATE POLICY "Open reuniones deletion"
ON public."Reuniones"
FOR DELETE
USING (true);