-- Create table for tracking complete action history on Adicionales
CREATE TABLE public.adicional_actions_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adicional_id INTEGER NOT NULL REFERENCES public."Adicionales"(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('enviado', 'pausado', 'reanudado', 'aprobado', 'rechazado')),
  action_by_email TEXT,
  action_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.adicional_actions_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (needed for email-verified users)
CREATE POLICY "Anyone can view adicional action history" 
ON public.adicional_actions_history 
FOR SELECT 
USING (true);

-- Create policy for insert (service role or authenticated users)
CREATE POLICY "Authenticated users can insert action history" 
ON public.adicional_actions_history 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries by adicional
CREATE INDEX idx_adicional_actions_history_adicional_id ON public.adicional_actions_history(adicional_id);
CREATE INDEX idx_adicional_actions_history_created_at ON public.adicional_actions_history(created_at DESC);