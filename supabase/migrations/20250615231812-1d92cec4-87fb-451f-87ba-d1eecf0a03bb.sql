
-- Insertar un contratista de prueba con números de teléfono más pequeños
INSERT INTO "Contratistas" (
  "CompanyName",
  "RUT", 
  "Specialization",
  "Experience",
  "Adress",
  "City",
  "ContactName",
  "ContactEmail",
  "ContactPhone",
  "Username",
  "Password",
  "Status"
) VALUES (
  'Constructora Demo S.A.',
  '12.345.678-9',
  'Construcción General', 
  '5-10 años',
  'Av. Providencia 1234',
  'Santiago',
  'Juan Pérez',
  'juan.perez@constructorademo.cl',
  12345,
  'juan.perez@constructorademo.cl',
  'password123',
  true
);

-- Insertar un mandante de prueba con números de teléfono más pequeños
INSERT INTO "Mandantes" (
  "CompanyName",
  "ContactName", 
  "ContactEmail",
  "ContactPhone",
  "Status"
) VALUES (
  'Inmobiliaria Test Ltda.',
  'María González',
  'maria.gonzalez@inmobiliariatest.cl',
  23456,
  true
);
