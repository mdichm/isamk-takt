-- ============================================
-- L4-21 : Colonnes pour comparaison et adoption
-- Ajoute createdAt, durationSeconds, classee, classement, motifNonClassee sur generations
-- Conforme ST §4.7, EX-CMP-01, EX-CMP-02, EX-CMP-03
-- ============================================

-- 1. Ajouter createdAt (date de création de la génération)
ALTER TABLE "generations"
  ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now();

-- 2. Ajouter durationSeconds (durée d'exécution en secondes)
ALTER TABLE "generations"
  ADD COLUMN "durationSeconds" INTEGER;

-- 3. Ajouter classee (indique si la génération est classée)
ALTER TABLE "generations"
  ADD COLUMN "classee" BOOLEAN;

-- 4. Ajouter classement (rang dans le classement)
ALTER TABLE "generations"
  ADD COLUMN "classement" INTEGER;

-- 5. Ajouter motifNonClassee (motif si non classée)
ALTER TABLE "generations"
  ADD COLUMN "motifNonClassee" TEXT;