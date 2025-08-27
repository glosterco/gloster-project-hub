-- Eliminar TODAS las políticas problemáticas
DROP POLICY IF EXISTS "CC can read projects via contractor relation" ON public."Proyectos";
DROP POLICY IF EXISTS "CC can read mandante data via project relation" ON public."Mandantes";
DROP POLICY IF EXISTS "CC can read contractor data" ON public."Contratistas";
DROP POLICY IF EXISTS "CC can read payment states via token verification" ON public."Estados de pago";

-- Crear funciones SECURITY DEFINER para evitar recursión
CREATE OR REPLACE FUNCTION public.is_cc_contractor(_contractor_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Contratistas" 
    WHERE id = _contractor_id 
    AND "URLCC" IS NOT NULL 
    AND "URLCC" <> ''
  );
$$;

CREATE OR REPLACE FUNCTION public.has_cc_access_to_project(_project_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN "Contratistas" c ON p."Contratista" = c.id
    WHERE p.id = _project_id
    AND c."URLCC" IS NOT NULL 
    AND c."URLCC" <> ''
  );
$$;

CREATE OR REPLACE FUNCTION public.has_cc_access_to_mandante(_mandante_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Proyectos" p
    JOIN "Contratistas" c ON p."Contratista" = c.id
    WHERE p."Owner" = _mandante_id
    AND c."URLCC" IS NOT NULL 
    AND c."URLCC" <> ''
  );
$$;

-- Crear políticas simples usando las funciones
CREATE POLICY "CC can read contractor data" 
ON public."Contratistas" 
FOR SELECT 
USING (is_cc_contractor(id));

CREATE POLICY "CC can read projects via contractor relation" 
ON public."Proyectos" 
FOR SELECT 
USING (has_cc_access_to_project(id));

CREATE POLICY "CC can read mandante data via project relation" 
ON public."Mandantes" 
FOR SELECT 
USING (has_cc_access_to_mandante(id));

CREATE POLICY "CC can read payment states via token verification" 
ON public."Estados de pago" 
FOR SELECT 
USING (
  has_cc_access_to_project("Project") 
  OR "Notes" ~ 'CC_TOKEN:[a-f0-9-]{36}'
);