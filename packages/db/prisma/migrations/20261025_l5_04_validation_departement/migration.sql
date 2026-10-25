-- ============================================
-- L5-04 : Décisions de validation par département
-- Crée la table validation_departements (décision APPROUVE / REJETE / EN_ATTENTE
-- par département dans un cycle de validation), avec index et contrainte d'unicité.
-- Conforme ST §3.4.12, §4.1.1 ; EX-WFL-03, EX-WFL-04
-- ============================================

-- 1. Type enum pour la décision de validation par département
CREATE TYPE "DecisionDepartement" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REJETE');

-- 2. Table validation_departements
CREATE TABLE "validation_departements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "versionId" UUID NOT NULL,
  "cycle" INTEGER NOT NULL,
  "departementId" UUID NOT NULL,
  "impact" "ImpactDepartementStatut" NOT NULL,
  "decision" "DecisionDepartement" NOT NULL DEFAULT 'EN_ATTENTE',
  "reportee" BOOLEAN NOT NULL DEFAULT false,
  "cycleSource" INTEGER NULL,
  "userId" UUID NULL,
  "parAdministrateur" BOOLEAN NOT NULL DEFAULT false,
  "motif" TEXT NULL,
  "raisonImpact" JSON NULL,
  "at" TIMESTAMP(3) NULL,

  CONSTRAINT "validation_departements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "validation_departements_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "validation_departements_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "validation_departements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 3. Index et unicité (un couple version/departement est unique)
CREATE UNIQUE INDEX "validation_departements_versionId_departementId_key" ON "validation_departements"("versionId", "departementId");
CREATE INDEX "validation_departements_versionId_idx" ON "validation_departements"("versionId");
CREATE INDEX "validation_departements_departementId_idx" ON "validation_departements"("departementId");
