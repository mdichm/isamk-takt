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

    // Générations (L4-21) - comparaison et adoption
    historiqueGenerations: "Historique des générations de la version",
    btnAdopter: 'Adopter',
    confirmerAdoption: 'Confirmer l’adoption',
    adopterGeneration: 'Adopter la génération "{nom}" comme base d’édition ?',
    numeroVersion: 'Numéro de version',
    motifAdoption: 'Motif de l’adoption',
    motifAdoptionOptionnel: 'Optionnel : précisez pourquoi vous adoptez cette génération.',
    adoptionNonEligible: 'Cette génération n’est pas éligible à l’adoption (statut insuffisant).',
    annuler: 'Annuler',
    adoptionEnCours: 'Adoption en cours…',
    comparaison: 'Comparaison de générations',
    comparerGenerations: 'Sélectionnez 2 à 4 générations à comparer.',
    classement: 'Classement',
    btnComparer: 'Comparer',
    resultatComparaison: 'Résultat de la comparaison',
    indicateur: 'Indicateur',
    differencesUniquement: 'Différences détectées',
    seancesDifferentes: 'Séances différentes',
    changementsSeances: 'Changements de séances',
    cleSeance: 'Clé de séance',
    conflits: 'Conflits',
    conflitsApparus: 'Conflits apparus',
    conflitsDisparus: 'Conflits disparus',
    verrous: 'Verrous',
    verrousNonRespectes: 'Verrous non respectés',
    verrousRespectesTous: 'Tous les verrous sont respectés.',
    aucuneDifference: 'Aucune différence détectée entre les générations sélectionnées.',
    chargement: 'Chargement…',

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