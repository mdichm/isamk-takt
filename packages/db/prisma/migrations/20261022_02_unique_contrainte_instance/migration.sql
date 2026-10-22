-- Migration unique_contrainte_instance L3-06
-- Ajoute des contraintes d'unicité partielle sur contrainte_instances
-- pour garantir qu'une même définition ne s'applique qu'une fois par sujet/semestre.
-- PostgreSQL traite NULL comme distinct dans un index unique classique,
-- donc on utilise des index partiels pour gérer les contraintes globales (tous les cibles NULL).

-- 1. Contraintes globales : une seule instance GLOBALE par (semestreId, definitionId)
CREATE UNIQUE INDEX "contrainte_instances_semestreId_definitionId_globale_key"
  ON "contrainte_instances"("semestreId", "definitionId")
  WHERE "enseignantId" IS NULL
    AND "groupeId" IS NULL
    AND "salleId" IS NULL
    AND "moduleId" IS NULL;

-- 2. Contraintes ENSEIGNANT : une seule instance par (semestreId, definitionId, enseignantId)
CREATE UNIQUE INDEX "contrainte_instances_semestreId_definitionId_enseignantId_key"
  ON "contrainte_instances"("semestreId", "definitionId", "enseignantId")
  WHERE "enseignantId" IS NOT NULL;

-- 3. Contraintes GROUPE : une seule instance par (semestreId, definitionId, groupeId)
CREATE UNIQUE INDEX "contrainte_instances_semestreId_definitionId_groupeId_key"
  ON "contrainte_instances"("semestreId", "definitionId", "groupeId")
  WHERE "groupeId" IS NOT NULL;

-- 4. Contraintes SALLE : une seule instance par (semestreId, definitionId, salleId)
CREATE UNIQUE INDEX "contrainte_instances_semestreId_definitionId_salleId_key"
  ON "contrainte_instances"("semestreId", "definitionId", "salleId")
  WHERE "salleId" IS NOT NULL;

-- 5. Contraintes MODULE : une seule instance par (semestreId, definitionId, moduleId)
CREATE UNIQUE INDEX "contrainte_instances_semestreId_definitionId_moduleId_key"
  ON "contrainte_instances"("semestreId", "definitionId", "moduleId")
  WHERE "moduleId" IS NOT NULL;