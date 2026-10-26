-- SPDX-License-Identifier: AGPL-3.0-only
-- TAKT - Circuit figé à la soumission (L5-18)
-- Ajoute les deux interrupteurs du workflow figés sur la version à chaque SOUMETTRE/RESOUMETTRE.

-- AddColumn
ALTER TABLE "versions_edt" ADD COLUMN "validationPlanningRequise" BOOLEAN NOT NULL DEFAULT true;

-- AddColumn
ALTER TABLE "versions_edt" ADD COLUMN "publicationRequise" BOOLEAN NOT NULL DEFAULT true;
