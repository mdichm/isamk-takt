/**
 * L5-21 notif_core — Catalogue des événements de notification et de leurs destinataires (SF §14).
 *
 * Chaque entrée documente, pour un événement métier, quels rôles doivent recevoir la
 * notification. La résolution effective des IDs de destinataires est faite par les
 * use cases (version, validation, repartitions, generations, demandes) qui appellent
 * ensuite NotificationsService.creerNotifications avec la liste déjà résolue.
 */

export type EvenementNotification =
  | 'VERSION_CREEE'
  | 'VERSION_MODIFIEE'
  | 'DEMANDE_CREEE'
  | 'DEMANDE_TRAITEE'
  | 'VALIDATION_DEPARTEMENT'
  | 'GENERATION_LANCEE'
  | 'REPARTITION_ROUVERTE';

export const EvenementNotification = {
  VERSION_CREEE: 'VERSION_CREEE' as EvenementNotification,
  VERSION_MODIFIEE: 'VERSION_MODIFIEE' as EvenementNotification,
  DEMANDE_CREEE: 'DEMANDE_CREEE' as EvenementNotification,
  DEMANDE_TRAITEE: 'DEMANDE_TRAITEE' as EvenementNotification,
  VALIDATION_DEPARTEMENT: 'VALIDATION_DEPARTEMENT' as EvenementNotification,
  GENERATION_LANCEE: 'GENERATION_LANCEE' as EvenementNotification,
  REPARTITION_ROUVERTE: 'REPARTITION_ROUVERTE' as EvenementNotification,
} as const;

/**
 * Rôles de destinataires référencés par le catalogue (SF §14).
 */
export type DestinataireRole =
  | 'ENSEIGNANTS_DEPARTEMENT'      // tous les enseignants du département de la version
  | 'RESPONSABLE_PEDAGOGIQUE'      // responsable pédagogique du département
  | 'CHEF_DEPARTEMENT'             // chef de département
  | 'DEMANDEUR';                   // auteur de la demande

export type EvenementCatalogueEntry = {
  readonly libelle: string;
  /** Rôles à notifier pour cet événement (SF §14). */
  readonly destinataires: readonly DestinataireRole[];
  /** Si vrai, un lien vers la ressource concernée est inclus. */
  readonly avecLien: boolean;
  /** Si faux, la notification reste dans la boîte de réception sans e-mail. */
  readonly emailRequis: boolean;
};

export const CATALOGUE_EVENEMENTS: Record<EvenementNotification, EvenementCatalogueEntry> = {
  VERSION_CREEE: {
    libelle: 'Une nouvelle version d\'EDT a été créée pour votre département',
    destinataires: ['ENSEIGNANTS_DEPARTEMENT', 'RESPONSABLE_PEDAGOGIQUE'] as const,
    avecLien: true,
    emailRequis: true,
  },
  VERSION_MODIFIEE: {
    libelle: 'Une version d\'EDT de votre département a été modifiée',
    destinataires: ['ENSEIGNANTS_DEPARTEMENT'] as const,
    avecLien: true,
    emailRequis: true,
  },
  DEMANDE_CREEE: {
    libelle: 'Une demande de modification a été créée dans votre département',
    destinataires: ['CHEF_DEPARTEMENT', 'RESPONSABLE_PEDAGOGIQUE'] as const,
    avecLien: true,
    emailRequis: true,
  },
  DEMANDE_TRAITEE: {
    libelle: 'Votre demande de modification a été traitée',
    destinataires: ['DEMANDEUR'] as const,
    avecLien: true,
    emailRequis: true,
  },
  VALIDATION_DEPARTEMENT: {
    libelle: 'Une version d\'EDT a été validée pour votre département',
    destinataires: ['RESPONSABLE_PEDAGOGIQUE'] as const,
    avecLien: true,
    emailRequis: true,
  },
  GENERATION_LANCEE: {
    libelle: 'Une génération d\'EDT a été lancée',
    destinataires: ['RESPONSABLE_PEDAGOGIQUE'] as const,
    avecLien: true,
    emailRequis: false,
  },
  REPARTITION_ROUVERTE: {
    libelle: 'La répartition des enseignements a été rouverte',
    destinataires: ['ENSEIGNANTS_DEPARTEMENT'] as const,
    avecLien: true,
    emailRequis: false,
  },
};