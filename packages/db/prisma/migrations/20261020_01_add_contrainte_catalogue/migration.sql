-- Migration add_contrainte_catalogue L3-01
-- Enums
CREATE TYPE "ContrainteCategorie" AS ENUM ('DURE', 'SOUPLE');
CREATE TYPE "ContraintePortee" AS ENUM ('GLOBALE', 'ENSEIGNANT', 'GROUPE', 'SALLE', 'MODULE');
CREATE TYPE "ContrainteNature" AS ENUM ('REGLE', 'VOEU');
CREATE TYPE "FetSupport" AS ENUM ('NATIF', 'PARTIEL', 'AUCUN');

-- Tables
CREATE TABLE "contrainte_definitions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL UNIQUE,
    "libelle" TEXT NOT NULL,
    "categorie" "ContrainteCategorie" NOT NULL,
    "portee" "ContraintePortee" NOT NULL,
    "paramsSchema" JSONB NOT NULL,
    "fetSupport" "FetSupport" NOT NULL DEFAULT 'NATIF',
    "actif" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE "contrainte_instances" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "semestreId" UUID NOT NULL,
    "definitionId" UUID NOT NULL,
    "enseignantId" UUID,
    "groupeId" UUID,
    "salleId" UUID,
    "moduleId" UUID,
    "params" JSONB NOT NULL,
    "poids" INTEGER,
    "nature" "ContrainteNature" NOT NULL DEFAULT 'REGLE',
    "commentaire" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT TRUE,
    "creePar" UUID NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contrainte_instances_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contrainte_instances_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "contrainte_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "contrainte_instances_semestreId_actif_idx" ON "contrainte_instances"("semestreId", "actif");
