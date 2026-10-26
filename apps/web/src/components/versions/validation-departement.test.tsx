import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ValidationDepartement } from './validation-departement';

vi.mock('@/hooks/use-validation-departement', () => ({
  useUserDepartment: vi.fn(),
  useImpact: vi.fn(),
  useSubmitValidation: vi.fn(),
}));
vi.mock('@/hooks/use-version', () => ({
  useVersion: vi.fn(),
}));

import {
  useImpact,
  useSubmitValidation,
  useUserDepartment,
} from '@/hooks/use-validation-departement';
import { useVersion } from '@/hooks/use-version';

const mockUseUserDepartment = vi.mocked(useUserDepartment);
const mockUseImpact = vi.mocked(useImpact);
const mockUseSubmitValidation = vi.mocked(useSubmitValidation);
const mockUseVersion = vi.mocked(useVersion);

function renderValidation(overrides: {
  validationPlanningRequise?: boolean;
  role?: string;
} = {}) {
  mockUseUserDepartment.mockReturnValue({
    data: { departments: ['dep-1'], role: 'RESPONSABLE_DEPARTEMENT' },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useUserDepartment>);
  mockUseImpact.mockReturnValue({
    data: {
      versionId: 'v-1',
      departements: [
        {
          departementId: 'dep-1',
          departementLibelle: 'Informatique',
          statut: 'IMPACTE',
          reportee: false,
        },
      ],
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useImpact>);
  mockUseSubmitValidation.mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useSubmitValidation>);
  // L5-19 : circuit figé de la version.
  mockUseVersion.mockReturnValue({
    data: {
      id: 'v-1',
      semestreId: 's-1',
      numero: '1.0',
      statut: 'EN_VALIDATION',
      circuit: {
        validationPlanningRequise:
          overrides.validationPlanningRequise ?? true,
        publicationRequise: true,
      },
      createdAt: '2026-10-26T08:00:00.000Z',
      updatedAt: '2026-10-26T08:00:00.000Z',
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useVersion>);

  return render(<ValidationDepartement versionId="v-1" />);
}

describe('ValidationDepartement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    document.body.innerHTML = '';
  });

  it('propose les actions de validation quand la validation est requise', () => {
    renderValidation({ validationPlanningRequise: true });
    expect(screen.getByRole('button', { name: 'Approuver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rejeter' })).toBeInTheDocument();
    expect(
      screen.queryByText('Validation du planning non requise'),
    ).not.toBeInTheDocument();
  });

  it('ne propose aucune action quand la validation n’est pas requise (L5-19)', () => {
    renderValidation({ validationPlanningRequise: false });
    expect(
      screen.queryByRole('button', { name: 'Approuver' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Rejeter' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Validation du planning non requise'),
    ).toBeInTheDocument();
  });
});
