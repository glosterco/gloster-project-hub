-- Crear tabla para las carpetas de proyectos de mandantes
CREATE TABLE public.mandante_project_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mandante_id BIGINT NOT NULL,
  folder_name TEXT NOT NULL,
  project_ids BIGINT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mandante_project_folders ENABLE ROW LEVEL SECURITY;

-- Create policies for mandante access
CREATE POLICY "Mandantes can view their own folders" 
ON public.mandante_project_folders 
FOR SELECT 
USING (mandante_id IN (
  SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Mandantes can create their own folders" 
ON public.mandante_project_folders 
FOR INSERT 
WITH CHECK (mandante_id IN (
  SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Mandantes can update their own folders" 
ON public.mandante_project_folders 
FOR UPDATE 
USING (mandante_id IN (
  SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Mandantes can delete their own folders" 
ON public.mandante_project_folders 
FOR DELETE 
USING (mandante_id IN (
  SELECT id FROM public."Mandantes" WHERE auth_user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mandante_project_folders_updated_at
BEFORE UPDATE ON public.mandante_project_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();