-- ============================================
-- L5-22 : File e-mail et SMTP institutionnel
-- Suit l'état d'envoi d'une notification : date, compteur de
-- tentatives et dernière erreur sanitisée.
-- ============================================

ALTER TABLE "notifications"
  ADD COLUMN "emailEnvoyeLe" TIMESTAMP,
  ADD COLUMN "emailTentatives" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "emailErreur" TEXT;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_emailTentatives_check"
  CHECK ("emailTentatives" >= 0);

DROP INDEX IF EXISTS "notifications_emailStatut_idx";
CREATE INDEX "notifications_emailStatut_createdAt_idx"
  ON "notifications"("emailStatut", "createdAt");
