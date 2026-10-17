-- SPDX-License-Identifier: AGPL-3.0-only
-- TAKT - Fonction de purge des journaux (L0-41, EX-AUD-02)
-- Crée la fonction purge_journaux() exécutable par le rôle audit_purge.
-- La purge respecte les durées de conservation configurées dans parametres_securite
-- et écrit une entrée d'audit de purge. Les triggers append-only sont contournés
-- via session_replication_role = 'replica' (SECURITY DEFINER).

-- Rôle dédié à la purge des journaux (créé si absent, sans privilège de connexion par défaut)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_purge') THEN
        CREATE ROLE audit_purge NOLOGIN;
    END IF;
END $$;

-- Fonction de purge des journaux d'audit et de sécurité
CREATE OR REPLACE FUNCTION purge_journaux()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conservation_audit integer;
    v_conservation_securite integer;
    v_audit_deleted bigint;
    v_securite_deleted bigint;
BEGIN
    -- Lecture des durées de conservation (ligne unique id = 1)
    SELECT conservationAuditJours, conservationSecuriteJours
      INTO v_conservation_audit, v_conservation_securite
      FROM parametres_securite
     WHERE id = 1;

    -- Désactiver les triggers append-only pour permettre le DELETE
    SET session_replication_role = 'replica';

    -- Purge des anciens entries d'audit_logs (si durée configurée)
    IF v_conservation_audit IS NOT NULL AND v_conservation_audit > 0 THEN
        DELETE FROM audit_logs
         WHERE at < now() - (v_conservation_audit || ' days')::interval;
        GET DIAGNOSTICS v_audit_deleted = ROW_COUNT;
    ELSE
        v_audit_deleted := 0;
    END IF;

    -- Purge des anciens entries de security_events
    IF v_conservation_securite IS NOT NULL AND v_conservation_securite > 0 THEN
        DELETE FROM security_events
         WHERE at < now() - (v_conservation_securite || ' days')::interval;
        GET DIAGNOSTICS v_securite_deleted = ROW_COUNT;
    ELSE
        v_securite_deleted := 0;
    END IF;

    -- Rétablir les triggers
    SET session_replication_role = 'origin';

    -- Tracer la purge dans l'audit métier (la purge passe par la fonction dédiée)
    INSERT INTO audit_logs (userId, action, objetType, objetId, ancienneValeur, nouvelleValeur, motif, requestId, ip)
    VALUES (
        NULL,
        'PURGE_JOURNAUX',
        'system',
        'purge_journaux',
        NULL,
        jsonb_build_object(
            'audit_deleted', v_audit_deleted,
            'security_deleted', v_securite_deleted,
            'conservation_audit_jours', v_conservation_audit,
            'conservation_securite_jours', v_conservation_securite
        ),
        'Purge automatique des journaux selon durées de conservation',
        NULL,
        NULL
    );
END;
$$;

-- Accorder le droit d'exécution au rôle audit_purge
GRANT EXECUTE ON FUNCTION purge_journaux() TO audit_purge;

-- Accorder les droits DELETE, INSERT sur les tables concernées à audit_purge
-- (nécessaire car la fonction s'exécute avec SECURITY DEFINER mais les droits
--  de l'appelant sont vérifiés pour les objets sous-jacents)
GRANT DELETE ON audit_logs TO audit_purge;
GRANT DELETE ON security_events TO audit_purge;
GRANT INSERT ON audit_logs TO audit_purge;
GRANT USAGE ON SCHEMA public TO audit_purge;