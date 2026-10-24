-- ============================================
-- L3-43 : Exigences de salle par activité (exigences_salle_activite)
-- Table des exigences de salle (salle imposée + liste autorisée) par semestre
-- et affectationKey (EX-ACT-04, ST §4.11, §2.2)
// ============================================

-- 1. Table exigences_salle_activite
CREATE TABLE "exigences_salle_activite" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semestreId" UUID NOT NULL,
    "affectationKey" TEXT NOT NULL,
    "salleImposeeId" UUID,
    "creePar" UUID NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exigences_salle_activite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exigences_salle_activite_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE,
    CONSTRAINT "exigences_salle_activite_salleImposeeId_fkey" FOREIGN KEY ("salleImposeeId") REFERENCES "salles"("id")
);

-- 2. Unicité d'une exigence par semestre et affectationKey
CREATE UNIQUE INDEX "exigences_salle_activite_semestreId_affectationKey_key" ON "exigences_salle_activite"("semestreId", "affectationKey");

-- 3. Index pour recherche rapide par semestre et salle imposée
CREATE INDEX "exigences_salle_activite_semestreId_idx" ON "exigences_salle_activite"("semestreId");
CREATE INDEX "exigences_salle_activite_salleImposeeId_idx" ON "exigences_salle_activite"("salleImposeeId");

-- 4. Table exigences_salle_autorisee (liste de salles autorisées par exigence)
CREATE TABLE "exigences_salle_autorisee" (
    "exigenceId" UUID NOT NULL,
    "salleId" UUID NOT NULL,

    CONSTRAINT "exigences_salle_autorisee_pkey" PRIMARY KEY ("exigenceId", "salleId"),
    CONSTRAINT "exigences_salle_autorisee_exigenceId_fkey" FOREIGN KEY ("exigenceId") REFERENCES "exigences_salle_activite"("id") ON DELETE CASCADE,
    CONSTRAINT "exigences_salle_autorisee_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "salles"("id")
);

-- 5. Index sur salleId pour recherche inverse (quelles exigences autorisent cette salle)
CREATE INDEX "exigences_salle_autorisee_salleId_idx" ON "exigences_salle_autorisee"("salleId");
