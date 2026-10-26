import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CircuitParams } from './circuit-params';

vi.mock('@/hooks/use-workflow-params', () => ({
  useWorkflowParams: vi.fn(),
  useUpdateWorkflowParams: vi.fn(),
}));

import {
  useUpdateWorkflowParams,
  useWorkflowParams,
} from '@/hooks/use-workflow-params';

const mockUseWorkflowParams = vi.mocked(useWorkflowParams);
const mockUseUpdateWorkflowParams = vi.mocked(useUpdateWorkflowParams);

const paramsCourants = {
  validationPlanningRequise: true,
  publicationRequise: true,
  updatedAt: '2026-10-26T08:00:00.000Z',
  updatedBy: 'admin-1',
};

function renderCircuitParams(overrides: {
  validationPlanningRequise?: boolean;
  publicationRequise?: boolean;
} = {}) {
  const mutateAsync = vi.fn().mockResolvedValue(paramsCourants);
  mockUseWorkflowParams.mockReturnValue({
    data: {
      ...paramsCourants,
      validationPlanningRequise:
        overrides.validationPlanningRequise ??
        paramsCourants.validationPlanningRequise,
      publicationRequise:
        overrides.publicationRequise ?? paramsCourants.publicationRequise,
    },
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useWorkflowParams>);
  mockUseUpdateWorkflowParams.mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateWorkflowParams>);

  const utils = render(<CircuitParams />);
  return { ...utils, mutateAsync };
}

describe('CircuitParams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    document.body.innerHTML = '';
  });

  it('affiche les deux interrupteurs avec la valeur courante', () => {
    renderCircuitParams({ validationPlanningRequise: false });

    expect(
      screen.getByRole('switch', { name: 'Validation du planning requise' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByRole('switch', { name: 'Publication requise' }),
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('affiche la date et l’auteur de la dernière modification', () => {
    renderCircuitParams();
    expect(
      screen.getByText(/Dernière modification/),
    ).toBeInTheDocument();
    expect(screen.getByText(/admin-1/)).toBeInTheDocument();
  });

  it('enregistre les nouvelles valeurs via PATCH', async () => {
    const { mutateAsync } = renderCircuitParams();

    fireEvent.click(
      screen.getByRole('switch', { name: 'Publication requise' }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Enregistrer les paramètres du workflow',
      }),
    );

    expect(mutateAsync).toHaveBeenCalledWith({
      validationPlanningRequise: true,
      publicationRequise: false,
    });
  });

  it('désactive l’enregistrement quand aucune valeur n’a changé', () => {
    renderCircuitParams();
    expect(
      screen.getByRole('button', {
        name: 'Enregistrer les paramètres du workflow',
      }),
    ).toBeDisabled();
  });
});
