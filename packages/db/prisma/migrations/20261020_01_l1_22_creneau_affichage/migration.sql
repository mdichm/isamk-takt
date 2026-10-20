-- CreateEnum: GrilleAffichage (L1-22)
CREATE TYPE "GrilleAffichage" AS ENUM ('NORMALE', 'RAMADAN');

-- CreateTable: creneau_affichage (L1-22)
CREATE TABLE "creneau_affichage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creneauId" UUID NOT NULL,
    "grille" "GrilleAffichage" NOT NULL DEFAULT 'RAMADAN',
    "heureDebut" TIME(0) NOT NULL,
    "heureFin" TIME(0) NOT NULL,

    CONSTRAINT "creneau_affichage_pkey" PRIMARY KEY ("id")
);

-- FK: creneau_affichage -> creneau (on delete cascade)
ALTER TABLE "creneau_affichage"
    ADD CONSTRAINT "creneau_affichage_creneauId_fkey"
    FOREIGN KEY ("creneauId") REFERENCES "creneaux"("id") ON DELETE CASCADE;

-- Uniqueness on (creneauId, grille)
CREATE UNIQUE INDEX "creneau_affichage_creneauId_grille_key" ON "creneau_affichage"("creneauId", "grille");

-- Performance index on creneauId
CREATE INDEX "creneau_affichage_creneauId_idx" ON "creneau_affichage"("creneauId");

-- CHECK: heureFin > heureDebut (pas de contrainte 30 minutes sur l'affichage Ramadan)
ALTER TABLE "creneau_affichage"
    ADD CONSTRAINT "creneau_affichage_ordre_check"
    CHECK ("heureFin" > "heureDebut");
