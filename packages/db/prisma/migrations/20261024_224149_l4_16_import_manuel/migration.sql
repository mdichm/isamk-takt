-- ============================================
-- L4-16 : Import de résultat manuel
-- Ajoute fichierAttendu et seeds sur generations
-- Conforme ST §4.6.7, §3.4.22, EX-MOT-07
-- ============================================

-- 1. Ajouter fichierAttendu (empreinte du fichier moteur attendu, mode MANUELLE)
ALTER TABLE "generations"
  ADD COLUMN "fichierAttendu" TEXT;

-- 2. Ajouter seeds (6 graines MRG32k3a, null en mode MANUELLE)
ALTER TABLE "generations"
  ADD COLUMN "seeds" JSON;