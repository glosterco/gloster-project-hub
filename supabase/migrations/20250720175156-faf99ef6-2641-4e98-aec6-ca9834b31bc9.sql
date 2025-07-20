-- Final cleanup: Remove any legacy data and ensure pristine schema
-- This migration completely removes any legacy test data that might be causing schema conflicts

-- Clean up legacy test data that may have been inserted with old schema
DELETE FROM "Estados de pago" WHERE "Project" IN (
    SELECT id FROM "Proyectos" WHERE "Contratista" IN (
        SELECT id FROM "Contratistas" WHERE "CompanyName" IN (
            'Constructora Demo S.A.', 
            'Edificaciones Norte Ltda.', 
            'Instalaciones Técnicas SpA'
        )
    )
);

DELETE FROM "Proyectos" WHERE "Contratista" IN (
    SELECT id FROM "Contratistas" WHERE "CompanyName" IN (
        'Constructora Demo S.A.', 
        'Edificaciones Norte Ltda.', 
        'Instalaciones Técnicas SpA'
    )
);

DELETE FROM "Contratistas" WHERE "CompanyName" IN (
    'Constructora Demo S.A.', 
    'Edificaciones Norte Ltda.', 
    'Instalaciones Técnicas SpA'
);

DELETE FROM "Mandantes" WHERE "CompanyName" IN (
    'Inmobiliaria Test Ltda.', 
    'Desarrollos Urbanos SA', 
    'Inversiones Costanera'
);

-- Ensure schema is completely clean - remove columns one more time
ALTER TABLE "Contratistas" DROP COLUMN IF EXISTS "Adress";
ALTER TABLE "Contratistas" DROP COLUMN IF EXISTS "City";