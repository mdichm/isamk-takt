-- CreateEnum: TypeEnseignementCode
CREATE TYPE "TypeEnseignementCode" AS ENUM ('CM', 'TD', 'TP', 'CI', 'AUTRE');

-- CreateEnum: GradeCode
CREATE TYPE "GradeCode" AS ENUM ('MC', 'MCF', 'PR', 'ATER', 'AUTRE');

-- CreateTable: types_enseignement
CREATE TABLE "types_enseignement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" "TypeEnseignementCode" NOT NULL,
    "libelle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "types_enseignement_pkey" PRIMARY KEY ("id")
);

-- CreateTable: grades
CREATE TABLE "grades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" "GradeCode" NOT NULL,
    "libelle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable: modules
CREATE TABLE "modules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "niveauId" UUID NOT NULL,
    "typeId" UUID NOT NULL,
    "gradeId" UUID,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "semestreNumero" INTEGER NOT NULL,
    "credits" INTEGER DEFAULT 6,
    "effectifMax" INTEGER,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "modules_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE CASCADE,
    CONSTRAINT "modules_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "types_enseignement"("id") ON DELETE CASCADE,
    CONSTRAINT "modules_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE SET NULL
);

-- CreateIndex : unicité (niveau, code, semestreNumero)
CREATE UNIQUE INDEX "modules_niveauId_code_semestreNumero_key" ON "modules"("niveauId", "code", "semestreNumero");

-- CreateIndex : performance sur les relations
CREATE INDEX "modules_niveauId_idx" ON "modules"("niveauId");
CREATE INDEX "modules_typeId_idx" ON "modules"("typeId");
CREATE INDEX "modules_gradeId_idx" ON "modules"("gradeId");

-- Uniqueness on codes
CREATE UNIQUE INDEX "types_enseignement_code_key" ON "types_enseignement"("code");
CREATE UNIQUE INDEX "grades_code_key" ON "grades"("code");