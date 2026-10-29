-- ============================================
-- L7-04 : Tables annees et semestres (creation precoce pour verrouiller la chaine de migrations)
-- ============================================

-- Type AnneeStatut (referencie par plusieurs migrations ultérieures)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnneeStatut') THEN
        CREATE TYPE "AnneeStatut" AS ENUM ('PREPARATION', 'ACTIVE', 'CLOTUREE');
    END IF;
END $$;

-- Table annees (toutes les colonnes, dont closedAt/closedBy pour L7-01)
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

CREATE UNIQUE INDEX IF NOT EXISTS "annees_code_key" ON "annees"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "annees_numero_key" ON "annees"("numero");
CREATE UNIQUE INDEX IF NOT EXISTS uq_annee_active ON "annees" (id) WHERE statut = 'ACTIVE';

-- Table semestres (referenciee par de nombreuses FK ultérieures)
CREATE TABLE IF NOT EXISTS "semestres" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "anneeId" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "nbSemaines" INTEGER NOT NULL DEFAULT 14,
    "grilleParams" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semestres_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "semestres_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "semestres_anneeId_idx" ON "semestres"("anneeId");
CREATE UNIQUE INDEX IF NOT EXISTS "semestres_anneeId_numero_key" ON "semestres"("anneeId", "numero");
