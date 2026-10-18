-- Add ordre column to departements with backfill by code order within annee
ALTER TABLE "departements" ADD COLUMN "ordre" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY "anneeId" ORDER BY "code") AS rn
  FROM "departements"
)
UPDATE "departements" d
SET "ordre" = o.rn
FROM ordered o
WHERE d.id = o.id;

DROP INDEX "departements_anneeId_idx";
CREATE INDEX "departements_anneeId_ordre_idx" ON "departements"("anneeId", "ordre");

-- Add ordre column to formations with backfill by code order within departement
ALTER TABLE "formations" ADD COLUMN "ordre" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY "departementId" ORDER BY "code") AS rn
  FROM "formations"
)
UPDATE "formations" f
SET "ordre" = o.rn
FROM ordered o
WHERE f.id = o.id;

DROP INDEX "formations_departementId_idx";
CREATE INDEX "formations_departementId_ordre_idx" ON "formations"("departementId", "ordre");

-- Add ordre column to niveaux with backfill by code order within formation
ALTER TABLE "niveaux" ADD COLUMN "ordre" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY "formationId" ORDER BY "code") AS rn
  FROM "niveaux"
)
UPDATE "niveaux" n
SET "ordre" = o.rn
FROM ordered o
WHERE n.id = o.id;

DROP INDEX "niveaux_formationId_idx";
CREATE INDEX "niveaux_formationId_ordre_idx" ON "niveaux"("formationId", "ordre");

-- Add ordre column to groupes with backfill by code order within (niveauId, semestreId)
ALTER TABLE "groupes" ADD COLUMN "ordre" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY "niveauId", "semestreId" ORDER BY "code") AS rn
  FROM "groupes"
)
UPDATE "groupes" g
SET "ordre" = o.rn
FROM ordered o
WHERE g.id = o.id;

DROP INDEX "groupes_niveauId_idx";
CREATE INDEX "groupes_niveauId_semestreId_ordre_idx" ON "groupes"("niveauId", "semestreId", "ordre");