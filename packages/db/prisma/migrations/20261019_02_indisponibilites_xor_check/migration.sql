-- Indisponibilité : CHECK enseignant XOR salle (L1-20)
ALTER TABLE "indisponibilites" ADD CONSTRAINT chk_indispo_cible
  CHECK ((("enseignantId" IS NOT NULL)::int + ("salleId" IS NOT NULL)::int) = 1);