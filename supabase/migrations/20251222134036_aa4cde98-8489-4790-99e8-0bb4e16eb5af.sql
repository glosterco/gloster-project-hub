-- Create urgencia enum type
CREATE TYPE public.rfi_urgencia AS ENUM ('no_urgente', 'urgente', 'muy_urgente');

-- Add new columns to RFI table
ALTER TABLE public."RFI" 
ADD COLUMN IF NOT EXISTS "Urgencia" text DEFAULT 'no_urgente',
ADD COLUMN IF NOT EXISTS "Fecha_Vencimiento" date;

-- Create contactos table for project specialists
CREATE TABLE public.contactos (
  id SERIAL PRIMARY KEY,
  proyecto_id INTEGER REFERENCES public."Proyectos"(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  rol TEXT NOT NULL,
  especialidad TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on contactos
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;

-- RLS policies for contactos - allow access for project-related users
CREATE POLICY "Users can view contactos of accessible projects"
ON public.contactos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Proyectos" p
    WHERE p.id = contactos.proyecto_id 
    AND is_project_related(p.id, auth.uid())
  )
);

CREATE POLICY "Users can create contactos for accessible projects"
ON public.contactos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Proyectos" p
    WHERE p.id = contactos.proyecto_id 
    AND is_project_related(p.id, auth.uid())
  )
);

CREATE POLICY "Users can update contactos of accessible projects"
ON public.contactos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Proyectos" p
    WHERE p.id = contactos.proyecto_id 
    AND is_project_related(p.id, auth.uid())
  )
);

CREATE POLICY "Users can delete contactos of accessible projects"
ON public.contactos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "Proyectos" p
    WHERE p.id = contactos.proyecto_id 
    AND is_project_related(p.id, auth.uid())
  )
);

-- Create rfi_destinatarios table for forwarded RFIs
CREATE TABLE public.rfi_destinatarios (
  id SERIAL PRIMARY KEY,
  rfi_id INTEGER REFERENCES public."RFI"(id) ON DELETE CASCADE NOT NULL,
  contacto_id INTEGER REFERENCES public.contactos(id) ON DELETE CASCADE NOT NULL,
  enviado_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  respondido BOOLEAN DEFAULT false,
  UNIQUE(rfi_id, contacto_id)
);

-- Enable RLS on rfi_destinatarios
ALTER TABLE public.rfi_destinatarios ENABLE ROW LEVEL SECURITY;

-- RLS policies for rfi_destinatarios
CREATE POLICY "Users can view rfi_destinatarios of accessible RFIs"
ON public.rfi_destinatarios FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "RFI" r
    JOIN "Proyectos" p ON p.id = r."Proyecto"
    WHERE r.id = rfi_destinatarios.rfi_id 
    AND is_project_related(p.id, auth.uid())
  )
);

CREATE POLICY "Users can create rfi_destinatarios for accessible RFIs"
ON public.rfi_destinatarios FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "RFI" r
    JOIN "Proyectos" p ON p.id = r."Proyecto"
    WHERE r.id = rfi_destinatarios.rfi_id 
    AND is_project_related(p.id, auth.uid())
  )
);

CREATE POLICY "Users can update rfi_destinatarios of accessible RFIs"
ON public.rfi_destinatarios FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "RFI" r
    JOIN "Proyectos" p ON p.id = r."Proyecto"
    WHERE r.id = rfi_destinatarios.rfi_id 
    AND is_project_related(p.id, auth.uid())
  )
);