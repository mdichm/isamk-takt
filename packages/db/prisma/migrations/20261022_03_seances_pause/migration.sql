-- CreateTable: seances (L3-08 : controle fenetre de pause)
CREATE TABLE "seances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semestreId" UUID NOT NULL,
    "enseignantId" UUID,
    "salleId" UUID,
    "jour" "JourSemaine" NOT NULL,
    "creneauDebutId" UUID NOT NULL,
    "nbCreneaux" INTEGER NOT NULL DEFAULT 1,
    "statut" TEXT NOT NULL DEFAULT 'PLACEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seances_pkey" PRIMARY KEY ("id")
);

-- FK: seance -> semestre (on delete cascade)
ALTER TABLE "seances"
    ADD CONSTRAINT "seances_semestreId_fkey"
    FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE;

-- FK: seance -> enseignant (on delete set null)
ALTER TABLE "seances"
    ADD CONSTRAINT "seances_enseignantId_fkey"
    FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE SET NULL;

-- FK: seance -> salle (on delete set null)
ALTER TABLE "seances"
    ADD CONSTRAINT "seances_salleId_fkey"
    FOREIGN KEY ("salleId") REFERENCES "salles"("id") ON DELETE SET NULL;

-- FK: seance -> creneau (creneauDebut)
ALTER TABLE "seances"
    ADD CONSTRAINT "seances_creneauDebutId_fkey"
    FOREIGN KEY ("creneauDebutId") REFERENCES "creneaux"("id");

-- Performance indexes
CREATE INDEX "seances_semestreId_idx" ON "seances"("semestreId");
CREATE INDEX "seances_enseignantId_idx" ON "seances"("enseignantId");
CREATE INDEX "seances_salleId_idx" ON "seances"("salleId");

-- CreateTable: seance_groupes (L3-08 : lien seance <-> groupes)
CREATE TABLE "seance_groupes" (
    "seanceId" UUID NOT NULL,
    "groupeId" UUID NOT NULL,

    CONSTRAINT "seance_groupes_pkey" PRIMARY KEY ("seanceId", "groupeId")
);

-- FK: seance_groupe -> seance (on delete cascade)
ALTER TABLE "seance_groupes"
    ADD CONSTRAINT "seance_groupes_seanceId_fkey"
    FOREIGN KEY ("seanceId") REFERENCES "seances"("id") ON DELETE CASCADE;

-- FK: seance_groupe -> groupe (on delete cascade)
ALTER TABLE "seance_groupes"
    ADD CONSTRAINT "seance_groupes_groupeId_fkey"
    FOREIGN KEY ("groupeId") REFERENCES "groupes"("id") ON DELETE CASCADE;
