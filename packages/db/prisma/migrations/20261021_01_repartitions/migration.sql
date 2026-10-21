-- CreateTable: repartitions (L2-06)
CREATE TYPE "RepartitionStatut" AS ENUM ('BROUILLON', 'VALIDEE', 'ROUVERTE');

CREATE TABLE "repartitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semestreId" UUID NOT NULL,
    "departementId" UUID NOT NULL,
    "statut" "RepartitionStatut" NOT NULL DEFAULT 'BROUILLON',
    "libelle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repartitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "repartitions_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE,
    CONSTRAINT "repartitions_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE CASCADE
);

-- Uniqueness on (semestreId, departementId)
CREATE UNIQUE INDEX "repartitions_semestreId_departementId_key" ON "repartitions"("semestreId", "departementId");

-- Indexes for lookups
CREATE INDEX "repartitions_semestreId_idx" ON "repartitions"("semestreId");
CREATE INDEX "repartitions_departementId_idx" ON "repartitions"("departementId");
