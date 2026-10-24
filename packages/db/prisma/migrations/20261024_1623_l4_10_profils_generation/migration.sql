-- ============================================
-- L4-10 : Profils de génération versionnés
-- Table des profils de génération et liens vers Generation
-- Conforme ST §2.2, §3.3, EX-GEN-01
-- ============================================

-- 1. Table profils_generation
CREATE TABLE "profils_generation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semestreId" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "numero" INTEGER NOT NULL DEFAULT 1,
    "estParDefaut" BOOLEAN NOT NULL DEFAULT FALSE,
    "dureeLimiteMinutes" INTEGER NOT NULL,
    "preserverVerrous" BOOLEAN NOT NULL DEFAULT FALSE,
    "engineVersion" TEXT,
    "constructeurVersion" TEXT,
    "graines" JSON NOT NULL DEFAULT '[]'::json,
    "poidsScore" JSON NOT NULL DEFAULT '{}'::json,
    "valeursSnapshot" JSON NOT NULL DEFAULT '{}'::json,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profils_generation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profils_generation_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE
);

-- 2. Index pour recherche rapide par semestre et par statut par défaut
CREATE INDEX "profils_generation_semestreId_idx" ON "profils_generation"("semestreId");
CREATE INDEX "profils_generation_estParDefaut_idx" ON "profils_generation"("estParDefaut");

-- 3. Ajout des colonnes de lien vers le profil sur la table generations
ALTER TABLE "generations"
    ADD COLUMN "profilGenerationId" UUID,
    ADD COLUMN "profilGenerationVersion" INTEGER NOT NULL DEFAULT 1;

-- 4. Clé étrangère vers profils_generation
ALTER TABLE "generations"
    ADD CONSTRAINT "generations_profilGenerationId_fkey"
    FOREIGN KEY ("profilGenerationId") REFERENCES "profils_generation"("id") ON DELETE SET NULL;

-- 5. Index sur la clé étrangère
CREATE INDEX "generations_profilGenerationId_idx" ON "generations"("profilGenerationId");