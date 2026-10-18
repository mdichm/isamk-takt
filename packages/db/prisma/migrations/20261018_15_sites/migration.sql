-- CreateTable: sites (L1-14)
CREATE TABLE "sites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "estPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- Uniqueness on code
CREATE UNIQUE INDEX "sites_code_key" ON "sites"("code");

-- Index on estPrincipal
CREATE INDEX "sites_estPrincipal_idx" ON "sites"("estPrincipal");

-- Add siteId column to salles (replaces free-text "site" column)
ALTER TABLE "salles" ADD COLUMN "siteId" UUID;

-- FK: salle -> site (on delete set null)
ALTER TABLE "salles"
    ADD CONSTRAINT "salles_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL;

-- Performance index
CREATE INDEX "salles_siteId_idx" ON "salles"("siteId");

-- Drop the old free-text "site" column from salles
ALTER TABLE "salles" DROP COLUMN "site";