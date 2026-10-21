-- CreateTable: affectations (L2-07)
CREATE TABLE "affectations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "repartitionId" UUID NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affectations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "affectations_repartitionId_fkey" FOREIGN KEY ("repartitionId") REFERENCES "repartitions"("id") ON DELETE CASCADE,
    CONSTRAINT "affectations_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE CASCADE,
    CONSTRAINT "affectations_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupes"("id") ON DELETE SET NULL,
    CONSTRAINT "affectations_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE,
    CONSTRAINT "affectations_typeEnseignementId_fkey" FOREIGN KEY ("typeEnseignementId") REFERENCES "types_enseignement"("id") ON DELETE CASCADE,
    CONSTRAINT "affectations_activityTagId_fkey" FOREIGN KEY ("activityTagId") REFERENCES "activity_tags"("id") ON DELETE SET NULL
);

-- Uniqueness on (repartitionId, enseignantId, moduleId, typeEnseignementId, groupeId)
CREATE UNIQUE INDEX "affectations_repartitionId_enseignantId_moduleId_typeEnseignementId_groupeId_key" ON "affectations"("repartitionId", "enseignantId", "moduleId", "typeEnseignementId", "groupeId");

-- Indexes for lookups
CREATE INDEX "affectations_repartitionId_idx" ON "affectations"("repartitionId");
CREATE INDEX "affectations_enseignantId_idx" ON "affectations"("enseignantId");
CREATE INDEX "affectations_moduleId_idx" ON "affectations"("moduleId");
CREATE INDEX "affectations_typeEnseignementId_idx" ON "affectations"("typeEnseignementId");
CREATE INDEX "affectations_groupeId_idx" ON "affectations"("groupeId");