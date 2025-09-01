-- Create early_adopters table for storing interested users
CREATE TABLE public.early_adopters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.early_adopters ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public table)
CREATE POLICY "Anyone can insert into early_adopters" 
ON public.early_adopters 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow reading (for admin purposes)
CREATE POLICY "Anyone can view early_adopters" 
ON public.early_adopters 
FOR SELECT 
USING (true);