-- ============================================
-- L5-21 : Modèle et service de notification
-- Crée le type EmailStatut et la table notifications
-- (une ligne par destinataire, insérée dans la transaction métier)
-- Conforme ST §4.16, EX-NOT-03, EX-NOT-01
-- ============================================

-- 1. Créer le type enum EmailStatut
CREATE TYPE "EmailStatut" AS ENUM (
  'EN_ATTENTE',
  'ENVOYE',
  'ECHEC',
  'NON_APPLICABLE'
);

-- 2. Créer la table notifications
CREATE TABLE "notifications" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "destinataireId" UUID NOT NULL,
  "versionId"     UUID,
  "demandeId"     UUID,
  "evenement"     VARCHAR(50) NOT NULL,
  "titre"         TEXT NOT NULL,
  "lien"          TEXT,
  "emailStatut"   "EmailStatut" NOT NULL DEFAULT 'EN_ATTENTE',
  "lu"            BOOLEAN NOT NULL DEFAULT false,
  "luALe"         TIMESTAMP,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "notifications_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions_edt"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "notifications_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_modification"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 3. Index pour la boîte de réception (destinataire + lu)
CREATE INDEX "notifications_destinataireId_lu_idx" ON "notifications"("destinataireId", "lu");

-- 4. Index chronologique
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- 5. Index sur le statut email (pour le processeur de file email, L5-22)
CREATE INDEX "notifications_emailStatut_idx" ON "notifications"("emailStatut");