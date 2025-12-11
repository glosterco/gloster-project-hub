-- Create RFI table similar to Adicionales
CREATE TABLE public."RFI" (
  id SERIAL PRIMARY KEY,
  "Proyecto" INTEGER REFERENCES public."Proyectos"(id),
  "Titulo" TEXT,
  "Descripcion" TEXT,
  "Status" TEXT DEFAULT 'Pendiente',
  "Respuesta" TEXT,
  "Fecha_Respuesta" TIMESTAMP WITH TIME ZONE,
  "URL" TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public."RFI" ENABLE ROW LEVEL SECURITY;

-- Create policies for RFI table
CREATE POLICY "Users can view RFI for their projects" 
ON public."RFI" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    WHERE p.id = "Proyecto"
    AND public.is_project_related(p.id, auth.uid())
  )
);

CREATE POLICY "Users can insert RFI for their projects" 
ON public."RFI" 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    WHERE p.id = "Proyecto"
    AND public.is_project_related(p.id, auth.uid())
  )
);

CREATE POLICY "Users can update RFI for their projects" 
ON public."RFI" 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public."Proyectos" p
    WHERE p.id = "Proyecto"
    AND public.is_project_related(p.id, auth.uid())
  )
);

-- Allow public read for email-based access
CREATE POLICY "Public can view RFI" 
ON public."RFI" 
FOR SELECT 
USING (true);