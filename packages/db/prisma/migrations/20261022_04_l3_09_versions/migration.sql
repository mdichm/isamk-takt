-- CreateEnum: VersionStatut (L3-09 : creation de version)
CREATE TYPE "VersionStatut" AS ENUM ('BROUILLON', 'EDITION', 'EN_VALIDATION', 'VALIDE', 'PUBLIE', 'ARCHIVE', 'CORRECTION');

-- CreateTable: versions_edt (L3-09)
CREATE TABLE "versions_edt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semestreId" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "statut" "VersionStatut" NOT NULL DEFAULT 'BROUILLON',
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "versions_edt_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "versions_edt_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE
);

-- Indexes for versions_edt
CREATE INDEX "versions_edt_semestreId_idx" ON "versions_edt"("semestreId");
CREATE INDEX "versions_edt_statut_idx" ON "versions_edt"("statut");

-- CreateTable: version_snapshots (L3-09)
CREATE TABLE "version_snapshots" (
    "versionId" UUID NOT NULL,
    "snapshotId" UUID NOT NULL,

    CONSTRAINT "version_snapshots_pkey" PRIMARY KEY ("versionId", "snapshotId"),
    CONSTRAINT "version_snapshots_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE CASCADE,
    CONSTRAINT "version_snapshots_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "snapshots"("id") ON DELETE CASCADE
);

-- AlterTable: seances (ajout versionId, affectationKey, rang, tag — L3-09)
ALTER TABLE "seances"
    ADD COLUMN "versionId" UUID,
ALTER TABLE "seances"
    ADD COLUMN "affectationKey" TEXT NOT NULL DEFAULT '',
ALTER TABLE "seances"
    ADD COLUMN "rang" INTEGER NOT NULL DEFAULT 1,
ALTER TABLE "seances"
    ADD COLUMN "tag" TEXT,
ALTER TABLE "seances"
    ALTER COLUMN "jour" DROP NOT NULL,
ALTER TABLE "seances"
    ALTER COLUMN "creneauDebutId" DROP NOT NULL;

-- FK: seance -> version_edt (on delete set null)
ALTER TABLE "seances"
    ADD CONSTRAINT "seances_versionId_fkey"
    FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE SET NULL;

-- Performance indexes on seances
CREATE INDEX "seances_versionId_idx" ON "seances"("versionId");
CREATE INDEX "seances_affectationKey_idx" ON "seances"("affectationKey");

-- Uniqueness: une affectationKey a un rang unique par version
CREATE UNIQUE INDEX "seances_versionId_affectationKey_rang_key" ON "seances"("versionId", "affectationKey", "rang");