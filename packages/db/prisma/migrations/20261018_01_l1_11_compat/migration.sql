-- SPDX-License-Identifier: AGPL-3.0-only
-- TAKT - Compatibilités salles / Activity Tags et exigences d'équipement (L1-11)
-- Crée les tables salle_activity_tags et exigences_equipement, et le type enum ExigenceNiveau.

-- Type enum pour le niveau d'exigence d'équipement
CREATE TYPE "ExigenceNiveau" AS ENUM ('OBLIGATOIRE', 'SOUHAITE');

-- Table de jonction salle <-> Activity Tag (compatibilités tags d'une salle)
CREATE TABLE "salle_activity_tags" (
    "salleId" UUID NOT NULL,
    "activityTagId" UUID NOT NULL,

    CONSTRAINT "salle_activity_tags_pkey" PRIMARY KEY ("salleId", "activityTagId")
);

-- Index pour accélérer les recherches par salle et par tag
CREATE INDEX "salle_activity_tags_salleId_idx" ON "salle_activity_tags"("salleId");
CREATE INDEX "salle_activity_tags_activityTagId_idx" ON "salle_activity_tags"("activityTagId");

-- Clés étrangères avec cascade en suppression
ALTER TABLE "salle_activity_tags" ADD CONSTRAINT "salle_activity_tags_salleId_fkey"
    FOREIGN KEY ("salleId") REFERENCES "salles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salle_activity_tags" ADD CONSTRAINT "salle_activity_tags_activityTagId_fkey"
    FOREIGN KEY ("activityTagId") REFERENCES "activity_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table d'exigences d'équipement par (module, type d'enseignement)
CREATE TABLE "exigences_equipement" (
    "moduleId" UUID NOT NULL,
    "typeEnseignementId" UUID NOT NULL,
    "equipementId" UUID NOT NULL,
    "niveau" "ExigenceNiveau" NOT NULL DEFAULT 'OBLIGATOIRE',

    CONSTRAINT "exigences_equipement_pkey" PRIMARY KEY ("moduleId", "typeEnseignementId", "equipementId")
);

-- Index pour accélérer les requêtes par module, type et équipement
CREATE INDEX "exigences_equipement_moduleId_idx" ON "exigences_equipement"("moduleId");
CREATE INDEX "exigences_equipement_typeEnseignementId_idx" ON "exigences_equipement"("typeEnseignementId");
CREATE INDEX "exigences_equipement_equipementId_idx" ON "exigences_equipement"("equipementId");

-- Clés étrangères
ALTER TABLE "exigences_equipement" ADD CONSTRAINT "exigences_equipement_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "exigences_equipement" ADD CONSTRAINT "exigences_equipement_typeEnseignementId_fkey"
    FOREIGN KEY ("typeEnseignementId") REFERENCES "types_enseignement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "exigences_equipement" ADD CONSTRAINT "exigences_equipement_equipementId_fkey"
    FOREIGN KEY ("equipementId") REFERENCES "equipements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
