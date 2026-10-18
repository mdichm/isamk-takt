-- CreateTable: types_salle
CREATE TABLE "types_salle" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "estActive" BOOLEAN NOT NULL DEFAULT true,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "types_salle_pkey" PRIMARY KEY ("id")
);

-- Uniqueness on code
CREATE UNIQUE INDEX "types_salle_code_key" ON "types_salle"("code");

-- CreateTable: equipements
CREATE TABLE "equipements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "estActive" BOOLEAN NOT NULL DEFAULT true,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipements_pkey" PRIMARY KEY ("id")
);

-- Uniqueness on code
CREATE UNIQUE INDEX "equipements_code_key" ON "equipements"("code");

-- CreateTable: salles
CREATE TABLE "salles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "site" TEXT,
    "capaciteMax" INTEGER NOT NULL,
    "capaciteRecommandee" INTEGER,
    "accesPMR" BOOLEAN NOT NULL DEFAULT false,
    "commentaire" TEXT,
    "estActive" BOOLEAN NOT NULL DEFAULT true,
    "departementId" UUID,
    "typeSalleId" UUID,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salles_pkey" PRIMARY KEY ("id")
);

-- FKs
ALTER TABLE "salles"
    ADD CONSTRAINT "salles_departementId_fkey"
    FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE SET NULL;

ALTER TABLE "salles"
    ADD CONSTRAINT "salles_typeSalleId_fkey"
    FOREIGN KEY ("typeSalleId") REFERENCES "types_salle"("id") ON DELETE SET NULL;

-- Check constraints (AC : capacité > 0, capacité recommandée <= capacité max)
ALTER TABLE "salles"
    ADD CONSTRAINT "salles_capacite_max_positive"
    CHECK ("capaciteMax" > 0);

ALTER TABLE "salles"
    ADD CONSTRAINT "salles_capacite_recommandee_lte_max"
    CHECK ("capaciteRecommandee" IS NULL OR "capaciteRecommandee" <= "capaciteMax");

-- Performance indexes
CREATE INDEX "salles_departementId_idx" ON "salles"("departementId");
CREATE INDEX "salles_typeSalleId_idx" ON "salles"("typeSalleId");

-- CreateTable: salles_equipements (junction table)
CREATE TABLE "salles_equipements" (
    "salleId" UUID NOT NULL,
    "equipementId" UUID NOT NULL,

    CONSTRAINT "salles_equipements_pkey" PRIMARY KEY ("salleId", "equipementId")
);

ALTER TABLE "salles_equipements"
    ADD CONSTRAINT "salles_equipements_salleId_fkey"
    FOREIGN KEY ("salleId") REFERENCES "salles"("id") ON DELETE CASCADE;

ALTER TABLE "salles_equipements"
    ADD CONSTRAINT "salles_equipements_equipementId_fkey"
    FOREIGN KEY ("equipementId") REFERENCES "equipements"("id") ON DELETE CASCADE;