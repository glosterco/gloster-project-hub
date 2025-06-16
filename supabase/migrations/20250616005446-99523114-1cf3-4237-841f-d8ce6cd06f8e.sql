
-- Primero verificar qué datos ya existen y limpiar si es necesario
DELETE FROM "Estados de pago" WHERE "Project" IN (SELECT id FROM "Proyectos");
DELETE FROM "Proyectos";
DELETE FROM "Contratistas";
DELETE FROM "Mandantes";

-- Insertar contratistas
INSERT INTO "Contratistas" (
  "CompanyName", "RUT", "Specialization", "Experience", "Adress", "City",
  "ContactName", "ContactEmail", "ContactPhone", "Username", "Password", "Status"
) VALUES 
(
  'Constructora Demo S.A.', '12.345.678-9', 'Construcción General', '5-10 años',
  'Av. Providencia 1234', 'Santiago', 'Juan Pérez', 'juan.perez@constructorademo.cl',
  12345, 'juan.perez@constructorademo.cl', 'password123', true
),
(
  'Edificaciones Norte Ltda.', '98.765.432-1', 'Estructura y Hormigón', '10+ años',
  'Av. Las Condes 567', 'Santiago', 'Carlos López', 'carlos.lopez@edificacionesnorte.cl',
  23456, 'carlos.lopez@edificacionesnorte.cl', 'secure456', true
),
(
  'Instalaciones Técnicas SpA', '11.222.333-4', 'Instalaciones Eléctricas', '3-5 años',
  'Calle Principal 890', 'Valparaíso', 'Ana Martínez', 'ana.martinez@instecnicas.cl',
  34567, 'ana.martinez@instecnicas.cl', 'tech789', true
);

-- Insertar mandantes
INSERT INTO "Mandantes" (
  "CompanyName", "ContactName", "ContactEmail", "ContactPhone", "Status"
) VALUES 
(
  'Inmobiliaria Test Ltda.', 'María González', 'maria.gonzalez@inmobiliariatest.cl', 11111, true
),
(
  'Desarrollos Urbanos SA', 'Roberto Silva', 'roberto.silva@desarrollosurbanos.cl', 22222, true
),
(
  'Inversiones Costanera', 'Patricia Rojas', 'patricia.rojas@inversionescostanera.cl', 33333, true
);

-- Insertar proyectos usando los IDs correctos de las tablas referenciadas
INSERT INTO "Proyectos" (
  "Name", "Description", "Location", "Budget", "StartDate", "Duration",
  "FirstPayment", "ExpiryRate", "Requierment", "Status", "Contratista", "Owner"
) VALUES 
(
  'Edificio Residencial Las Torres',
  'Construcción de edificio residencial de 15 pisos con 120 departamentos',
  'Las Condes, Santiago',
  85000000,
  '2024-01-15',
  18,
  '2024-02-01',
  30,
  ARRAY['Planos aprobados', 'Permiso de construcción', 'Estudio de suelos'],
  true,
  (SELECT id FROM "Contratistas" WHERE "CompanyName" = 'Constructora Demo S.A.'),
  (SELECT id FROM "Mandantes" WHERE "CompanyName" = 'Inmobiliaria Test Ltda.')
),
(
  'Centro Comercial Plaza Norte',
  'Construcción de centro comercial de 3 niveles con 80 locales comerciales',
  'Maipú, Santiago',
  120000000,
  '2024-03-01',
  24,
  '2024-03-15',
  30,
  ARRAY['Permiso municipal', 'Estudio de impacto ambiental', 'Factibilidad eléctrica'],
  true,
  (SELECT id FROM "Contratistas" WHERE "CompanyName" = 'Edificaciones Norte Ltda.'),
  (SELECT id FROM "Mandantes" WHERE "CompanyName" = 'Desarrollos Urbanos SA')
),
(
  'Complejo Habitacional Vista Mar',
  'Desarrollo habitacional de 200 casas con áreas verdes y equipamiento',
  'Viña del Mar',
  250000000,
  '2024-02-15',
  36,
  '2024-03-01',
  45,
  ARRAY['Subdivisión aprobada', 'Factibilidad sanitaria', 'Plan maestro'],
  true,
  (SELECT id FROM "Contratistas" WHERE "CompanyName" = 'Instalaciones Técnicas SpA'),
  (SELECT id FROM "Mandantes" WHERE "CompanyName" = 'Inversiones Costanera')
);

-- Insertar estados de pago usando los IDs correctos de los proyectos
INSERT INTO "Estados de pago" (
  "Name", "Project", "ExpiryDate", "Status", "Completion", "Mes", "Año", "Total"
) VALUES 
-- Estados para Proyecto 1 (Edificio Las Torres)
('Estado de Pago 1 - Excavación', (SELECT id FROM "Proyectos" WHERE "Name" = 'Edificio Residencial Las Torres'), '2024-02-28', 'Aprobado', true, 'Febrero', 2024, 4722222),
('Estado de Pago 2 - Fundaciones', (SELECT id FROM "Proyectos" WHERE "Name" = 'Edificio Residencial Las Torres'), '2024-03-30', 'Aprobado', true, 'Marzo', 2024, 4722222),
('Estado de Pago 3 - Estructura Nivel 1-3', (SELECT id FROM "Proyectos" WHERE "Name" = 'Edificio Residencial Las Torres'), '2024-04-30', 'Aprobado', true, 'Abril', 2024, 4722222),
('Estado de Pago 4 - Estructura Nivel 4-6', (SELECT id FROM "Proyectos" WHERE "Name" = 'Edificio Residencial Las Torres'), '2024-05-30', 'Pendiente', false, 'Mayo', 2024, 4722222),
('Estado de Pago 5 - Estructura Nivel 7-9', (SELECT id FROM "Proyectos" WHERE "Name" = 'Edificio Residencial Las Torres'), '2024-06-30', 'Programado', false, 'Junio', 2024, 4722222),

-- Estados para Proyecto 2 (Centro Comercial)
('Estado de Pago 1 - Movimiento de Tierras', (SELECT id FROM "Proyectos" WHERE "Name" = 'Centro Comercial Plaza Norte'), '2024-03-31', 'Aprobado', true, 'Marzo', 2024, 5000000),
('Estado de Pago 2 - Fundaciones y Radier', (SELECT id FROM "Proyectos" WHERE "Name" = 'Centro Comercial Plaza Norte'), '2024-04-30', 'Aprobado', true, 'Abril', 2024, 5000000),
('Estado de Pago 3 - Estructura Primer Nivel', (SELECT id FROM "Proyectos" WHERE "Name" = 'Centro Comercial Plaza Norte'), '2024-05-31', 'Pendiente', false, 'Mayo', 2024, 5000000),

-- Estados para Proyecto 3 (Vista Mar)
('Estado de Pago 1 - Urbanización Etapa 1', (SELECT id FROM "Proyectos" WHERE "Name" = 'Complejo Habitacional Vista Mar'), '2024-03-15', 'Aprobado', true, 'Marzo', 2024, 6944444),
('Estado de Pago 2 - Construcción Casas 1-50', (SELECT id FROM "Proyectos" WHERE "Name" = 'Complejo Habitacional Vista Mar'), '2024-05-15', 'Aprobado', true, 'Mayo', 2024, 6944444),
('Estado de Pago 3 - Construcción Casas 51-100', (SELECT id FROM "Proyectos" WHERE "Name" = 'Complejo Habitacional Vista Mar'), '2024-07-15', 'Pendiente', false, 'Julio', 2024, 6944444);
