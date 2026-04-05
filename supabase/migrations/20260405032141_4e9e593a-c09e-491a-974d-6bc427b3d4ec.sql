ALTER TABLE public."Licitaciones"
ADD COLUMN IF NOT EXISTS drive_folder_id text,
ADD COLUMN IF NOT EXISTS drive_folder_url text,
ADD COLUMN IF NOT EXISTS drive_docs_folder_id text,
ADD COLUMN IF NOT EXISTS drive_docs_folder_url text;