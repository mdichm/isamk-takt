import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { StructureTree } from './structure-tree';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock dnd-kit to avoid ResizeObserver issues
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: ReactNode }) => children,
  PointerSensor: () => ({}),
  KeyboardSensor: () => ({}),
  useSensor: () => ({}),
  useSensors: () => [],
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }) => children,
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    setNodeRef: vi.fn(),
    listeners: {},
  }),
  rectSortingStrategy: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const annee = {
  id: 'annee-1',
  numero: 2026,
  code: '2026-2027',
  nbSemaines: 14,
  statut: 'ACTIVE' as const,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

async function selectionnerAnnee(): Promise<void> {
  await waitFor(() => expect(screen.getByRole('combobox')).toBeEnabled());
  await userEvent.click(screen.getByRole('combobox'));
  await userEvent.click(await screen.findByRole('option', { name: /2026-2027/ }));
}

beforeEach(() => {
  queryClient.clear();
  server.resetHandlers();
  server.use(
    http.get('*/annees', () =>
      HttpResponse.json({ data: [annee], total: 1, page: 1, limit: 100, totalPages: 1 })
    ),
    http.get('*/annees/annee-1/semestres', () =>
      HttpResponse.json({ data: [], total: 0, page: 1, limit: 100, totalPages: 0 })
    )
  );
});

describe('StructureTree component', () => {
  it('passe du chargement aux départements après sélection de l’année', async () => {
    server.use(
      http.get('*/structure/departements', () =>
        HttpResponse.json({ data: [{ id: 'd1', code: 'INFO', libelle: 'Informatique' }], total: 1, page: 1, limit: 10, totalPages: 1 })
      )
    );

    render(<StructureTree />, { wrapper });

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    await selectionnerAnnee();
    await waitFor(() => expect(screen.getByText('Informatique')).toBeInTheDocument());
    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
  });

  it('conserve un état utilisable lorsque le chargement des départements échoue', async () => {
    server.use(
      http.get('*/structure/departements', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      )
    );
    render(<StructureTree />, { wrapper });
    await selectionnerAnnee();

    await waitFor(() => expect(screen.getByText('Aucun département.')).toBeInTheDocument());
    expect(screen.getByText('Structure académique')).toBeInTheDocument();
  });

  it('expose les départements dans une structure de listes', async () => {
    server.use(
      http.get('*/structure/departements', () =>
        HttpResponse.json({ data: [{ id: 'd1', code: 'INFO', libelle: 'Informatique' }], total: 1, page: 1, limit: 10, totalPages: 1 })
      )
    );
    render(<StructureTree />, { wrapper });
    await selectionnerAnnee();

    const item = await screen.findByText('Informatique');
    expect(item.closest('ul')).toBeInTheDocument();
    expect(item.closest('li')).toBeInTheDocument();
  });
});