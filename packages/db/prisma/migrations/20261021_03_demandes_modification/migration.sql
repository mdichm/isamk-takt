-- CreateEnum: DemandeType (L2-15)
CREATE TYPE "DemandeType" AS ENUM ('ANOMALIE', 'MODIFICATION');

-- CreateEnum: DemandeStatut (L2-15)
CREATE TYPE "DemandeStatut" AS ENUM ('OUVERTE', 'TRAITEE', 'REFUSEE');

-- CreateTable: demandes_modification (L2-15)
CREATE TABLE "demandes_modification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semestreId" UUID NOT NULL,
    "departementCode" TEXT NOT NULL,
    "auteurId" UUID NOT NULL,
    "versionId" UUID,
    "type" "DemandeType" NOT NULL,
    "cible" JSONB NOT NULL,
    "motif" TEXT NOT NULL,
    "statut" "DemandeStatut" NOT NULL DEFAULT 'OUVERTE',
    "reponse" TEXT,
    "traiteePar" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteeLe" TIMESTAMP(3),

    CONSTRAINT "demandes_modification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "demandes_modification_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE,
    CONSTRAINT "demandes_modification_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "demandes_modification_traiteePar_fkey" FOREIGN KEY ("traiteePar") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Indexes for lookups
CREATE INDEX "demandes_modification_semestreId_idx" ON "demandes_modification"("semestreId");
CREATE INDEX "demandes_modification_departementCode_idx" ON "demandes_modification"("departementCode");
CREATE INDEX "demandes_modification_statut_idx" ON "demandes_modification"("statut");
CREATE INDEX "demandes_modification_auteurId_idx" ON "demandes_modification"("auteurId");
CREATE INDEX "demandes_modification_departementCode_statut_idx" ON "demandes_modification"("departementCode", "statut");