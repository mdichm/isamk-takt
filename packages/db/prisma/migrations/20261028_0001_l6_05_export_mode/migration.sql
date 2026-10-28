-- AlterTable: versions_edt — ajoute publieLe et grilleFigée (L6-05)
ALTER TABLE "versions_edt" ADD COLUMN "publieLe" TIMESTAMP(3);
ALTER TABLE "versions_edt" ADD COLUMN "grilleFigée" "GrilleAffichage";

-- AlterTable: export_jobs — ajoute avertissementIds (L6-05)
ALTER TABLE "export_jobs" ADD COLUMN "avertissementIds" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];