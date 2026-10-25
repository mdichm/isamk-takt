-- ============================================
-- L5-10 : Nouvelle révision d'une version publiée
-- Ajoute parentId sur versions_edt pour lier une version enfant (EDITION)
-- à sa version parente (PUBLIE), avec index et clé étrangère auto-référencée.
-- Conforme ST §4.1.1, §0.3 (RC-04) ; EX-WFL-06, EX-PRI-03
-- ============================================

-- 1. Colonne parentId (nullable, auto-référence versions_edt)
ALTER TABLE "versions_edt"
  ADD COLUMN "parentId" UUID NULL;

-- 2. Clé étrangère auto-référencée (une version peut avoir une version parente)
ALTER TABLE "versions_edt"
  ADD CONSTRAINT "versions_edt_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "versions_edt"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Index sur parentId pour les requêtes enfant/parent
CREATE INDEX "versions_edt_parentId_idx" ON "versions_edt"("parentId");
