-- CreateTable: decharges
CREATE TABLE "decharges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "heures" DOUBLE PRECISION NOT NULL,
    "enseignantId" UUID NOT NULL,
    "semestreId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decharges_pkey" PRIMARY KEY ("id")
);

-- AlterTable: decharges — add FKs
ALTER TABLE "decharges"
    ADD CONSTRAINT "decharges_enseignantId_fkey"
    FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE CASCADE;

ALTER TABLE "decharges"
    ADD CONSTRAINT "decharges_semestreId_fkey"
    FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE;

-- Uniqueness on (enseignantId, semestreId)
CREATE UNIQUE INDEX "decharges_enseignantId_semestreId_key" ON "decharges"("enseignantId", "semestreId");

-- Performance indexes
CREATE INDEX "decharges_enseignantId_idx" ON "decharges"("enseignantId");
CREATE INDEX "decharges_semestreId_idx" ON "decharges"("semestreId");