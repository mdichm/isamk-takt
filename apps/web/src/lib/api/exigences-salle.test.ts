import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from './client';
import {
  listExigencesSalle,
  getExigenceSalle,
  createExigenceSalle,
  updateExigenceSalle,
  deleteExigenceSalle,
} from './exigences-salle';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('exigences-salle API', () => {
  it('listExigencesSalle calls apiFetch with query params', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
    } as Response);

    await listExigencesSalle({ page: 2, limit: 5, semestreId: 'sem-1' });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/exigences-salle?page=2&limit=5&semestreId=sem-1',
    );
  });

  it('getExigenceSalle calls apiFetch with id', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'e1' }) } as Response);

    await getExigenceSalle('e1');

    expect(mockedApiFetch).toHaveBeenCalledWith('/exigences-salle/e1');
  });

  it('createExigenceSalle calls apiFetch POST', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'e1' }) } as Response);

    await createExigenceSalle({ semestreId: 's1', affectationKey: 'k', salleImposeeId: 'salle-1' });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/exigences-salle',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ semestreId: 's1', affectationKey: 'k', salleImposeeId: 'salle-1', autorisees: undefined }) }),
    );
  });

  it('updateExigenceSalle calls apiFetch PATCH', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'e1' }) } as Response);

    await updateExigenceSalle('e1', { salleImposeeId: 'salle-2' });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/exigences-salle/e1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ salleImposeeId: 'salle-2', autorisees: undefined }) }),
    );
  });

  it('deleteExigenceSalle calls apiFetch DELETE', async () => {
    mockedApiFetch.mockResolvedValue({ ok: true } as Response);

    await deleteExigenceSalle('e1');

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/exigences-salle/e1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
