/**
 * Internationalisation - dictionnaire de textes externalisés (français).
 * Tous les libellés d'interface passent par cette fonction pour éviter tout
 * code d'état technique affiché à l'utilisateur (message métier uniquement).
 */

export type Lang = 'fr';

const MESSAGES: Record<Lang, Record<string, string>> = {
  fr: {
    // Coque / layout
    appTitle: 'TAKT',
    appSubtitle: 'Système de gestion des emplois du temps',
    nav: 'Navigation',
    userLabel: 'Utilisateur',
    logout: 'Déconnexion',
    login: 'Connexion',
    mfa: 'Authentification à deux facteurs',
    changePassword: 'Changement de mot de passe',

    // Pages / routes
    home: 'Accueil',
    structure: 'Structure académique',
    enseignants: 'Enseignants',
    repartitions: "Répartitions",
    salles: 'Salles',
    creneaux: 'Créneaux',
    ramadan: 'Ramadan',
    import: 'Import',
    adminUsers: 'Administration des utilisateurs',
    adminSecurity: 'Sécurité',
    adminSecurityEvents: 'Journal de sécurité',
    modulesVolumes: 'Volumes par module',
    demandes: 'Demandes de modification',
    charges: 'Charges',
    chargesAnnueles: 'Charges annuelles',

    // Auth
    signInTitle: 'Connexion',
    emailLabel: 'E-mail',
    passwordLabel: 'Mot de passe',
    signInButton: 'Se connecter',
    signingIn: 'Connexion en cours...',
    invalidCredentials: 'E-mail ou mot de passe incorrect.',
    mfaTitle: 'Code de vérification',
    mfaLabel: 'Code à 6 chiffres',
    mfaButton: 'Vérifier le code',
    verifying: 'Vérification en cours...',
    mfaFailed: 'Code invalide ou expiré.',
    changePasswordTitle: 'Changement de mot de passe',
    currentPasswordLabel: 'Mot de passe actuel',
    newPasswordLabel: 'Nouveau mot de passe',
    confirmPasswordLabel: 'Confirmer le nouveau mot de passe',
    changePasswordButton: 'Valider le changement',
    changingPassword: 'Modification en cours...',
    passwordChanged: 'Mot de passe modifié avec succès.',
    sessionExpired: 'Votre session a expiré. Veuillez vous reconnecter.',
    accessDenied: 'Accès refusé. Vous ne disposez pas des droits nécessaires pour cette page.',
    notFound: 'Page introuvable.',
    error: 'Une erreur est survenue. Veuillez réessayer.',
    refreshing: 'Actualisation de votre session...',

    // États / glossaire (libellés métier, jamais de code technique)
    statusDraft: 'Brouillon',
    statusValidated: 'Validée',
    statusReopened: 'Rouverte',
    statusActive: 'Active',
    statusClosed: 'Clôturée',
    statusPreparation: 'En préparation',
    roleAdministrateur: 'Administrateur',
    roleGestionnaire: 'Gestionnaire',
    roleResponsableDepartement: 'Responsable de département',
    roleDirection: 'Direction',
    roleEnseignant: 'Enseignant',
    roleEtudiant: 'Etudiant',
  },
};

/**
 * Traduit une clé dans la langue courante (par défaut 'fr').
 * Retourne la clé elle-même si aucune traduction n'est trouvée.
 */
export function t(key: string, lang: Lang = 'fr'): string {
  return MESSAGES[lang]?.[key] ?? key;
}