-- ============================================
-- L5-01 : Workflow transitions de version (Machine d'états)
-- Ajoute PRET_POUR_VALIDATION et REJETE à VersionStatut,
-- ajoute la colonne revision sur versions_edt et crée la table workflow_transitions
-- Conforme ST §4.1.1, EX-WFL-01
-- ============================================

-- 1. Ajouter les nouvelles valeurs d'enum VersionStatut (PostgreSQL : ALTER TYPE ADD VALUE)
ALTER TYPE "VersionStatut" ADD VALUE 'PRET_POUR_VALIDATION';
ALTER TYPE "VersionStatut" ADD VALUE 'REJETE';

-- 2. Ajouter la colonne revision sur versions_edt (incrémentée à chaque transition)
ALTER TABLE "versions_edt"
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;

-- 3. Créer la table workflow_transitions (historique des transitions d'état de version)
CREATE TABLE "workflow_transitions" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "versionId"  UUID NOT NULL,
  "de"         VARCHAR(20) NOT NULL,
  "vers"       VARCHAR(20) NOT NULL,
  "userId"     UUID NOT NULL,
  "automatique" BOOLEAN NOT NULL DEFAULT false,
  "commentaire" TEXT,
  "at"         TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_transitions_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "workflow_transitions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Index sur (versionId, at) pour l'historique chronologique par version
CREATE INDEX "workflow_transitions_versionId_at_idx" ON "workflow_transitions"("versionId", "at");