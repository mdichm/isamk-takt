-- ============================================
-- L3-10 : Occupations de ressources, CHECK de placement des séances, immutabilité PUBLIE/ARCHIVE
-- ============================================

-- 1. Types enum
CREATE TYPE "SeanceStatut" AS ENUM ('PLACEE', 'NON_PLACEE');
CREATE TYPE "SeanceOrigine" AS ENUM ('MOTEUR', 'MANUEL');
CREATE TYPE "RessourceType" AS ENUM ('ENSEIGNANT', 'SALLE', 'GROUPE');

-- 2. Mettre à jour les séances existantes : PLACEE sans placement effectif devient NON_PLACEE
-- (nécessaire pour respecter le CHECK chk_seance_placement ci-après)
UPDATE "seances" SET "statut" = 'NON_PLACEE' WHERE "statut" = 'PLACEE' AND "jour" IS NULL;

-- 3. Modifier Seance.statut (texte → enum) et ajuster le défaut
ALTER TABLE "seances" ALTER COLUMN "statut" TYPE "SeanceStatut" USING "statut"::"SeanceStatut";
ALTER TABLE "seances" ALTER COLUMN "statut" SET DEFAULT 'NON_PLACEE';

-- 4. Ajouter colonnes origine et revision
ALTER TABLE "seances" ADD COLUMN "origine" "SeanceOrigine" NOT NULL DEFAULT 'MOTEUR';
ALTER TABLE "seances" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;

-- 5. CHECK de placement : une séance PLACEE doit avoir jour + creneauDebutId ; NON_PLACEE doit les avoir nuls
ALTER TABLE "seances" ADD CONSTRAINT "chk_seance_placement" CHECK (
  ("statut" = 'PLACEE' AND "jour" IS NOT NULL AND "creneauDebutId" IS NOT NULL AND "nbCreneaux" > 0)
  OR
  ("statut" = 'NON_PLACEE' AND "jour" IS NULL AND "creneauDebutId" IS NULL)
);

-- 6. Table occupations
CREATE TABLE "occupations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "versionId" UUID NOT NULL,
    "seanceId" UUID NOT NULL,
    "jour" TEXT NOT NULL,
    "creneauId" UUID NOT NULL,
    "ressourceType" "RessourceType" NOT NULL,
    "ressourceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "occupations_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE CASCADE,
    CONSTRAINT "occupations_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "seances"("id") ON DELETE CASCADE
);

-- Indexes
CREATE INDEX "occupations_seanceId_idx" ON "occupations"("seanceId");
CREATE UNIQUE INDEX "occupations_versionId_jour_creneauId_ressourceType_ressourceId_key"
  ON "occupations"("versionId", "jour", "creneauId", "ressourceType", "ressourceId");

-- 7. Triggers d'immutabilité : une séance d'une version PUBLIE/ARCHIVE n'est pas modifiable ni supprimable
CREATE OR REPLACE FUNCTION "fn_seance_immutability_guard"()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "versions_edt" v
    WHERE v.id = COALESCE(NEW."versionId", OLD."versionId")
      AND v.statut IN ('PUBLIE', 'ARCHIVE')
  ) THEN
    RAISE EXCEPTION 'IMMUTABILITY : cette séance appartient à une version publiée ou archivée et ne peut pas être modifiée';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_seances_immutability_update"
BEFORE UPDATE ON "seances"
FOR EACH ROW
EXECUTE FUNCTION "fn_seance_immutability_guard"();

CREATE TRIGGER "trg_seances_immutability_delete"
BEFORE DELETE ON "seances"
FOR EACH ROW
EXECUTE FUNCTION "fn_seance_immutability_guard"();