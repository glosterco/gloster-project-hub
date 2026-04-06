
-- Add unique constraint on evento_id for the ON CONFLICT to work
ALTER TABLE "LicitacionRondas" ADD CONSTRAINT licitacion_rondas_evento_id_unique UNIQUE (evento_id);

-- Drop the duplicate trigger that causes double inserts
DROP TRIGGER IF EXISTS trigger_auto_create_ronda ON "LicitacionEventos";
DROP FUNCTION IF EXISTS auto_create_ronda_from_evento();

-- Now insert the calendar events (sync_ronda_from_evento_trigger will auto-create rondas)
INSERT INTO "LicitacionEventos" (licitacion_id, fecha, titulo, descripcion, requiere_archivos, es_ronda_preguntas, estado)
VALUES
  (4, '2026-04-05T09:00:00-04:00', 'Ronda de Consultas 1', 'Primera ronda de preguntas de los oferentes', false, true, 'pendiente'),
  (4, '2026-04-10T18:00:00-04:00', 'Respuestas Ronda 1', 'Publicación de respuestas a la primera ronda', false, false, 'pendiente'),
  (4, '2026-04-15T10:00:00-04:00', 'Visita a Terreno', 'Visita al sitio del proyecto Galpón Pocuro', false, false, 'pendiente'),
  (4, '2026-04-20T09:00:00-04:00', 'Ronda de Consultas 2', 'Segunda ronda de preguntas de los oferentes', false, true, 'pendiente'),
  (4, '2026-04-30T18:00:00-04:00', 'Respuestas Ronda 2', 'Publicación de respuestas a la segunda ronda', false, false, 'pendiente'),
  (4, '2026-05-05T18:00:00-04:00', 'Envío de Ofertas', 'Fecha límite para el envío de ofertas', true, false, 'pendiente'),
  (4, '2026-05-10T18:00:00-04:00', 'Cierre del Proceso', 'Cierre formal del proceso de licitación', false, false, 'pendiente');
