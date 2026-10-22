-- Migration seed_regles_gen L3-05
-- Insere les definitions de regles generales dans le catalogue contrainte_definitions
-- Codes : MAX/MIN_HOURS_PER_DAY, MAX/MIN_CONTINUOUS_HOURS, MAX_GAPS_PER_DAY/WEEK,
--         MAX/MIN_DAYS_PER_WEEK, MAX_SPAN_PER_DAY, MAX_HOURS_IN_INTERVAL

INSERT INTO "contrainte_definitions" (
  "code", "libelle", "categorie", "portee", "classe", "traductionFET",
  "paramsSchema", "fetSupport", "actif"
) VALUES
  ('MAX_HOURS_PER_DAY', 'Heures maximales par jour', 'DURE', 'GLOBALE', 'HARD_CONSTRAINT', 'FET_SUPPORTED',
   '{"type":"object","properties":{"heures":{"type":"integer","minimum":1,"maximum":24}},"required":["heures"],"additionalProperties":false}',
   'NATIF', true),

  ('MIN_HOURS_PER_DAY', 'Heures minimales par jour', 'DURE', 'GLOBALE', 'HARD_CONSTRAINT', 'FET_SUPPORTED',
   '{"type":"object","properties":{"heures":{"type":"integer","minimum":0,"maximum":24},"joursVidesAutorises":{"type":"boolean"}},"required":["heures"],"additionalProperties":false}',
   'NATIF', true),

  ('MAX_CONTINUOUS_HOURS', 'Heures consécutives maximales', 'DURE', 'GLOBALE', 'HARD_CONSTRAINT', 'FET_SUPPORTED',
   '{"type":"object","properties":{"heures":{"type":"integer","minimum":1,"maximum":12}},"required":["heures"],"additionalProperties":false}',
   'NATIF', true),

  ('MIN_CONTINUOUS_HOURS', 'Heures consécutives minimales', 'SOUPLE', 'GLOBALE', 'SOFT_CONSTRAINT', 'APPLICATION_ONLY',
   '{"type":"object","properties":{"heures":{"type":"integer","minimum":1,"maximum":12}},"required":["heures"],"additionalProperties":false}',
   'PARTIEL', true),

  ('MAX_GAPS_PER_DAY', 'Creux maximaux par jour', 'DURE', 'GLOBALE', 'HARD_CONSTRAINT', 'FET_SUPPORTED',
   '{"type":"object","properties":{"creux":{"type":"integer","minimum":0,"maximum":10}},"required":["creux"],"additionalProperties":false}',
   'NATIF', true),

  ('MAX_GAPS_PER_WEEK', 'Creux maximaux par semaine', 'DURE', 'GLOBALE', 'HARD_CONSTRAINT', 'FET_SUPPORTED',
   '{"type":"object","properties":{"creux":{"type":"integer","minimum":0,"maximum":50}},"required":["creux"],"additionalProperties":false}',
   'NATIF', true),

  ('MAX_DAYS_PER_WEEK', 'Jours maximaux par semaine', 'DURE', 'GLOBALE', 'HARD_CONSTRAINT', 'FET_SUPPORTED',
   '{"type":"object","properties":{"jours":{"type":"integer","minimum":1,"maximum":6}},"required":["jours"],"additionalProperties":false}',
   'NATIF', true),

  ('MIN_DAYS_PER_WEEK', 'Jours minimaux par semaine', 'DURE', 'GLOBALE', 'HARD_CONSTRAINT', 'FET_SUPPORTED',
   '{"type":"object","properties":{"jours":{"type":"integer","minimum":1,"maximum":6}},"required":["jours"],"additionalProperties":false}',
   'NATIF', true),

  ('MAX_SPAN_PER_DAY', 'Amplitude journalière maximale', 'SOUPLE', 'GLOBALE', 'SOFT_CONSTRAINT', 'FET_SUPPORTED',
   '{"type":"object","properties":{"heures":{"type":"integer","minimum":1,"maximum":12}},"required":["heures"],"additionalProperties":false}',
   'NATIF', true),

  ('MAX_HOURS_IN_INTERVAL', 'Heures maximales dans un intervalle', 'DURE', 'GLOBALE', 'HARD_CONSTRAINT', 'FET_SUPPORTED',
   '{"type":"object","properties":{"debut":{"type":"string","pattern":"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"},"fin":{"type":"string","pattern":"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"},"heures":{"type":"integer","minimum":0,"maximum":24}},"required":["debut","fin","heures"],"additionalProperties":false}',
   'NATIF', true)
ON CONFLICT ("code") DO NOTHING;