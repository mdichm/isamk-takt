-- ============================================
-- L3-41 : Groupes de covoiturage (groupes_covoiturage)
-- Table des groupes de covoiturage par semestre (EX-CTR-05, ST §4.11, §4.3)
-- ============================================

-- 1. Table groupes_covoiturage
CREATE TABLE "groupes_covoiturage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semestreId" UUID NOT NULL,
    "margeMinutes" INTEGER NOT NULL DEFAULT 60,
    "joursCommunsMin" INTEGER NOT NULL DEFAULT 1,
    "strict" BOOLEAN NOT NULL DEFAULT FALSE,
    "enseignantIds" UUID[] NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groupes_covoiturage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "groupes_covoiturage_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE
);

-- 2. Index sur semestreId pour recherche rapide par semestre
CREATE INDEX "groupes_covoiturage_semestreId_idx" ON "groupes_covoiturage"("semestreId");