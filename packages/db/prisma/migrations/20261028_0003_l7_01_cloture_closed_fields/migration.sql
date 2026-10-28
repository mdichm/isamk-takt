-- Migration L7-01: Ajout des colonnes closedAt et closedBy sur la table annee pour la clôture d'année
ALTER TABLE "annee" ADD COLUMN "closedAt" timestamp(3);
ALTER TABLE "annee" ADD COLUMN "closedBy" uuid;