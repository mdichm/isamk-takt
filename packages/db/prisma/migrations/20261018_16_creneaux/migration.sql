-- CreateEnum: JourSemaine (L1-17)
CREATE TYPE "JourSemaine" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI');

-- CreateTable: creneaux (L1-17)
CREATE TABLE "creneaux" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semestreId" UUID NOT NULL,
    "jour" "JourSemaine" NOT NULL,
    "ordre" INTEGER NOT NULL,
    "heureDebut" TIME(3) NOT NULL,
    "heureFin" TIME(3) NOT NULL,
    "estPause" BOOLEAN NOT NULL DEFAULT false,
    "estActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creneaux_pkey" PRIMARY KEY ("id")
);

-- FK: creneau -> semestre (on delete cascade)
ALTER TABLE "creneaux"
    ADD CONSTRAINT "creneaux_semestreId_fkey"
    FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE;

-- Uniqueness on (semestreId, jour, ordre)
CREATE UNIQUE INDEX "creneaux_semestreId_jour_ordre_key" ON "creneaux"("semestreId", "jour", "ordre");

-- Performance index on (semestreId, jour)
CREATE INDEX "creneaux_semestreId_jour_idx" ON "creneaux"("semestreId", "jour");

-- CHECK: durée exacte de 30 minutes (SLOT_MINUTES)
ALTER TABLE "creneaux"
    ADD CONSTRAINT "creneaux_duree_30min_check"
    CHECK (("heureFin" - "heureDebut") = interval '30 minutes');
