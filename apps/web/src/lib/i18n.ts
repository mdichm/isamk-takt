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
    profils: 'Profils de génération',

    // Générations (L4-20)
    generation: 'Génération',
    generations: 'Générations',
    lancerGeneration: 'Lancer la génération',
    annulerGeneration: 'Annuler la génération',
    telechargerFichierMoteur: 'Télécharger le fichier moteur',
    perimetreFige: 'Périmètre figé',
    profilGeneration: 'Profil de génération',
    rapportTraduction: 'Rapport de traduction FET',
    acquitterContraintes: "J'accepte que certaines contraintes ne soient pas traduites par l'adaptateur FET",
    confirmationLancement: 'Confirmer le lancement',
    progression: 'Progression',
    fichierMoteur: 'Fichier moteur',
    dureeExecution: 'Durée d\'exécution',
    aucuneGeneration: 'Aucune génération',
    genererUneNouvelle: 'Générer une nouvelle',
    statutEnAttente: 'En attente',
    statutEnCours: 'En cours',
    statutReussie: 'Réussie',
    statutReussieAvecAvertissements: 'Réussie avec avertissements',
    statutEchec: 'Échec',
    statutAnnulee: 'Annulée',
    statutDepassee: 'Délai dépassé',
    erreurGeneration: 'Erreur de génération',
    recharger: 'Recharger',

    // Import manuel (L4-23)
    importerResultatManuel: 'Importer un résultat manuel',
    fichierMoteurSha256: 'Empreinte SHA-256 du fichier moteur',
    versionMoteur: 'Version du moteur',
    empreinteCorrespond: 'L\'empreinte correspond ✓',
    empreinteNonCorrespond: 'L\'empreinte ne correspond pas ✗',
    modeManuel: 'Manuel',
    modeAutomatique: 'Automatique',
    selectionnerFichierResultat: 'Sélectionner le fichier de résultat (.fet)',
    importer: 'Importer',
    importEnCours: 'Import en cours...',
    importReussi: 'Résultat importé avec succès',
    importEchec: 'Échec de l\'import',
    erreurEmpreinteInvalide: 'L\'empreinte du fichier ne correspond pas au fichier moteur exporté.',
    erreurFichierRequis: 'Veuillez sélectionner un fichier .fet',
    dropzoneText: 'Déposez le fichier .fet ici ou cliquez pour sélectionner',

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