-- Add nombre_empresa to LicitacionOferentes for mandante to label each oferente
ALTER TABLE "LicitacionOferentes" ADD COLUMN IF NOT EXISTS nombre_empresa text;

-- Add itemizado_enviado flag to track when oferente shares their itemizado
ALTER TABLE "LicitacionOferentes" ADD COLUMN IF NOT EXISTS itemizado_enviado boolean NOT NULL DEFAULT false;
ALTER TABLE "LicitacionOferentes" ADD COLUMN IF NOT EXISTS itemizado_enviado_at timestamp with time zone;