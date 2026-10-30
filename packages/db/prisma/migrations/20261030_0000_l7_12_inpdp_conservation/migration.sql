-- SPDX-License-Identifier: AGPL-3.0-only
-- TAKT - Conformité INPDP et conservation (L7-12)
-- Ajoute la colonne conservation_export_jours à parametres_securite
-- et étend la fonction purge_journaux() pour purger aussi les anciens exports.

-- Ajouter la colonne de durée de conservation des exports (nullable, jours)
ALTER TABLE parametres_securite
  ADD COLUMN "conservationExportJours" integer;

-- Étendre la fonction purge_journaux() pour inclure les export_jobs
CREATE OR REPLACE FUNCTION purge_journaux()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conservation_audit integer;
    v_conservation_securite integer;
    v_conservation_export integer;
    v_audit_deleted bigint;
    v_securite_deleted bigint;
    v_export_deleted bigint;
BEGIN
    -- Lecture des durées de conservation (ligne unique id = 1)
    SELECT "conservationAuditJours", "conservationSecuriteJours", "conservationExportJours"
      INTO v_conservation_audit, v_conservation_securite, v_conservation_export
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

    -- Purge des anciens entries de security_events (si durée configurée)
    IF v_conservation_securite IS NOT NULL AND v_conservation_securite > 0 THEN
        DELETE FROM security_events
         WHERE at < now() - (v_conservation_securite || ' days')::interval;
        GET DIAGNOSTICS v_securite_deleted = ROW_COUNT;
    ELSE
        v_securite_deleted := 0;
    END IF;

    -- Purge des anciens export_jobs (si durée configurée)
    IF v_conservation_export IS NOT NULL AND v_conservation_export > 0 THEN
        DELETE FROM export_jobs
         WHERE finished_at < now() - (v_conservation_export || ' days')::interval;
        GET DIAGNOSTICS v_export_deleted = ROW_COUNT;
    ELSE
        v_export_deleted := 0;
    END IF;

    -- Rétablir les triggers
    SET session_replication_role = 'origin';

    -- Tracer la purge dans l'audit métier
    INSERT INTO audit_logs (user_id, action, objet_type, objet_id, ancienne_valeur, nouvelle_valeur, motif, request_id, ip)
    VALUES (
        NULL,
        'PURGE_JOURNAUX',
        'system',
        'purge_journaux',
        NULL,
        jsonb_build_object(
            'audit_deleted', v_audit_deleted,
            'security_deleted', v_securite_deleted,
            'export_deleted', v_export_deleted,
            'conservation_audit_jours', v_conservation_audit,
            'conservation_securite_jours', v_conservation_securite,
            'conservation_export_jours', v_conservation_export
        ),
        'Purge automatique des journaux selon durées de conservation (INPDP)',
        NULL,
        NULL
    );
END;
$$;

-- Accorder les droits DELETE sur export_jobs au rôle audit_purge
GRANT DELETE ON export_jobs TO audit_purge;