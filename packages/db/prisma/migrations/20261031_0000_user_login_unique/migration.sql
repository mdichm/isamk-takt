-- SPDX-License-Identifier: AGPL-3.0-only
-- TAKT - Identifiant de connexion (login) unique pour les utilisateurs.
--
-- Le login devient l'identifiant de connexion principal (l'email reste accepté).
-- La colonne est NOT NULL et UNIQUE comme déclaré dans schema.prisma.
--
-- La migration est idempotente et sûre pour une base contenant déjà des
-- utilisateurs : la colonne est ajoutée nullable, puis pré-remplie avec une
-- valeur dérivée de l'email suffixée par l'identifiant technique (unicité
-- garantie), avant d'être passent en NOT NULL.

-- 1. Ajout de la colonne (nullable le temps du remplissage)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "login" VARCHAR(50);

-- 2. Remplissage des comptes existants
UPDATE "users"
   SET "login" = LEFT(split_part("email", '@', 1), 40) || '_' || LEFT(REPLACE("id"::text, '-', ''), 8)
 WHERE "login" IS NULL;

-- 3. Contrôle d'unicité avant de poser la contrainte
DO $$
DECLARE
    v_doublons TEXT;
BEGIN
    SELECT string_agg(doublon, ', ')
      INTO v_doublons
      FROM (
        SELECT "login" AS doublon
          FROM "users"
         WHERE "login" IS NOT NULL
         GROUP BY "login"
        HAVING COUNT(*) > 1
      ) d;

    IF v_doublons IS NOT NULL THEN
        RAISE EXCEPTION 'Logins en doublon detectes lors de la migration : %', v_doublons;
    END IF;
END
$$;

-- 4. Passage en NOT NULL
ALTER TABLE "users"
  ALTER COLUMN "login" SET NOT NULL;

-- 5. Contrainte d'unicite et index de recherche
CREATE UNIQUE INDEX IF NOT EXISTS "users_login_key"
  ON "users" ("login");

CREATE INDEX IF NOT EXISTS "users_login_idx"
  ON "users" ("login");
