/**
 * Messages de l'interface en français.
 * Toutes les chaînes visibles utilisateur passent par ce fichier (i18n).
 */
export const messages = {
  // Commun
  appName: 'TAKT',
  admin: 'Administration',
  users: 'Utilisateurs',
  create: 'Créer',
  edit: 'Modifier',
  delete: 'Supprimer',
  save: 'Enregistrer',
  cancel: 'Annuler',
  close: 'Fermer',
  search: 'Rechercher',
  active: 'Actif',
  inactive: 'Inactif',
  role: 'Rôle',
  department: 'Département',
  email: 'E-mail',
  prenom: 'Prénom',
  nom: 'Nom',
  password: 'Mot de passe',
  resetPassword: 'Réinitialiser le mot de passe',
  resetPasswordConfirm: 'Confirmer la réinitialisation du mot de passe',
  noUsers: 'Aucun utilisateur trouvé.',
  loading: 'Chargement...',
  error: 'Erreur',
  success: 'Succès',

  // Actions utilisateur
  userCreated: 'Utilisateur créé avec succès.',
  userUpdated: 'Utilisateur mis à jour avec succès.',
  userActivated: 'Utilisateur activé.',
  userDeactivated: 'Utilisateur désactivé.',
  userSingular: 'utilisateur',
  passwordResetTriggered: "Lien de réinitialisation envoyé par e-mail. L'administrateur ne voit jamais le mot de passe.",
  userDeleted: 'Utilisateur supprimé.',

  // Erreurs
  errorFetchUsers: 'Impossible de charger la liste des utilisateurs.',
  errorCreateUser: 'Impossible de créer l’utilisateur.',
  errorUpdateUser: 'Impossible de mettre à jour l’utilisateur.',
  errorToggleActive: 'Impossible de modifier le statut de l’utilisateur.',
  errorResetPassword: "Impossible d’envoyer le lien de réinitialisation.",
  errorGeneric: 'Une erreur inattendue est survenue.',
  errorUnauthorized: 'Vous n’êtes pas autorisé à accéder à cette page.',
  errorForbidden: 'Accès interdit. Réservé à l’Administrateur.',

  // Rôles
  roleAdmin: 'Administrateur',
  roleManager: 'Gestionnaire',
  roleDepartmentHead: 'Responsable de département',
  roleTeacher: 'Enseignant',
  roleDirection: 'Direction',
  roleStudent: 'Étudiant',

  // Colonnes du tableau
  columnName: 'Nom',
  columnEmail: 'E-mail',
  columnRole: 'Rôle',
  columnDepartment: 'Département',
  columnStatus: 'Statut',
  columnActions: 'Actions',

  // Boutons du tableau
  btnActivate: 'Activer',
  btnDeactivate: 'Désactiver',
  btnResetPassword: 'Réinitialiser le mot de passe',
  btnEdit: 'Modifier',

  // Formulaire
  formEmailPlaceholder: 'nom.prenom@example.com',
  formFirstNamePlaceholder: 'Prénom',
  formLastNamePlaceholder: 'Nom',
  formSelectRole: 'Sélectionner un rôle',
  formSelectDepartment: 'Sélectionner un département',
  formDepartmentRequired: 'Un département est requis pour ce rôle.',
} as const;

export type Messages = typeof messages;
