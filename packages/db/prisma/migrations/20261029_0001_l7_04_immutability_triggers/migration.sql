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

-- Type GroupeType (manquant si 20261017_08 a echoue)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GroupeType') THEN
        CREATE TYPE "GroupeType" AS ENUM ('SECTION', 'GROUPE', 'SOUS_GROUPE');
    END IF;
END $$;

-- Table groupes (reparation si 20261017_08 a echoue ou cree un schema incomplet)
CREATE TABLE IF NOT EXISTS "groupes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "niveauId" UUID NOT NULL,
    "semestreId" UUID NOT NULL,
    "parentId" UUID,
    "type" "GroupeType" NOT NULL DEFAULT 'SECTION',
    "code" TEXT NOT NULL DEFAULT '',
    "libelle" TEXT NOT NULL DEFAULT '',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "effectif" INTEGER NOT NULL DEFAULT 0,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groupes_pkey" PRIMARY KEY ("id")
);

-- Colonnes potentiellement manquantes sur groupes (si table existe deja sans certaines colonnes)
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "niveauId" UUID;
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "semestreId" UUID;
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "parentId" UUID;
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "type" "GroupeType";
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "libelle" TEXT;
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "ordre" INTEGER;
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "effectif" INTEGER;
ALTER TABLE "groupes" ADD COLUMN IF NOT EXISTS "originId" TEXT;

-- Table departements (reparation si 20261017_06 a echoue)
CREATE TABLE IF NOT EXISTS "departements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "anneeId" UUID NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "libelle" TEXT NOT NULL DEFAULT '',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departements_pkey" PRIMARY KEY ("id")
);

-- Table formations (reparation si 20261017_06 a echoue)
CREATE TABLE IF NOT EXISTS "formations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "departementId" UUID NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "libelle" TEXT NOT NULL DEFAULT '',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- Table niveaux (reparation si 20261017_06 a echoue)
CREATE TABLE IF NOT EXISTS "niveaux" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formationId" UUID NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "libelle" TEXT NOT NULL DEFAULT '',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "niveaux_pkey" PRIMARY KEY ("id")
);

-- Colonnes potentiellement manquantes sur departements, formations, niveaux (ordre manquait dans 20261017_06_structure_academique)
ALTER TABLE "departements" ADD COLUMN IF NOT EXISTS "ordre" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "formations" ADD COLUMN IF NOT EXISTS "ordre" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "niveaux" ADD COLUMN IF NOT EXISTS "ordre" INTEGER NOT NULL DEFAULT 0;

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
