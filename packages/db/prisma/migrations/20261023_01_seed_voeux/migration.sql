-- Migration seed_voeux L3-33
-- Insere les definitions de voeux enseignants dans le catalogue contrainte_definitions
-- Codes : TEACHER_AVOID_SLOT, TEACHER_DAY_OFF_WISH, TEACHER_DAYS_PER_WEEK,
--         TEACHER_HOURS_PER_DAY, TEACHER_GAPS
-- Poids : FAIBLE 25, MOYEN 50, FORT 75, TRES_FORT 90 ; 100 interdit (CHECK SQL)

INSERT INTO "contrainte_definitions" (
  "code", "libelle", "categorie", "portee", "classe", "traductionFET",
  "paramsSchema", "fetSupport", "actif"
) VALUES
  ('TEACHER_AVOID_SLOT', 'Creneaux a eviter', 'SOUPLE', 'ENSEIGNANT', 'SOFT_CONSTRAINT', 'APPLICATION_ONLY',
   '{"type":"object","properties":{"jour":{"type":"string","enum":["LUNDI","MARDI","MERCREDI","JEUDI","VENDREDI","SAMEDI"]},"creneauDebut":{"type":"string","pattern":"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"},"creneauFin":{"type":"string","pattern":"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"}},"required":["jour","creneauDebut","creneauFin"],"additionalProperties":false}',
   'PARTIEL', true),

  ('TEACHER_DAY_OFF_WISH', 'Jour libre souhaite', 'SOUPLE', 'ENSEIGNANT', 'SOFT_CONSTRAINT', 'APPLICATION_ONLY',
   '{"type":"object","properties":{"jour":{"type":"string","enum":["LUNDI","MARDI","MERCREDI","JEUDI","VENDREDI","SAMEDI"]}},"required":["jour"],"additionalProperties":false}',
   'PARTIEL', true),

  ('TEACHER_DAYS_PER_WEEK', 'Jours par semaine', 'SOUPLE', 'ENSEIGNANT', 'SOFT_CONSTRAINT', 'APPLICATION_ONLY',
   '{"type":"object","properties":{"jours":{"type":"integer","minimum":1,"maximum":6}},"required":["jours"],"additionalProperties":false}',
   'PARTIEL', true),

  ('TEACHER_HOURS_PER_DAY', 'Heures par jour', 'SOUPLE', 'ENSEIGNANT', 'SOFT_CONSTRAINT', 'APPLICATION_ONLY',
   '{"type":"object","properties":{"heures":{"type":"integer","minimum":0,"maximum":24}},"required":["heures"],"additionalProperties":false}',
   'PARTIEL', true),

  ('TEACHER_GAPS', 'Creaux / plages libres', 'SOUPLE', 'ENSEIGNANT', 'SOFT_CONSTRAINT', 'APPLICATION_ONLY',
   '{"type":"object","properties":{"creux":{"type":"integer","minimum":0,"maximum":10}},"required":["creux"],"additionalProperties":false}',
   'PARTIEL', true)
ON CONFLICT ("code") DO NOTHING;