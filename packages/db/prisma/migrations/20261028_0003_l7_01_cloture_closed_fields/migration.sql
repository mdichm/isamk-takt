-- Migration L7-01: Création de la table annees et ajout des colonnes closedAt et closedBy pour la clôture d'année
-- NOTE : Aucune migration antérieure ne crée la table "annees" (referencée par 06_structure_academique et 07_statut_annee).
-- Cette migration la crée avec toutes les colonnes du schéma Prisma.

-- Créer le type enum AnneeStatut s'il n'existe pas (normalement créé par 07_statut_annee)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnneeStatut') THEN
        CREATE TYPE "AnneeStatut" AS ENUM ('PREPARATION', 'ACTIVE', 'CLOTUREE');
    END IF;
END $$;

-- Créer la table annees (aucune migration antérieure ne la crée)
CREATE TABLE IF NOT EXISTS "annees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "nbSemaines" INTEGER NOT NULL DEFAULT 14,
    "statut" "AnneeStatut" NOT NULL DEFAULT 'PREPARATION',
    "closedAt" TIMESTAMP(3),
    "closedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "annees_pkey" PRIMARY KEY ("id")
);

-- Contraintes d'unicité
CREATE UNIQUE INDEX IF NOT EXISTS "annees_code_key" ON "annees"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "annees_numero_key" ON "annees"("numero");

-- Index : une seule année ACTIVE à la fois (index unique partiel)
CREATE UNIQUE INDEX IF NOT EXISTS uq_annee_active ON "annees" (id) WHERE statut = 'ACTIVE';