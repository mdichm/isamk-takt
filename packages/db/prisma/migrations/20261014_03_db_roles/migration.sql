-- SPDX-License-Identifier: AGPL-3.0-only
-- TAKT - Rôles de base de données et privilèges minimaux (L0-07)
--
-- Crée les rôles PostgreSQL avec droits minimaux :
--   app_rw     : lecture/écriture sur les tables métier (sauf audit_logs, security_events)
--   worker_rw  : accès limité aux tables nécessaires au worker (jobs, séances, occupations)
--   audit_ro   : lecture seule sur audit_logs et security_events
--   audit_purge: aucun droit direct ; utilise une fonction SECURITY DEFINER pour la purge
--
-- Conformément à ST §1.8, §5.3 : rôles distincts, droits minimaux,
-- audit_logs et security_events en append-only (immuables).

-- Création des rôles s'ils n'existent pas déjà
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_rw') THEN
        CREATE ROLE app_rw NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'worker_rw') THEN
        CREATE ROLE worker_rw NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_ro') THEN
        CREATE ROLE audit_ro NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_purge') THEN
        CREATE ROLE audit_purge NOLOGIN;
    END IF;
END $$;

-- Usage sur le schéma public pour tous les rôles de l'application
GRANT USAGE ON SCHEMA public TO app_rw, worker_rw, audit_ro, audit_purge;

-- ========================================================================
-- app_rw : lecture/écriture sur les tables métier (sauf audit et sécurité)
-- ========================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON
    users, user_roles, refresh_tokens, password_history, password_reset_tokens,
    parametres_securite, parametres_workflow, security_events
TO app_rw;

-- app_rw ne peut PAS modifier ni supprimer les journaux d'audit et de sécurité
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs, security_events FROM app_rw;

-- ========================================================================
-- worker_rw : accès limité (jobs pg-boss, séances, occupations en lecture/écriture)
-- ========================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON
    security_events
TO worker_rw;

-- ========================================================================
-- audit_ro : lecture seule sur les journaux
-- ========================================================================
GRANT SELECT ON audit_logs, security_events TO audit_ro;

-- ========================================================================
-- audit_purge : aucun droit direct (purge via fonction SECURITY DEFINER)
-- ========================================================================
-- (Aucun privilège direct accordé à ce rôle)

-- Privilèges sur les séquences (BIGSERIAL) pour les tables avec id auto-incrémenté
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_rw, worker_rw, audit_ro;