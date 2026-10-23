-- ============================================
-- L3-39 : Acceptation des avertissements (avertissements_acceptes)
-- Table des avertissements acceptés, liée à la signature du conflit (EX-CTR-07, ST §4.15)
-- ============================================

-- 1. Table avertissements_acceptes
CREATE TABLE "avertissements_acceptes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "versionId" UUID NOT NULL,
    "regleCode" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "seanceIds" UUID[] NOT NULL DEFAULT '{}',
    "auteurId" UUID NOT NULL,
    "justification" TEXT,
    "versionRevision" INTEGER NOT NULL,
    "acceptePar" UUID NOT NULL,
    "accepteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caduqueLe" TIMESTAMP(3),

    CONSTRAINT "avertissements_acceptes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "avertissements_acceptes_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE CASCADE
);

-- 2. Index sur (versionId, signature) pour recherche rapide par version et conflit
CREATE INDEX "avertissements_acceptes_versionId_signature_idx" ON "avertissements_acceptes"("versionId", "signature");

-- 3. Immutabilité : pas d'écriture sur les avertissements d'une version PUBLIE/ARCHIVE ou d'une année clôturée
CREATE TRIGGER trg_avertissement_immutable
    BEFORE INSERT OR UPDATE OR DELETE ON "avertissements_acceptes"
    FOR EACH ROW EXECUTE FUNCTION fn_guard_version_immutable();
