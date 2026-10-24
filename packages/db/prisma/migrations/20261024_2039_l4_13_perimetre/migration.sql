-- ============================================
-- L4-13 : Périmètre et empreinte de version
-- Ajoute les colonnes perimetre et perimetreHash sur la table generations
-- Conforme ST §4.12, EX-GEN-02
-- ============================================

-- 1. Colonne périmètre figé (JSON) — stockée avec la génération au lancement
ALTER TABLE "generations"
    ADD COLUMN "perimetre" JSON;

-- 2. Colonne empreinte du périmètre (SHA-256 hex)
ALTER TABLE "generations"
    ADD COLUMN "perimetreHash" TEXT;