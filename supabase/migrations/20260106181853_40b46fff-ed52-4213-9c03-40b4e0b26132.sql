-- Add public SELECT policy for contactos table (for ProjectAccess guests)
CREATE POLICY "Public can view contactos for accessible projects" 
ON public.contactos 
FOR SELECT 
USING (true);

-- Add public INSERT policy for contactos (guests can add specialists)
CREATE POLICY "Public can create contactos" 
ON public.contactos 
FOR INSERT 
WITH CHECK (true);

-- Add public SELECT policy for rfi_destinatarios
CREATE POLICY "Public can view rfi_destinatarios" 
ON public.rfi_destinatarios 
FOR SELECT 
USING (true);

-- Add public INSERT policy for rfi_destinatarios (for forwarding)
CREATE POLICY "Public can insert rfi_destinatarios" 
ON public.rfi_destinatarios 
FOR INSERT 
WITH CHECK (true);