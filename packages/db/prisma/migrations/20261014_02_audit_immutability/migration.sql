-- Partial unique index for global UserRole (departementCode IS NULL)
-- Ensures a user can have only one global role of each type
CREATE UNIQUE INDEX "user_roles_global_unique" ON "user_roles" ("userId", "role") WHERE "departementCode" IS NULL;

-- Function to prevent UPDATE/DELETE on audit_logs
CREATE OR REPLACE FUNCTION fn_audit_guard()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Audit log table is append-only. UPDATE and DELETE are not allowed.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent UPDATE/DELETE on security_events
CREATE OR REPLACE FUNCTION fn_security_guard()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Security events table is append-only. UPDATE and DELETE are not allowed.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to enforce immutability on audit_logs
CREATE TRIGGER trg_audit_ro
    BEFORE UPDATE OR DELETE ON "audit_logs"
    FOR EACH STATEMENT EXECUTE FUNCTION fn_audit_guard();

-- Triggers to enforce immutability on security_events
CREATE TRIGGER trg_security_ro
    BEFORE UPDATE OR DELETE ON "security_events"
    FOR EACH STATEMENT EXECUTE FUNCTION fn_security_guard();

-- Revoke UPDATE, DELETE, TRUNCATE on audit tables from app_rw role
-- (role will be created in infrastructure setup; this will be applied when role exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_rw') THEN
        REVOKE UPDATE, DELETE, TRUNCATE ON "audit_logs", "security_events" FROM app_rw;
    END IF;
END $$;