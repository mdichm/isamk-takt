-- ============================================
-- L5-03 : Analyse d'impact et report des approbations
-- Crée la table impact_departements (statut IMPACTE / NON_IMPACTE par département)
-- avec reportee et cycleSource, ainsi que les index et la contrainte d'unicité.
-- Conforme ST §4.13, EX-WFL-04
-- ============================================

-- 1. Type enum pour le statut d'impact par département
CREATE TYPE "ImpactDepartementStatut" AS ENUM ('IMPACTE', 'NON_IMPACTE');

-- 2. Table impact_departements
CREATE TABLE "impact_departements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "versionId" UUID NOT NULL,
  "departementId" UUID NOT NULL,
  "statut" "ImpactDepartementStatut" NOT NULL,
  "raison" TEXT NOT NULL,
  "reportee" BOOLEAN NOT NULL DEFAULT false,
  "cycleSource" UUID NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "impact_departements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "impact_departements_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "impact_departements_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Index et unicité (un couple version/departement est unique)
CREATE UNIQUE INDEX "impact_departements_versionId_departementId_key" ON "impact_departements"("versionId", "departementId");
CREATE INDEX "impact_departements_versionId_idx" ON "impact_departements"("versionId");
CREATE INDEX "impact_departements_departementId_idx" ON "impact_departements"("departementId");
