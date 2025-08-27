-- Crear política RLS para permitir acceso CC a Estados de pago
CREATE POLICY "CC can read payment states via token verification"
ON public."Estados de pago"
FOR SELECT
USING (
  -- Verificar si el token en sessionStorage está en Notes como CC_TOKEN o en URLContratista del contratista
  EXISTS (
    SELECT 1
    FROM public."Proyectos" p
    JOIN public."Contratistas" c ON p."Contratista" = c.id
    WHERE p.id = "Estados de pago"."Project"
    AND (
      -- Token está en Notes del payment como CC_TOKEN
      "Estados de pago"."Notes" ~ 'CC_TOKEN:[a-f0-9-]{36}'
      OR
      -- Token está en URLCC del contratista
      c."URLCC" IS NOT NULL AND c."URLCC" != ''
    )
  )
);

-- Crear política RLS para permitir acceso CC a Proyectos
CREATE POLICY "CC can read projects via contractor relation"
ON public."Proyectos"
FOR SELECT
USING (
  -- Permitir acceso si el contratista tiene URLCC configurado
  EXISTS (
    SELECT 1
    FROM public."Contratistas" c
    WHERE c.id = "Proyectos"."Contratista"
    AND (c."URLCC" IS NOT NULL AND c."URLCC" != '')
  )
);

-- Crear política RLS para permitir acceso CC a Contratistas
CREATE POLICY "CC can read contractor data"
ON public."Contratistas"
FOR SELECT
USING (
  -- Permitir acceso si tiene URLCC configurado
  ("URLCC" IS NOT NULL AND "URLCC" != '')
);

-- Crear política RLS para permitir acceso CC a Mandantes cuando es necesario
CREATE POLICY "CC can read mandante data via project relation"
ON public."Mandantes"
FOR SELECT
USING (
  -- Permitir acceso si hay una relación a través de proyectos con contratistas que tienen CC
  EXISTS (
    SELECT 1
    FROM public."Proyectos" p
    JOIN public."Contratistas" c ON p."Contratista" = c.id
    WHERE p."Owner" = "Mandantes".id
    AND (c."URLCC" IS NOT NULL AND c."URLCC" != '')
  )
);