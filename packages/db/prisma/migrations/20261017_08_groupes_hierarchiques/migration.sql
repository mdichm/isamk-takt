-- CreateEnum
CREATE TYPE "GroupeType" AS ENUM ('SECTION', 'GROUPE', 'SOUS_GROUPE');

-- CreateTable
CREATE TABLE "groupes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "niveauId" UUID NOT NULL,
    "semestreId" UUID NOT NULL,
    "parentId" UUID,
    "type" "GroupeType" NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "effectif" INTEGER NOT NULL DEFAULT 0,
    "originId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groupes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "groupes_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE CASCADE,
    CONSTRAINT "groupes_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE CASCADE,
    CONSTRAINT "groupes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "groupes"("id") ON DELETE SET NULL,
    CONSTRAINT "groupes_effectif_check" CHECK ("effectif" >= 0)
);

-- CreateIndex : unicité (niveau, semestre, code)
CREATE UNIQUE INDEX "groupes_niveauId_semestreId_code_key" ON "groupes"("niveauId", "semestreId", "code");

-- CreateIndex : performance sur les relations
CREATE INDEX "groupes_niveauId_idx" ON "groupes"("niveauId");
CREATE INDEX "groupes_semestreId_idx" ON "groupes"("semestreId");
CREATE INDEX "groupes_parentId_idx" ON "groupes"("parentId");

-- Trigger : un enfant hérite du semestre de son parent
CREATE OR REPLACE FUNCTION propagate_semestre_from_parent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parentId IS NOT NULL THEN
        SELECT semestreId INTO NEW.semestreId FROM "groupes" WHERE id = NEW.parentId;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_propagate_semestre ON "groupes";
CREATE TRIGGER trg_propagate_semestre
    BEFORE INSERT OR UPDATE ON "groupes"
    FOR EACH ROW
    EXECUTE FUNCTION propagate_semestre_from_parent();