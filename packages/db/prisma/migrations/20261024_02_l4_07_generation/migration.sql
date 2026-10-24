-- ============================================
-- L4-07 : Modèle Generation et enums associés
-- Table des générations d'emploi du temps avec statut, mode et liens vers semestre/version
-- Conforme ST §4.6.4, §4.6.5
-- ============================================

-- 1. Enum GenerationStatut
CREATE TYPE "GenerationStatut" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'SUCCEEDED_WITH_WARNINGS', 'FAILED', 'CANCELLED', 'TIMED_OUT');

-- 2. Enum GenerationMode
CREATE TYPE "GenerationMode" AS ENUM ('AUTOMATIQUE', 'MANUELLE');

-- 3. Table generations
CREATE TABLE "generations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semestreId" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "auteurId" UUID NOT NULL,
    "statut" "GenerationStatut" NOT NULL DEFAULT 'QUEUED',
    "mode" "GenerationMode" NOT NULL DEFAULT 'AUTOMATIQUE',
    "engine" TEXT NOT NULL DEFAULT 'fet',
    "engineVersion" TEXT,
    "erreur" TEXT,
    "cancelRequested" BOOLEAN NOT NULL DEFAULT FALSE,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "generations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "generations_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE,
    CONSTRAINT "generations_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE CASCADE
);

-- 4. Index pour recherche rapide par semestre et statut (garde d'un seul job par semestre)
CREATE INDEX "generations_semestreId_statut_idx" ON "generations"("semestreId", "statut");
