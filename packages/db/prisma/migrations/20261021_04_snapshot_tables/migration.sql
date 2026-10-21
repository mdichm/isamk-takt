-- CreateTable: snapshots (L2-12)
CREATE TABLE "snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "repartitionId" UUID NOT NULL,
    "tag" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "valideParId" UUID NOT NULL,
    "valideLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parAdministrateur" BOOLEAN NOT NULL DEFAULT false,
    "repartitionStatut" "RepartitionStatut" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "snapshots_repartitionId_fkey" FOREIGN KEY ("repartitionId") REFERENCES "repartitions"("id") ON DELETE CASCADE,
    CONSTRAINT "snapshots_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Indexes for snapshots
CREATE INDEX "snapshots_repartitionId_idx" ON "snapshots"("repartitionId");
CREATE INDEX "snapshots_valideParId_idx" ON "snapshots"("valideParId");

-- CreateTable: snapshot_affectations (L2-12)
CREATE TABLE "snapshot_affectations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "snapshotId" UUID NOT NULL,
    "enseignantId" UUID NOT NULL,
    "groupeId" UUID,
    "moduleId" UUID NOT NULL,
    "typeEnseignementId" UUID NOT NULL,
    "activityTagId" UUID,
    "volumeHebdoMinutes" INTEGER NOT NULL,
    "seancesParSemaine" INTEGER NOT NULL,
    "dureeMinutes" INTEGER NOT NULL,
    "estCmCommun" BOOLEAN NOT NULL DEFAULT false,
    "workingRevision" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "snapshot_affectations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "snapshot_affectations_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "snapshots"("id") ON DELETE CASCADE,
    CONSTRAINT "snapshot_affectations_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE CASCADE,
    CONSTRAINT "snapshot_affectations_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE,
    CONSTRAINT "snapshot_affectations_typeEnseignementId_fkey" FOREIGN KEY ("typeEnseignementId") REFERENCES "types_enseignement"("id") ON DELETE CASCADE
);

-- Indexes for snapshot_affectations
CREATE INDEX "snapshot_affectations_snapshotId_idx" ON "snapshot_affectations"("snapshotId");

-- CreateTable: snapshot_charges (L2-12)
CREATE TABLE "snapshot_charges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "snapshotId" UUID NOT NULL,
    "enseignantId" UUID NOT NULL,
    "volumeBrut" INTEGER NOT NULL,
    "chargeCalculee" INTEGER NOT NULL,
    "chargeReference" INTEGER NOT NULL,
    "decharges" INTEGER NOT NULL,
    "serviceDu" INTEGER NOT NULL,
    "ecart" INTEGER NOT NULL,
    "heuresSup" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshot_charges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "snapshot_charges_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "snapshots"("id") ON DELETE CASCADE,
    CONSTRAINT "snapshot_charges_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE CASCADE
);

-- Indexes for snapshot_charges
CREATE INDEX "snapshot_charges_snapshotId_idx" ON "snapshot_charges"("snapshotId");

-- ============================================
-- Triggers append-only sur SnapshotAffectation et SnapshotCharge (L2-12)
-- Empêche toute modification ou suppression après insertion (immuabilité).
-- ============================================

CREATE OR REPLACE FUNCTION prevent_snapshot_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Les snapshots sont immuables : toute mise à jour est interdite.';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_snapshot_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Les snapshots sont immuables : toute suppression est interdite.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER snapshot_affectations_no_update
    BEFORE UPDATE ON "snapshot_affectations"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_snapshot_update();

CREATE TRIGGER snapshot_affectations_no_delete
    BEFORE DELETE ON "snapshot_affectations"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_snapshot_delete();

CREATE TRIGGER snapshot_charges_no_update
    BEFORE UPDATE ON "snapshot_charges"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_snapshot_update();

CREATE TRIGGER snapshot_charges_no_delete
    BEFORE DELETE ON "snapshot_charges"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_snapshot_delete();