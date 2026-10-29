-- ============================================
-- Tables de base annees et semestres (creation precoce, minimale)
-- Seules les colonnes communes a toutes les migrations sont creees ici.
-- Les colonnes specifiques (statut, closedAt, grilleParams, ordre, etc.)
-- sont ajoutees par les migrations ulterieures ou par L7-04.
-- ============================================

CREATE TABLE IF NOT EXISTS "annees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "nbSemaines" INTEGER NOT NULL DEFAULT 14,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semestres_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "semestres_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "semestres_anneeId_idx" ON "semestres"("anneeId");
CREATE UNIQUE INDEX IF NOT EXISTS "semestres_anneeId_numero_key" ON "semestres"("anneeId", "numero");
