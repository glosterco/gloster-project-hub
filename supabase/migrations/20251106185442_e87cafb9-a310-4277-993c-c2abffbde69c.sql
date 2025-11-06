-- Agregar columnas necesarias a la tabla Fotos para guardar metadatos de Drive
ALTER TABLE public."Fotos" 
ADD COLUMN IF NOT EXISTS "DriveId" text,
ADD COLUMN IF NOT EXISTS "WebViewLink" text,
ADD COLUMN IF NOT EXISTS "Nombre" text,
ADD COLUMN IF NOT EXISTS "MimeType" text;