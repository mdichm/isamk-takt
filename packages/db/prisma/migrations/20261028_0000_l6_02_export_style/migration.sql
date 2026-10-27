-- Modèles visuels d'export versionnés (L6-02)
-- Table export_styles : logos, en-tête, pied de page, couleurs, orientation, format, éléments

CREATE TABLE "export_styles" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL,
  style_version INTEGER NOT NULL DEFAULT 1,
  libelle      TEXT NOT NULL,
  config       JSONB NOT NULL DEFAULT '{}'::jsonb,
  actif        BOOLEAN NOT NULL DEFAULT true,
  utilise_le   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_export_styles_code_version ON "export_styles" (code, style_version);
CREATE INDEX idx_export_styles_code ON "export_styles" (code);
CREATE INDEX idx_export_styles_actif ON "export_styles" (actif);

-- Table export_views (L6-03, créée ici pour partager le déclencheur)
CREATE TABLE "export_views" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL,
  view_version INTEGER NOT NULL DEFAULT 1,
  libelle     TEXT NOT NULL,
  vue         TEXT NOT NULL,
  format      TEXT NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}'::jsonb,
  actif       BOOLEAN NOT NULL DEFAULT true,
  utilise_le  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_export_views_code_version ON "export_views" (code, view_version);
CREATE INDEX idx_export_views_code ON "export_views" (code);
CREATE INDEX idx_export_views_actif ON "export_views" (actif);

-- Table export_jobs (L6-04, créée ici pour les relations)
CREATE TABLE "export_jobs" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id  UUID NOT NULL REFERENCES "versions_edt"(id),
  style_id    UUID NOT NULL REFERENCES "export_styles"(id),
  view_id     UUID NOT NULL REFERENCES "export_views"(id),
  auteur_id   UUID NOT NULL,
  format      TEXT NOT NULL,
  mode        TEXT NOT NULL,
  grille      TEXT NOT NULL DEFAULT 'NORMALE',
  parametres  JSONB NOT NULL DEFAULT '{}'::jsonb,
  statut      TEXT NOT NULL DEFAULT 'QUEUED',
  storage_key TEXT,
  sha256      TEXT,
  erreur      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_export_jobs_version_id ON "export_jobs" (version_id);
CREATE INDEX idx_export_jobs_style_id ON "export_jobs" (style_id);
CREATE INDEX idx_export_jobs_view_id ON "export_jobs" (view_id);
CREATE INDEX idx_export_jobs_auteur_id ON "export_jobs" (auteur_id);
CREATE INDEX idx_export_jobs_statut ON "export_jobs" (statut);

-- Fonction de garde d'immuabilité : empêche la modification/suppression d'une config déjà utilisée
CREATE OR REPLACE FUNCTION fn_guard_used_config() RETURNS trigger AS $$
BEGIN
  IF OLD."utilise_le" IS NOT NULL AND (TG_OP = 'DELETE' OR NEW IS DISTINCT FROM OLD) THEN
    IF TG_OP = 'UPDATE' AND NEW."utilise_le" = OLD."utilise_le"
       AND to_jsonb(NEW) - 'utilise_le' - 'updated_at' = to_jsonb(OLD) - 'utilise_le' - 'updated_at' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'CONFIG_IN_USE' USING ERRCODE = 'P0001';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Déclencheur sur export_styles
CREATE TRIGGER trg_style_used BEFORE UPDATE OR DELETE ON "export_styles"
  FOR EACH ROW EXECUTE FUNCTION fn_guard_used_config();

-- Déclencheur sur export_views
CREATE TRIGGER trg_view_used BEFORE UPDATE OR DELETE ON "export_views"
  FOR EACH ROW EXECUTE FUNCTION fn_guard_used_config();