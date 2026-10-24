-- ============================================
-- L4-15 : Fichier moteur
-- Crée la table fichiers_moteur (1:1 avec generations)
-- Conforme ST §4.6.7, EX-GEN-04
-- ============================================

CREATE TABLE "fichiers_moteur" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "generationId" UUID NOT NULL UNIQUE,
    "sha256" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "builderVersion" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mappingReport" JSON,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY ("generationId") REFERENCES "generations"("id") ON DELETE CASCADE
);

CREATE INDEX "fichiers_moteur_generationId_idx" ON "fichiers_moteur"("generationId");