-- Migration L7-01: Ajout des colonnes closedAt et closedBy sur la table annees pour la clôture d'année
ALTER TABLE "annees" ADD COLUMN "closedAt" timestamp(3);
ALTER TABLE "annees" ADD COLUMN "closedBy" uuid;