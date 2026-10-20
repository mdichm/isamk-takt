-- Migration add_classification_regles L3-02
-- Enums
CREATE TYPE "ClasseRegle" AS ENUM ('HARD_CONSTRAINT', 'SOFT_CONSTRAINT', 'BUSINESS_VALIDATION', 'INFORMATIONAL');
CREATE TYPE "TraductionFET" AS ENUM ('FET_SUPPORTED', 'FET_TRANSFORMED', 'APPLICATION_ONLY');

-- Table contrainte_definitions
ALTER TABLE "contrainte_definitions" ADD COLUMN "classe" "ClasseRegle" NOT NULL DEFAULT 'HARD_CONSTRAINT';
ALTER TABLE "contrainte_definitions" ADD COLUMN "traductionFET" "TraductionFET" NOT NULL DEFAULT 'FET_SUPPORTED';