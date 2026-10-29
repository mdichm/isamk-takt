-- ============================================
-- Tables de base annees et semestres (creation precoce)
-- Permet de resoudre les FK inline des migrations ulterieures sur semestres.
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnneeStatut') THEN
        CREATE TYPE "AnneeStatut" AS ENUM ('PREPARATION', 'ACTIVE', 'CLOTUREE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VersionStatut') THEN
        CREATE TYPE "VersionStatut" AS ENUM ('BROUILLON', 'PUBLIE', 'ARCHIVE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExportFormat') THEN
        CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'HTML', 'ICS');
    END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS "semestres" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "anneeId" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "nbSemaines" INTEGER NOT NULL DEFAULT 14,
    "grilleParams" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semestres_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "semestres_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "semestres_anneeId_idx" ON "semestres"("anneeId");
CREATE UNIQUE INDEX IF NOT EXISTS "semestres_anneeId_numero_key" ON "semestres"("anneeId", "numero");
