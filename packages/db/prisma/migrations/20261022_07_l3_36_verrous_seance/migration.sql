-- ============================================
-- L3-36 : Verrous par séance (verrou_seance)
-- Table verrous_seances : un verrou par (séance, type), levée avec historique
-- ============================================

-- 1. Table verrous_seances
CREATE TABLE "verrous_seances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "versionId" UUID NOT NULL,
    "seanceId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "auteurId" UUID NOT NULL,
    "justification" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leveLe" TIMESTAMP(3),
    "levePar" UUID,

    CONSTRAINT "verrous_seances_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "verrous_seances_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE CASCADE,
    CONSTRAINT "verrous_seances_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "seances"("id") ON DELETE CASCADE
);

-- 2. Index sur (versionId, leveLe) pour requêtes par version et état de levée
CREATE INDEX "verrous_seances_versionId_leveLe_idx" ON "verrous_seances"("versionId", "leveLe");

-- 3. Index sur seanceId pour récupération rapide des verrous d'une séance
CREATE INDEX "verrous_seances_seanceId_idx" ON "verrous_seances"("seanceId");

-- 4. Index partiel : un seul verrou ACTIF par (séance, type)
CREATE UNIQUE INDEX "uq_verrou_actif" ON "verrous_seances"("seanceId", "type") WHERE "leveLe" IS NULL;

-- 5. Immutabilité : pas d'écriture sur les verrous d'une version PUBLIE/ARCHIVE ou d'une année clôturée
CREATE TRIGGER trg_verrou_immutable
    BEFORE INSERT OR UPDATE OR DELETE ON "verrous_seances"
    FOR EACH ROW EXECUTE FUNCTION fn_guard_version_immutable();