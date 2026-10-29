-- ============================================
-- L7-04 : Tests d'immutabilité — déclencheurs et garde de version
-- ============================================

-- Table occupations (si elle n'a pas ete creee par une migration precedente)
CREATE TABLE IF NOT EXISTS "occupations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "versionId" UUID NOT NULL,
    "seanceId" UUID NOT NULL,
    "jour" TEXT NOT NULL,
    "creneauId" UUID NOT NULL,
    "ressourceType" TEXT NOT NULL,
    "ressourceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "occupations_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE CASCADE,
    CONSTRAINT "occupations_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "seances"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "occupations_seanceId_idx" ON "occupations"("seanceId");
CREATE UNIQUE INDEX IF NOT EXISTS "occupations_versionId_jour_creneauId_ressourceType_ressourceId_key"
  ON "occupations"("versionId", "jour", "creneauId", "ressourceType", "ressourceId");

-- Colonnes potentiellement manquantes sur versions_edt (chain de migrations fracturee)
ALTER TABLE "versions_edt" ADD COLUMN IF NOT EXISTS "parentId" UUID;
ALTER TABLE "versions_edt" ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "versions_edt" ADD COLUMN IF NOT EXISTS "cycleValidation" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "versions_edt" ADD COLUMN IF NOT EXISTS "soumisPar" UUID;
ALTER TABLE "versions_edt" ADD COLUMN IF NOT EXISTS "validationPlanningRequise" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "versions_edt" ADD COLUMN IF NOT EXISTS "publicationRequise" BOOLEAN NOT NULL DEFAULT true;

-- Colonnes potentiellement manquantes sur seances
ALTER TABLE "seances" ADD COLUMN IF NOT EXISTS "versionId" UUID;
ALTER TABLE "seances" ADD COLUMN IF NOT EXISTS "affectationKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "seances" ADD COLUMN IF NOT EXISTS "rang" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "seances" ADD COLUMN IF NOT EXISTS "tag" TEXT;
ALTER TABLE "seances" ALTER COLUMN "jour" DROP NOT NULL;
ALTER TABLE "seances" ALTER COLUMN "creneauDebutId" DROP NOT NULL;

-- Fonction de garde d'immutabilité : bloque toute ecriture sur les tables
-- liees a une version PUBLIE/ARCHIVE ou a une annee CLOTUREE.
-- S'applique a l'Administrateur aussi (aucune exception de role).
CREATE OR REPLACE FUNCTION fn_guard_version_immutable() RETURNS trigger AS $$
DECLARE
  v_id uuid;
  v_statut text;
  v_annee_statut text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_id := OLD."versionId";
  ELSE
    v_id := NEW."versionId";
  END IF;

  IF v_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT v.statut::text, a.statut::text
    INTO v_statut, v_annee_statut
    FROM "versions_edt" v
    JOIN "semestres" s ON s.id = v."semestreId"
    JOIN "annees" a ON a.id = s."anneeId"
   WHERE v.id = v_id;

  IF v_statut IN ('PUBLIE', 'ARCHIVE') OR v_annee_statut = 'CLOTUREE' THEN
    RAISE EXCEPTION 'IMMUTABLE_VERSION' USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Declencheur sur occupations
CREATE TRIGGER trg_occupations_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON "occupations"
  FOR EACH ROW EXECUTE FUNCTION fn_guard_version_immutable();
