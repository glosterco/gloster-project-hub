-- Add metadata columns to Documentos table
ALTER TABLE public."Documentos" 
ADD COLUMN IF NOT EXISTS "Size" bigint,
ADD COLUMN IF NOT EXISTS "Extension" text,
ADD COLUMN IF NOT EXISTS "MimeType" text,
ADD COLUMN IF NOT EXISTS "DriveId" text,
ADD COLUMN IF NOT EXISTS "WebViewLink" text;