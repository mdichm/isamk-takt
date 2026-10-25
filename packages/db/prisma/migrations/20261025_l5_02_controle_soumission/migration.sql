-- ============================================
-- L5-02 : Contrôle de soumission (versions_edt)
-- Ajoute cycleValidation (numéro de cycle de validation) et soumisPar (auteur de la soumission)
-- sur versions_edt, avec une clé étrangère vers users et un index.
-- Conforme ST §3.4.11, EX-WFL-01, EX-EDI-05
-- ============================================

-- 1. Ajouter la colonne cycle_validation (compteur de cycles de validation ouverts)
ALTER TABLE "versions_edt"
  ADD COLUMN "cycle_validation" INTEGER NOT NULL DEFAULT 0;

-- 2. Ajouter la colonne soumis_par (auteur de la dernière soumission, optionnel)
ALTER TABLE "versions_edt"
  ADD COLUMN "soumis_par" UUID NULL;

-- 3. Clé étrangère vers users (ON DELETE SET NULL pour garder l'historique si l'utilisateur est supprimé)
ALTER TABLE "versions_edt"
  ADD CONSTRAINT "versions_edt_soumis_par_fkey"
  FOREIGN KEY ("soumis_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Index sur soumis_par pour les recherches par auteur de soumission
CREATE INDEX "versions_edt_soumis_par_idx" ON "versions_edt"("soumis_par");