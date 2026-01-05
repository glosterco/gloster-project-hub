-- =====================================================
-- TABLA: rfi_messages - Historial conversacional de RFIs
-- =====================================================

CREATE TABLE public.rfi_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfi_id INTEGER NOT NULL REFERENCES public."RFI"(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES public."Proyectos"(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  author_name TEXT,
  author_role TEXT NOT NULL CHECK (author_role IN ('contratista', 'mandante', 'aprobador', 'especialista')),
  message_text TEXT NOT NULL,
  attachments_url TEXT,  -- URL única: archivo directo O carpeta con múltiples archivos
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_rfi_messages_rfi_id ON public.rfi_messages(rfi_id);
CREATE INDEX idx_rfi_messages_project_id ON public.rfi_messages(project_id);
CREATE INDEX idx_rfi_messages_created_at ON public.rfi_messages(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.rfi_messages ENABLE ROW LEVEL SECURITY;

-- Política: permitir lectura pública (el acceso se controla via token en frontend/edge functions)
CREATE POLICY "Allow public read access to rfi_messages"
  ON public.rfi_messages
  FOR SELECT
  USING (true);

-- Política: permitir inserción pública (validación de permisos en edge functions)
CREATE POLICY "Allow public insert to rfi_messages"
  ON public.rfi_messages
  FOR INSERT
  WITH CHECK (true);

-- Comentarios de documentación
COMMENT ON TABLE public.rfi_messages IS 'Historial de mensajes/respuestas para cada RFI';
COMMENT ON COLUMN public.rfi_messages.attachments_url IS 'URL única: puede ser un archivo directo o una carpeta de Google Drive con múltiples archivos';