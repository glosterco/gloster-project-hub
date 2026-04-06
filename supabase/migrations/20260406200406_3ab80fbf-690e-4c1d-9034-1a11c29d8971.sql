ALTER TABLE public."LicitacionPreguntas"
ADD COLUMN IF NOT EXISTS adjunto_url text,
ADD COLUMN IF NOT EXISTS adjunto_nombre text,
ADD COLUMN IF NOT EXISTS respuesta_adjunto_url text,
ADD COLUMN IF NOT EXISTS respuesta_adjunto_nombre text;