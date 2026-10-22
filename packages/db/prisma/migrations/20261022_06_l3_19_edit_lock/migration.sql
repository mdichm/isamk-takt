-- ============================================
-- L3-19 : Bail d'édition exclusif (edit_lock)
-- Table edit_locks : un bail par version, expirant après 30 minutes
-- ============================================

-- 1. Table edit_locks
CREATE TABLE "edit_locks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "versionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edit_locks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "edit_locks_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE CASCADE
);

-- 2. Unicité : un seul bail actif par version
CREATE UNIQUE INDEX "edit_locks_versionId_key" ON "edit_locks"("versionId");

-- 3. Index d'expiration pour nettoyage / vérification rapide
CREATE INDEX "edit_locks_expiresAt_idx" ON "edit_locks"("expiresAt");