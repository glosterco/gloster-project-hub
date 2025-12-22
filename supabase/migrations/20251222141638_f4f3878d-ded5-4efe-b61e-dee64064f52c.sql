-- Insertar contactos de prueba (si no existen) para el proyecto 94
-- Proyecto actual: Carpinteria Metalica Pocuro (id=94)

INSERT INTO public.contactos (proyecto_id, nombre, email, rol, especialidad, telefono)
SELECT 94, 'Calculista (Pocuro)', 'calculista.pocuro369@demo.cl', 'calculista', 'Estructuras', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.contactos
  WHERE proyecto_id = 94 AND email = 'calculista.pocuro369@demo.cl'
);

INSERT INTO public.contactos (proyecto_id, nombre, email, rol, especialidad, telefono)
SELECT 94, 'Arquitecto (Pocuro)', 'arquitecto.pocuro369@demo.cl', 'arquitecto', 'Arquitectura', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.contactos
  WHERE proyecto_id = 94 AND email = 'arquitecto.pocuro369@demo.cl'
);

INSERT INTO public.contactos (proyecto_id, nombre, email, rol, especialidad, telefono)
SELECT 94, 'Sanitario (Pocuro)', 'sanitario.pocuro369@demo.cl', 'sanitario', 'Sanitaria', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.contactos
  WHERE proyecto_id = 94 AND email = 'sanitario.pocuro369@demo.cl'
);
