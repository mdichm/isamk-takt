-- SPDX-License-Identifier: AGPL-3.0-only
-- TAKT - Fournisseur d'authentification (L0-14 Interface AuthProvider)
--
-- Ajoute l'enum AuthProvider et les colonnes provider / providerSubject sur
-- la table users. Les comptes existants passent par le fournisseur LOCAL.
-- Ce fichier est une migration SQL brute créée avec
-- `prisma migrate dev --create-only` (ST §2.2, §2.4).

-- ========================================================================
-- Enum fournisseur d'authentification
-- ========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthProvider') THEN
    CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'OIDC', 'LDAP');
  END IF;
END $$;

-- ========================================================================
-- Colonnes sur users
-- ========================================================================
-- passwordHash devient nullable : un compte tiers (OIDC/LDAP) n'en a pas.
ALTER TABLE "users"
  ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL';

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "providerSubject" TEXT UNIQUE;

-- Index sur le sujet du fournisseur pour les recherches OIDC/LDAP à venir.
CREATE INDEX IF NOT EXISTS "users_providerSubject_idx" ON "users"("providerSubject");

-- Commentaires de colonnes
COMMENT ON COLUMN "users"."provider" IS 'Fournisseur dauthentification : LOCAL (par defaut), OIDC ou LDAP.';
COMMENT ON COLUMN "users"."providerSubject" IS 'Identifiant sujet du fournisseur externe (ex. sub OIDC), unique.';