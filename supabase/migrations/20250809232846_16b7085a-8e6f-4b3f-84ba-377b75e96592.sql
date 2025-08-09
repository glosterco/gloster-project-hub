-- Create contratista_users table similar to mandante_users
CREATE TABLE public.contratista_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contratista_id BIGINT NOT NULL,
  auth_user_id UUID NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contratista_id, auth_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.contratista_users ENABLE ROW LEVEL SECURITY;

-- Create policies for contratista_users
CREATE POLICY "Contratista users can view users" 
ON public.contratista_users 
FOR SELECT 
USING (
  contratista_id IN (
    SELECT id FROM public."Contratistas" 
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Contratista users can add users" 
ON public.contratista_users 
FOR INSERT 
WITH CHECK (
  contratista_id IN (
    SELECT id FROM public."Contratistas" 
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Contratista users can update users" 
ON public.contratista_users 
FOR UPDATE 
USING (
  contratista_id IN (
    SELECT id FROM public."Contratistas" 
    WHERE auth_user_id = auth.uid()
  )
) 
WITH CHECK (
  contratista_id IN (
    SELECT id FROM public."Contratistas" 
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Contratista users can remove users" 
ON public.contratista_users 
FOR DELETE 
USING (
  contratista_id IN (
    SELECT id FROM public."Contratistas" 
    WHERE auth_user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contratista_users_updated_at
BEFORE UPDATE ON public.contratista_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();