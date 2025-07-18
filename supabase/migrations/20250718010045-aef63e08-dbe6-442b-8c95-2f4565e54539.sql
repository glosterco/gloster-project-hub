-- Update Project 38 to include "Avance del período" in requirements if not already present
UPDATE "Proyectos" 
SET "Requierment" = CASE 
  WHEN "Requierment" IS NULL THEN ARRAY['Avance del período']
  WHEN NOT ('Avance del período' = ANY("Requierment")) THEN array_append("Requierment", 'Avance del período')
  ELSE "Requierment"
END
WHERE id = 38;

-- Also update any other existing projects that don't have "Avance del período" 
-- as this should be a universal requirement
UPDATE "Proyectos" 
SET "Requierment" = CASE 
  WHEN "Requierment" IS NULL THEN ARRAY['Avance del período']
  WHEN NOT ('Avance del período' = ANY("Requierment")) THEN array_append("Requierment", 'Avance del período')
  ELSE "Requierment"
END
WHERE "Requierment" IS NULL OR NOT ('Avance del período' = ANY("Requierment"));