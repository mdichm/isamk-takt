import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StructureTree } from './structure-tree';

// Mock all hooks used by StructureTree
vi.mock('@/hooks/use-structure', () => ({
  useDepartements: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateDepartement: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateDepartement: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteDepartement: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useReorderDepartements: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false })),
  useFormations: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateFormation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateFormation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteFormation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useReorderFormations: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false })),
  useNiveaux: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateNiveau: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateNiveau: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteNiveau: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useReorderNiveaux: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false })),
  useGroupes: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateGroupe: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateGroupe: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteGroupe: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useReorderGroupes: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false })),
  useAnnees: vi.fn(() => ({ data: [], isLoading: false })),
  useSemestres: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/lib/api/annees', () => ({
  findAllAnnees: vi.fn(),
  findAllSemestres: vi.fn(),
}));

describe('StructureTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<StructureTree />);
    expect(screen.getByText('Structure académique')).toBeInTheDocument();
  });

  it('should show "Aucun département" when no departements', () => {
    render(<StructureTree />);
    const elements = screen.getAllByText('Aucun département.');
    expect(elements.length).toBeGreaterThan(0);
  });
});