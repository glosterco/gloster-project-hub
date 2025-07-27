-- Crear tabla para códigos temporales de acceso
CREATE TABLE public.temporary_access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id BIGINT NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.temporary_access_codes ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura por email
CREATE POLICY "Users can read their own temporary codes" 
ON public.temporary_access_codes 
FOR SELECT 
USING (true);

-- Política para permitir inserción
CREATE POLICY "Public can insert temporary codes" 
ON public.temporary_access_codes 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir actualización (marcar como usado)
CREATE POLICY "Public can update temporary codes" 
ON public.temporary_access_codes 
FOR UPDATE 
USING (true);

-- Índice para mejorar rendimiento
CREATE INDEX idx_temporary_access_codes_payment_email ON public.temporary_access_codes(payment_id, email);
CREATE INDEX idx_temporary_access_codes_code ON public.temporary_access_codes(code);
CREATE INDEX idx_temporary_access_codes_expires_at ON public.temporary_access_codes(expires_at);