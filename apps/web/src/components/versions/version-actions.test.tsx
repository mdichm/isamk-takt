import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { VersionActions } from './version-actions';
import type { UseMutationResult } from '@tanstack/react-query';

vi.mock('@/hooks/use-version-transition', () => ({
  useExecuteTransition: vi.fn(),
}));
vi.mock('@/hooks/use-workflow-params', () => ({
  useWorkflowParams: vi.fn(),
}));
vi.mock('@/lib/api/versions', () => ({
  publishVersion: vi.fn(),
  newRevision: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/messages/fr', () => ({
  messages: {
    btnDemarrerEdition: 'Démarrer l\'édition',
    btnMarquerPret: 'Marquer prêt',
    btnSoumettre: 'Soumettre',
    btnReprendre: 'Reprendre',
    btnResoumettre: 'Résoumettre',
    btnAbandonner: 'Abandonner',
    btnPublierVersion: 'Publier',
    btnNouvelleRevision: 'Nouvelle version',
    versionTransitionSucces: 'Transition effectuée avec succès.',
    versionTransitionInterdite: 'Action interdite.',
    versionNonSoumettable: 'Version non soumettable.',
    versionTransitionErreur: 'Erreur de transition.',
    confirmationSoumissionTitre: 'Confirmer la soumission',
    confirmationSoumissionAvertissements:
      'Avertissements non acceptés. Continuer ?',
    confirmationSoumissionPublication:
      'La version actuellement publiée sera archivée.',
    confirmationSoumissionPublicationTitre:
      'Confirmer la soumission et la publication',
    confirmationSoumissionBoutonConfirmer: 'Oui, soumettre',
    confirmationSoumissionBoutonAnnuler: 'Annuler',
  },
}));

import { useExecuteTransition } from '@/hooks/use-version-transition';
import { useWorkflowParams } from '@/hooks/use-workflow-params';
import { publishVersion, newRevision, type TransitionRequestDto, type TransitionResponseDto } from '@/lib/api/versions';
import { messages } from '@/lib/messages/fr';

const mockUseExecuteTransition = vi.mocked(useExecuteTransition);
const mockUseWorkflowParams = vi.mocked(useWorkflowParams);
const mockPublishVersion = vi.mocked(publishVersion);
const mockNewRevision = vi.mocked(newRevision);

type TransitionMutate = (
  dto: { action: string; commentaire?: string; confirmerPublication?: boolean },
) => void;

const baseVersion = {
  id: 'v-1',
  numero: '1.1',
  statut: 'EDITION',
};

function renderActions(overrides: {
  role?: string;
  statut?: string;
  avertissementsNonAcceptes?: number | undefined;
  isPending?: boolean;
  publishPending?: boolean;
  newRevisionPending?: boolean;
  publicationRequise?: boolean;
} = {}) {
  const mutate = vi.fn() as TransitionMutate;
  mockUseExecuteTransition.mockReturnValue({
    mutate,
    isPending: overrides.isPending ?? false,
  } as unknown as UseMutationResult<
    TransitionResponseDto,
    Error,
    TransitionRequestDto,
    unknown
  >);

  // L5-19 : circuit global courant (valeurs par défaut : les deux requis).
  mockUseWorkflowParams.mockReturnValue({
    data: {
      validationPlanningRequise: true,
      publicationRequise: overrides.publicationRequise ?? true,
      updatedAt: '2026-10-26T08:00:00.000Z',
      updatedBy: null,
    },
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useWorkflowParams>);

  const props = {
    version: { ...baseVersion, statut: overrides.statut ?? baseVersion.statut },
    role: (overrides.role ?? 'GESTIONNAIRE') as
      | 'ADMINISTRATEUR'
      | 'GESTIONNAIRE'
      | 'RESPONSABLE_DEPARTEMENT'
      | 'DIRECTION'
      | 'ENSEIGNANT'
      | 'ETUDIANT'
      | undefined,
    avertissementsNonAcceptes: overrides.avertissementsNonAcceptes,
  };
  const utils = render(<VersionActions {...props} />);
  return { ...utils, mutate };
}

describe('VersionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    // Les dialogues sont rendus dans un portal : purger le body pour éviter
    // que les modales d'un test restent dans le document.
    document.body.innerHTML = '';
  });

  it('ne rend rien quand aucun rôle n\'est fourni', () => {
    const { mutate } = renderActions({ role: undefined });
    expect(screen.queryByText('Démarrer l\'édition')).not.toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('affiche uniquement les actions autorisées pour EDITION (GESTIONNAIRE)', () => {
    renderActions({ role: 'GESTIONNAIRE' });
    expect(screen.getByText('Marquer prêt')).toBeInTheDocument();
    expect(screen.getByText('Abandonner')).toBeInTheDocument();
    expect(screen.queryByText('Soumettre')).not.toBeInTheDocument();
    expect(screen.queryByText('Publier')).not.toBeInTheDocument();
  });

  it('affiche Soumettre et Reprendre pour PRET_POUR_VALIDATION', () => {
    renderActions({ role: 'GESTIONNAIRE', statut: 'PRET_POUR_VALIDATION' });
    expect(screen.getByText('Soumettre')).toBeInTheDocument();
    expect(screen.getByText('Reprendre')).toBeInTheDocument();
    expect(screen.queryByText('Publier')).not.toBeInTheDocument();
  });

  it('affiche Publier et Abandonner pour VALIDE', () => {
    renderActions({ role: 'GESTIONNAIRE', statut: 'VALIDE' });
    expect(screen.getByText('Publier')).toBeInTheDocument();
    expect(screen.getByText('Abandonner')).toBeInTheDocument();
    expect(screen.queryByText('Soumettre')).not.toBeInTheDocument();
  });

  it('affiche Nouvelle version pour PUBLIE', () => {
    renderActions({ role: 'GESTIONNAIRE', statut: 'PUBLIE' });
    expect(screen.getByText('Nouvelle version')).toBeInTheDocument();
    expect(screen.queryByText('Publier')).not.toBeInTheDocument();
  });

  it('n\'affiche aucune action pour ARCHIVE (immuable)', () => {
    const { container } = renderActions({ role: 'GESTIONNAIRE', statut: 'ARCHIVE' });
    expect(container.querySelector('button')).toBeNull();
  });

  it('n\'affiche aucune action de transition pour DIRECTION', () => {
    const { container } = renderActions({ role: 'DIRECTION' });
    expect(container.querySelector('button')).toBeNull();
  });

  it('Soumettre avec avertissements ouvre la modale de confirmation sans appeler la transition', () => {
    renderActions({
      role: 'GESTIONNAIRE',
      statut: 'PRET_POUR_VALIDATION',
      avertissementsNonAcceptes: 2,
    });
    fireEvent.click(screen.getByText('Soumettre'));
    expect(screen.getByText('Confirmer la soumission')).toBeInTheDocument();
    expect(screen.getByText(messages.confirmationSoumissionAvertissements)).toBeInTheDocument();
  });

  it('confirmer la soumission exécute la transition avec confirmerPublication', () => {
    const { mutate } = renderActions({
      role: 'GESTIONNAIRE',
      statut: 'PRET_POUR_VALIDATION',
      avertissementsNonAcceptes: 1,
    });
    fireEvent.click(screen.getByText('Soumettre'));
    expect(screen.getByText('Confirmer la soumission')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByText('Oui, soumettre'));
    expect(mutate).toHaveBeenCalledWith({
      action: 'SOUMETTRE',
      confirmerPublication: true,
    });
  });

  it('annuler la confirmation n\'appelle pas la transition', () => {
    const { mutate } = renderActions({
      role: 'GESTIONNAIRE',
      statut: 'PRET_POUR_VALIDATION',
      avertissementsNonAcceptes: 1,
    });
    fireEvent.click(screen.getByText('Soumettre'));
    fireEvent.click(screen.getByText('Annuler'));
    expect(mutate).not.toHaveBeenCalled();
  });

  it('Soumettre sans avertissements exécute la transition directement', () => {
    const { mutate } = renderActions({
      role: 'GESTIONNAIRE',
      statut: 'PRET_POUR_VALIDATION',
      avertissementsNonAcceptes: 0,
    });
    fireEvent.click(screen.getByText('Soumettre'));
    expect(mutate).toHaveBeenCalledWith({ action: 'SOUMETTRE' });
  });

  it('Publier appelle publishVersion et ne mute pas la transition', () => {
    const { mutate } = renderActions({
      role: 'GESTIONNAIRE',
      statut: 'VALIDE',
    });
    fireEvent.click(screen.getByText('Publier'));
    expect(mockPublishVersion).toHaveBeenCalledWith('v-1');
    expect(mutate).not.toHaveBeenCalled();
  });

  it('Nouvelle version appelle newRevision', () => {
    const { mutate } = renderActions({
      role: 'GESTIONNAIRE',
      statut: 'PUBLIE',
    });
    fireEvent.click(screen.getByText('Nouvelle version'));
    expect(mockNewRevision).toHaveBeenCalledWith('v-1');
    expect(mutate).not.toHaveBeenCalled();
  });

  it('désactive les boutons pendant la transition en cours', () => {
    renderActions({
      role: 'GESTIONNAIRE',
      statut: 'PRET_POUR_VALIDATION',
      isPending: true,
    });
    expect(screen.getByText('Soumettre')).toBeDisabled();
  });

  // ==================================================================
  // L5-19 : confirmation quand la soumission publiera la version
  // ==================================================================

  it('Soumettre sans avertissements mais avec publication automatique ouvre la confirmation', () => {
    const { mutate } = renderActions({
      role: 'GESTIONNAIRE',
      statut: 'PRET_POUR_VALIDATION',
      avertissementsNonAcceptes: 0,
      publicationRequise: false,
    });
    fireEvent.click(screen.getByText('Soumettre'));
    expect(mutate).not.toHaveBeenCalled();
    expect(
      screen.getByText('Confirmer la soumission et la publication'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('La version actuellement publiée sera archivée.'),
    ).toBeInTheDocument();
  });

  it('confirme la publication automatique avec confirmerPublication=true', () => {
    const { mutate } = renderActions({
      role: 'GESTIONNAIRE',
      statut: 'PRET_POUR_VALIDATION',
      avertissementsNonAcceptes: 0,
      publicationRequise: false,
    });
    fireEvent.click(screen.getByText('Soumettre'));
    // Le bouton d'action porte aussi le libellé de confirmation : on cible
    // celui de la modale.
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByText('Oui, soumettre'));
    expect(mutate).toHaveBeenCalledWith({
      action: 'SOUMETTRE',
      confirmerPublication: true,
    });
  });

  it('n’affiche pas la mention d’archivage quand la publication est requise', () => {
    renderActions({
      role: 'GESTIONNAIRE',
      statut: 'PRET_POUR_VALIDATION',
      avertissementsNonAcceptes: 2,
      publicationRequise: true,
    });
    fireEvent.click(screen.getByText('Soumettre'));
    expect(screen.getByText('Confirmer la soumission')).toBeInTheDocument();
    expect(
      screen.queryByText('La version actuellement publiée sera archivée.'),
    ).not.toBeInTheDocument();
  });
});
