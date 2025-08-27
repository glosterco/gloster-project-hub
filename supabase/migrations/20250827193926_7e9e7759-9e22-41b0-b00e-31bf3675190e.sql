-- Eliminar las políticas problemáticas que causan recursión infinita
DROP POLICY IF EXISTS "CC can read projects via contractor relation" ON public."Proyectos";
DROP POLICY IF EXISTS "CC can read mandante data via project relation" ON public."Mandantes";
DROP POLICY IF EXISTS "CC can read contractor data" ON public."Contratistas";
DROP POLICY IF EXISTS "CC can read payment states via token verification" ON public."Estados de pago";

-- Crear políticas CC más simples sin recursión
CREATE POLICY "CC can read contractor data" 
ON public."Contratistas" 
FOR SELECT 
USING (("URLCC" IS NOT NULL) AND ("URLCC" <> ''::text));

CREATE POLICY "CC can read projects via contractor relation" 
ON public."Proyectos" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public."Contratistas" c 
    WHERE c.id = "Proyectos"."Contratista" 
    AND ((c."URLCC" IS NOT NULL) AND (c."URLCC" <> ''::text))
  )
);

CREATE POLICY "CC can read mandante data via project relation" 
ON public."Mandantes" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p 
    JOIN public."Contratistas" c ON p."Contratista" = c.id 
    WHERE p."Owner" = "Mandantes".id 
    AND ((c."URLCC" IS NOT NULL) AND (c."URLCC" <> ''::text))
  )
);

CREATE POLICY "CC can read payment states via token verification" 
ON public."Estados de pago" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p 
    JOIN public."Contratistas" c ON p."Contratista" = c.id 
    WHERE p.id = "Estados de pago"."Project" 
    AND (
      "Estados de pago"."Notes" ~ 'CC_TOKEN:[a-f0-9-]{36}' 
      OR 
      ((c."URLCC" IS NOT NULL) AND (c."URLCC" <> ''::text))
    )
  )
);