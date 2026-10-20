-- CreateTable: charge_rule_sets (L2-03)
CREATE TYPE "PeriodeRegle" AS ENUM ('HEBDOMADAIRE', 'SEMESTRIELLE', 'ANNUELLE');

CREATE TABLE "charge_rule_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" INTEGER NOT NULL,
    "periode" "PeriodeRegle" NOT NULL,
    "seuil" INTEGER,
    "plafond" INTEGER,
    "arrondi" INTEGER,
    "publieLe" TIMESTAMP(3),
    "anneeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charge_rule_sets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "charge_rule_sets_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees"("id") ON DELETE SET NULL
);

-- Uniqueness on numero
CREATE UNIQUE INDEX "charge_rule_sets_numero_key" ON "charge_rule_sets"("numero");

-- Indexes for lookups
CREATE INDEX "charge_rule_sets_periode_idx" ON "charge_rule_sets"("periode");
CREATE INDEX "charge_rule_sets_anneeId_idx" ON "charge_rule_sets"("anneeId");

-- CreateTable: charge_reference_grades (L2-03)
CREATE TABLE "charge_reference_grades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ruleSetId" UUID NOT NULL,
    "gradeId" UUID,
    "coefficient" DECIMAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charge_reference_grades_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "charge_reference_grades_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "charge_rule_sets"("id") ON DELETE CASCADE,
    CONSTRAINT "charge_reference_grades_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE SET NULL
);

-- Uniqueness on (ruleSet, grade)
CREATE UNIQUE INDEX "charge_reference_grades_ruleSetId_gradeId_key" ON "charge_reference_grades"("ruleSetId", "gradeId");

-- Indexes for lookups
CREATE INDEX "charge_reference_grades_ruleSetId_idx" ON "charge_reference_grades"("ruleSetId");
CREATE INDEX "charge_reference_grades_gradeId_idx" ON "charge_reference_grades"("gradeId");

-- CreateTable: charge_coefficients (L2-03)
CREATE TABLE "charge_coefficients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ruleSetId" UUID NOT NULL,
    "typeId" UUID NOT NULL,
    "coefficient" DECIMAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charge_coefficients_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "charge_coefficients_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "charge_rule_sets"("id") ON DELETE CASCADE,
    CONSTRAINT "charge_coefficients_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "types_enseignement"("id") ON DELETE CASCADE
);

-- Uniqueness on (ruleSet, type)
CREATE UNIQUE INDEX "charge_coefficients_ruleSetId_typeId_key" ON "charge_coefficients"("ruleSetId", "typeId");

-- Indexes for lookups
CREATE INDEX "charge_coefficients_ruleSetId_idx" ON "charge_coefficients"("ruleSetId");
CREATE INDEX "charge_coefficients_typeId_idx" ON "charge_coefficients"("typeId");

-- Guard: publication immutability (CHARGE_RULESET_PUBLISHED -> P0001 -> 423)
-- Un jeu de règles publié (publieLe renseigné) est immuable : aucune insertion,
-- mise à jour ou suppression n'est toleree sur ses lignes de reference (grade/type).
CREATE OR REPLACE FUNCTION fn_guard_charge_published() RETURNS trigger AS $$
DECLARE v_pub timestamptz; v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN v_id := OLD."ruleSetId"; ELSE v_id := NEW."ruleSetId"; END IF;
  SELECT "publieLe" INTO v_pub FROM "charge_rule_sets" WHERE id = v_id;
  IF v_pub IS NOT NULL THEN RAISE EXCEPTION 'CHARGE_RULESET_PUBLISHED' USING ERRCODE = 'P0001'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_charge_ref_guard BEFORE INSERT OR UPDATE OR DELETE ON "charge_reference_grades"
  FOR EACH ROW EXECUTE FUNCTION fn_guard_charge_published();

CREATE TRIGGER trg_charge_coef_guard BEFORE INSERT OR UPDATE OR DELETE ON "charge_coefficients"
  FOR EACH ROW EXECUTE FUNCTION fn_guard_charge_published();