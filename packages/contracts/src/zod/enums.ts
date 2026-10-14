import { z } from 'zod';

// ============================================================
// Enums TAKT — Source unique de vérité (alignés sur Prisma schema)
// ============================================================

/** Rôles utilisateur */
export const roleCodeSchema = z.enum([
  'ADMINISTRATEUR',
  'GESTIONNAIRE',
  'RESPONSABLE_DEPARTEMENT',
  'DIRECTION',
]);
export type RoleCode = z.infer<typeof roleCodeSchema>;

/** Statut d'année universitaire */
export const anneeStatutSchema = z.enum([
  'PREPARATION',
  'ACTIVE',
  'CLOTUREE',
]);
export type AnneeStatut = z.infer<typeof anneeStatutSchema>;

/** Statut de répartition */
export const repartitionStatutSchema = z.enum([
  'BROUILLON',
  'VALIDEE',
  'ROUVERTE',
]);
export type RepartitionStatut = z.infer<typeof repartitionStatutSchema>;

/** Statut de version de planning */
export const versionStatutSchema = z.enum([
  'BROUILLON',
  'GENERATION',
  'EDITION',
  'PRET_POUR_VALIDATION',
  'EN_VALIDATION',
  'REJETE',
  'CORRECTION',
  'VALIDE',
  'PUBLIE',
  'ARCHIVE',
]);
export type VersionStatut = z.infer<typeof versionStatutSchema>;

/** Statut de génération */
export const generationStatutSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'SUCCEEDED_WITH_WARNINGS',
  'FAILED',
  'CANCELLED',
  'TIMED_OUT',
]);
export type GenerationStatut = z.infer<typeof generationStatutSchema>;

/** Mode de génération */
export const generationModeSchema = z.enum([
  'AUTOMATIQUE',
  'MANUELLE',
]);
export type GenerationMode = z.infer<typeof generationModeSchema>;

/** Jour de la semaine */
export const jourSemaineSchema = z.enum([
  'LUNDI',
  'MARDI',
  'MERCREDI',
  'JEUDI',
  'VENDREDI',
  'SAMEDI',
]);
export type JourSemaine = z.infer<typeof jourSemaineSchema>;

/** Type de groupe */
export const groupeTypeSchema = z.enum([
  'SECTION',
  'GROUPE',
  'SOUS_GROUPE',
]);
export type GroupeType = z.infer<typeof groupeTypeSchema>;

/** Statut de séance */
export const seanceStatutSchema = z.enum([
  'PLACEE',
  'NON_PLACEE',
]);
export type SeanceStatut = z.infer<typeof seanceStatutSchema>;

/** Origine de séance */
export const seanceOrigineSchema = z.enum([
  'MOTEUR',
  'MANUEL',
]);
export type SeanceOrigine = z.infer<typeof seanceOrigineSchema>;

/** Type de ressource pour conflits */
export const ressourceTypeSchema = z.enum([
  'ENSEIGNANT',
  'SALLE',
  'GROUPE',
]);
export type RessourceType = z.infer<typeof ressourceTypeSchema>;

/** Type de conflit */
export const conflitTypeSchema = z.enum([
  'ENSEIGNANT',
  'SALLE',
  'GROUPE',
  'CAPACITE',
  'DISPONIBILITE',
  'COMPATIBILITE',
  'PEDAGOGIQUE',
  'COMPLETUDE',
  'VERROU',
  'COVOITURAGE',
  'VOEU',
]);
export type ConflitType = z.infer<typeof conflitTypeSchema>;

/** Sévérité de conflit */
export const conflitSeveriteSchema = z.enum([
  'BLOQUANT',
  'AVERTISSEMENT',
  'INFORMATION',
]);
export type ConflitSeverite = z.infer<typeof conflitSeveriteSchema>;

/** Catégorie de contrainte */
export const contrainteCategorieSchema = z.enum([
  'DURE',
  'SOUPLE',
]);
export type ContrainteCategorie = z.infer<typeof contrainteCategorieSchema>;

/** Portée de contrainte */
export const contraintePorteeSchema = z.enum([
  'GLOBALE',
  'ENSEIGNANT',
  'GROUPE',
  'SALLE',
  'MODULE',
]);
export type ContraintePortee = z.infer<typeof contraintePorteeSchema>;

/** Nature de contrainte */
export const contrainteNatureSchema = z.enum([
  'REGLE',
  'VOEU',
]);
export type ContrainteNature = z.infer<typeof contrainteNatureSchema>;

/** Support FET */
export const fetSupportSchema = z.enum([
  'NATIF',
  'PARTIEL',
  'AUCUN',
]);
export type FetSupport = z.infer<typeof fetSupportSchema>;

/** Période de charge */
export const chargePeriodeSchema = z.enum([
  'HEBDOMADAIRE',
  'SEMESTRIELLE',
  'ANNUELLE',
]);
export type ChargePeriode = z.infer<typeof chargePeriodeSchema>;

/** Impact département */
export const impactDepartementSchema = z.enum([
  'IMPACTE',
  'NON_IMPACTE',
]);
export type ImpactDepartement = z.infer<typeof impactDepartementSchema>;

/** Décision département */
export const decisionDepartementSchema = z.enum([
  'EN_ATTENTE',
  'APPROUVE',
  'REJETE',
]);
export type DecisionDepartement = z.infer<typeof decisionDepartementSchema>;

/** Type de demande */
export const demandeTypeSchema = z.enum([
  'ANOMALIE',
  'MODIFICATION',
]);
export type DemandeType = z.infer<typeof demandeTypeSchema>;

/** Statut de demande */
export const demandeStatutSchema = z.enum([
  'OUVERTE',
  'TRAITEE',
  'REFUSEE',
]);
export type DemandeStatut = z.infer<typeof demandeStatutSchema>;

/** Niveau d'exigence */
export const exigenceNiveauSchema = z.enum([
  'OBLIGATOIRE',
  'SOUHAITE',
]);
export type ExigenceNiveau = z.infer<typeof exigenceNiveauSchema>;

/** Type de verrou */
export const verrouTypeSchema = z.enum([
  'CRENEAU',
  'SALLE',
  'ENSEIGNANT',
  'ACTIVITE',
]);
export type VerrouType = z.infer<typeof verrouTypeSchema>;

/** Format d'export */
export const exportFormatSchema = z.enum([
  'PDF',
  'XLSX',
]);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

/** Mode d'export */
export const exportModeSchema = z.enum([
  'BROUILLON',
  'OFFICIEL',
]);
export type ExportMode = z.infer<typeof exportModeSchema>;

/** Grille d'affichage */
export const grilleAffichageSchema = z.enum([
  'NORMALE',
  'RAMADAN',
]);
export type GrilleAffichage = z.infer<typeof grilleAffichageSchema>;

/** Statut de job */
export const jobStatutSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'DONE',
  'FAILED',
]);
export type JobStatut = z.infer<typeof jobStatutSchema>;

/** Statut d'email */
export const emailStatutSchema = z.enum([
  'NON_APPLICABLE',
  'EN_ATTENTE',
  'ENVOYE',
  'ECHEC',
]);
export type EmailStatut = z.infer<typeof emailStatutSchema>;

/** Type de transition de workflow */
export const transitionTypeSchema = z.enum([
  'MARQUER_PRET',
  'SOUMETTRE',
  'REPRENDRE',
  'RESOUMETTRE',
  'ABANDONNER',
]);
export type TransitionType = z.infer<typeof transitionTypeSchema>;

/** Type de contrainte d'instance */
export const instanceContrainteTypeSchema = z.enum([
  'MIN_HOURS_PER_DAY',
  'MAX_HOURS_PER_DAY',
  'MAX_HOURS_IN_INTERVAL',
  'NO_SPLIT',
  'SAME_ROOM',
  'SAME_TEACHER',
  'CONSECUTIVE',
  'SPREAD',
  'AVOID',
  'PREFER',
  'COVOITURAGE',
]);
export type InstanceContrainteType = z.infer<typeof instanceContrainteTypeSchema>;
