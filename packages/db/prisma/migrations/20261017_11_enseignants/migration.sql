-- CreateTable: enseignants
CREATE TABLE "enseignants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "anneeId" UUID NOT NULL,
    "departementId" UUID NOT NULL,
    "gradeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enseignants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: enseignant_modules (join table)
CREATE TABLE "enseignant_modules" (
    "enseignantId" UUID NOT NULL,
    "moduleId" UUID NOT NULL,

    CONSTRAINT "enseignant_modules_pkey" PRIMARY KEY ("enseignantId", "moduleId")
);

-- AlterTable: enseignants — add FKs
ALTER TABLE "enseignants"
    ADD CONSTRAINT "enseignants_anneeId_fkey"
    FOREIGN KEY ("anneeId") REFERENCES "annees"("id") ON DELETE CASCADE;

ALTER TABLE "enseignants"
    ADD CONSTRAINT "enseignants_departementId_fkey"
    FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE CASCADE;

ALTER TABLE "enseignants"
    ADD CONSTRAINT "enseignants_gradeId_fkey"
    FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE SET NULL;

-- AlterTable: enseignant_modules — add FKs
ALTER TABLE "enseignant_modules"
    ADD CONSTRAINT "enseignant_modules_enseignantId_fkey"
    FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE CASCADE;

ALTER TABLE "enseignant_modules"
    ADD CONSTRAINT "enseignant_modules_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE;

-- Uniqueness on (anneeId, matricule)
CREATE UNIQUE INDEX "enseignants_anneeId_matricule_key" ON "enseignants"("anneeId", "matricule");

-- Uniqueness on email
CREATE UNIQUE INDEX "enseignants_email_key" ON "enseignants"("email");

-- Performance indexes
CREATE INDEX "enseignants_departementId_idx" ON "enseignants"("departementId");
CREATE INDEX "enseignants_gradeId_idx" ON "enseignants"("gradeId");
CREATE INDEX "enseignants_email_idx" ON "enseignants"("email");
CREATE INDEX "enseignant_modules_moduleId_idx" ON "enseignant_modules"("moduleId");