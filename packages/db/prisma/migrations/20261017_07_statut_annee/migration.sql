-- CreateEnum
CREATE TYPE "AnneeStatut" AS ENUM ('PREPARATION', 'ACTIVE', 'CLOTUREE');

-- AlterTable
ALTER TABLE "annees" ADD COLUMN "statut" "AnneeStatut" NOT NULL DEFAULT 'PREPARATION';

-- Migrer les données existantes : actif (bool) -> statut (enum)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'annees' AND column_name = 'actif'
  ) THEN
    UPDATE "annees" SET statut = 'ACTIVE' WHERE actif = true;
    UPDATE "annees" SET statut = 'PREPARATION' WHERE actif = false;
    ALTER TABLE "annees" DROP COLUMN "actif";
  END IF;
END $$;

-- CreateIndex : une seule année ACTIVE à la fois (index unique partiel)
CREATE UNIQUE INDEX uq_annee_active ON "annees" (id) WHERE statut = 'ACTIVE';
