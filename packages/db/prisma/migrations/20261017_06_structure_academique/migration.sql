-- SPDX-License-Identifier: AGPL-3.0-only
-- TAKT - Structure académique (L1-03 : départements, formations, niveaux)
-- Crée les tables departements, formations, niveaux avec contraintes d'unicité
-- par (parent, code) et clés étrangères RESTRICT pour empêcher la suppression
-- d'un référentiel encore utilisé.

-- Table departements (rattachée à une année universitaire)
CREATE TABLE "departements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "anneeId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departements_pkey" PRIMARY KEY ("id")
);

-- Table formations (rattachée à un département)
CREATE TABLE "formations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "departementId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- Table niveaux (rattachée à une formation)
CREATE TABLE "niveaux" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "niveaux_pkey" PRIMARY KEY ("id")
);

-- Unicité par (anneeId, code) pour les départements
CREATE UNIQUE INDEX "departements_anneeId_code_key" ON "departements"("anneeId", "code");
-- Index pour accélérer les requêtes par année
CREATE INDEX "departements_anneeId_idx" ON "departements"("anneeId");

-- Unicité par (departementId, code) pour les formations
CREATE UNIQUE INDEX "formations_departementId_code_key" ON "formations"("departementId", "code");
-- Index pour accélérer les requêtes par département
CREATE INDEX "formations_departementId_idx" ON "formations"("departementId");

-- Unicité par (formationId, code) pour les niveaux
CREATE UNIQUE INDEX "niveaux_formationId_code_key" ON "niveaux"("formationId", "code");
-- Index pour accélérer les requêtes par formation
CREATE INDEX "niveaux_formationId_idx" ON "niveaux"("formationId");

-- Clés étrangères avec RESTRICT (empêcher la suppression si référencé)
ALTER TABLE "departements" ADD CONSTRAINT "departements_anneeId_fkey"
    FOREIGN KEY ("anneeId") REFERENCES "annees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "formations" ADD CONSTRAINT "formations_departementId_fkey"
    FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "niveaux" ADD CONSTRAINT "niveaux_formationId_fkey"
    FOREIGN KEY ("formationId") REFERENCES "formations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;