-- Add uploaded_by fields to Fotos table
ALTER TABLE public."Fotos" 
ADD COLUMN IF NOT EXISTS uploaded_by_email TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by_name TEXT;

-- Add uploaded_by and folder movement tracking fields to Documentos table
ALTER TABLE public."Documentos" 
ADD COLUMN IF NOT EXISTS uploaded_by_email TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by_name TEXT,
ADD COLUMN IF NOT EXISTS moved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS moved_by_email TEXT,
ADD COLUMN IF NOT EXISTS moved_by_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public."Fotos".uploaded_by_email IS 'Email of user who uploaded the photo';
COMMENT ON COLUMN public."Fotos".uploaded_by_name IS 'Name of user who uploaded the photo';
COMMENT ON COLUMN public."Documentos".uploaded_by_email IS 'Email of user who uploaded the document';
COMMENT ON COLUMN public."Documentos".uploaded_by_name IS 'Name of user who uploaded the document';
COMMENT ON COLUMN public."Documentos".moved_at IS 'Timestamp when document was moved to different folder';
COMMENT ON COLUMN public."Documentos".moved_by_email IS 'Email of user who moved the document';
COMMENT ON COLUMN public."Documentos".moved_by_name IS 'Name of user who moved the document';