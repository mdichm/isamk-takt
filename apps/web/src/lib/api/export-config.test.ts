// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du client API export-config
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchExportStyles,
  fetchExportStyleById,
  createExportStyle,
  updateExportStyle,
  deleteExportStyle,
  fetchExportViews,
  fetchExportViewById,
  createExportView,
  updateExportView,
  deleteExportView,
} from './export-config';
import { apiFetch } from './client';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('fetchExportStyles', () => {
  it('GET /export-styles avec params', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 's1',
            code: 'DEFAULT',
            styleVersion: 1,
            libelle: 'Style par défaut',
            config: {},
            actif: true,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    } as Response);

    const result = await fetchExportStyles({ page: 1, actif: true });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/export-styles?page=1&actif=true',
    );
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].libelle).toBe('Style par défaut');
  });

  it('GET /export-styles sans params', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      }),
    } as Response);

    const result = await fetchExportStyles();

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-styles');
    expect(result.data).toEqual([]);
  });
});

describe('fetchExportStyleById', () => {
  it('GET /export-styles/:id', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 's1',
        code: 'DEFAULT',
        styleVersion: 1,
        libelle: 'Style par défaut',
        config: {},
        actif: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    } as Response);

    const result = await fetchExportStyleById('s1');

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-styles/s1');
    expect(result.id).toBe('s1');
    expect(result.styleVersion).toBe(1);
  });
});

describe('createExportStyle', () => {
  it('POST /export-styles avec payload complet', async () => {
    const dto = {
      code: 'DEFAULT',
      styleVersion: 1,
      libelle: 'Style par défaut',
      config: { orientation: 'portrait', format: 'A4' },
      actif: true,
    };
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 's1',
        code: 'DEFAULT',
        styleVersion: 1,
        libelle: 'Style par défaut',
        config: { orientation: 'portrait', format: 'A4' },
        actif: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    } as Response);

    const result = await createExportStyle(dto);

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-styles', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    expect(result.id).toBe('s1');
    expect(result.libelle).toBe('Style par défaut');
  });
});

describe('updateExportStyle', () => {
  it('PATCH /export-styles/:id non utilisé → 200 modifié', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 's1',
        code: 'DEFAULT',
        styleVersion: 1,
        libelle: 'Style modifié',
        config: {},
        actif: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      }),
    } as Response);

    const result = await updateExportStyle('s1', { libelle: 'Style modifié' });

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-styles/s1', {
      method: 'PATCH',
      body: JSON.stringify({ libelle: 'Style modifié' }),
    });
    expect(result.libelle).toBe('Style modifié');
  });

  it('PATCH /export-styles/:id utilisé → 200 nouvelle version (styleVersion +1)', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 's2',
        code: 'DEFAULT',
        styleVersion: 2,
        libelle: 'Style par défaut',
        config: {},
        actif: true,
        utiliseLe: '2026-01-15T00:00:00Z',
        createdAt: '2026-01-16T00:00:00Z',
        updatedAt: '2026-01-16T00:00:00Z',
      }),
    } as Response);

    const result = await updateExportStyle('s1', { libelle: 'Style v2' });

    expect(result.styleVersion).toBe(2);
    expect(result.id).toBe('s2');
  });
});

describe('deleteExportStyle', () => {
  it('DELETE /export-styles/:id non utilisé → 204', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    } as Response);

    await deleteExportStyle('s1');

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-styles/s1', {
      method: 'DELETE',
    });
  });

describe('fetchExportViews', () => {
  it('GET /export-views avec params', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'v1',
            code: 'GROUPE',
            viewVersion: 1,
            libelle: 'Vue Groupe',
            vue: 'groupe',
            format: 'PDF',
            config: {},
            actif: true,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    } as Response);

    const result = await fetchExportViews({ page: 1, code: 'GRP' });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/export-views?page=1&code=GRP',
    );
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].vue).toBe('groupe');
  });
});

describe('fetchExportViewById', () => {
  it('GET /export-views/:id', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'v1',
        code: 'GROUPE',
        viewVersion: 1,
        libelle: 'Vue Groupe',
        vue: 'groupe',
        format: 'PDF',
        config: {},
        actif: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    } as Response);

    const result = await fetchExportViewById('v1');

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-views/v1');
    expect(result.id).toBe('v1');
    expect(result.viewVersion).toBe(1);
  });
});

describe('createExportView', () => {
  it('POST /export-views avec payload complet', async () => {
    const dto = {
      code: 'GROUPE',
      viewVersion: 1,
      libelle: 'Vue Groupe',
      vue: 'groupe',
      format: 'PDF' as const,
      config: { colonnes: ['nom', 'effectif'] },
      actif: true,
    };
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'v1',
        code: 'GROUPE',
        viewVersion: 1,
        libelle: 'Vue Groupe',
        vue: 'groupe',
        format: 'PDF',
        config: { colonnes: ['nom', 'effectif'] },
        actif: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    } as Response);

    const result = await createExportView(dto);

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-views', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    expect(result.id).toBe('v1');
    expect(result.vue).toBe('groupe');
  });
});

describe('updateExportView', () => {
  it('PATCH /export-views/:id non utilisé → 200 modifié', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'v1',
        code: 'GROUPE',
        viewVersion: 1,
        libelle: 'Vue Groupe modifiée',
        vue: 'groupe',
        format: 'PDF',
        config: {},
        actif: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      }),
    } as Response);

    const result = await updateExportView('v1', {
      libelle: 'Vue Groupe modifiée',
    });

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-views/v1', {
      method: 'PATCH',
      body: JSON.stringify({ libelle: 'Vue Groupe modifiée' }),
    });
    expect(result.libelle).toBe('Vue Groupe modifiée');
  });

  it('PATCH /export-views/:id utilisé → 200 nouvelle version (viewVersion +1)', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'v2',
        code: 'GROUPE',
        viewVersion: 2,
        libelle: 'Vue Groupe',
        vue: 'groupe',
        format: 'PDF',
        config: {},
        actif: true,
        utiliseLe: '2026-01-15T00:00:00Z',
        createdAt: '2026-01-16T00:00:00Z',
        updatedAt: '2026-01-16T00:00:00Z',
      }),
    } as Response);

    const result = await updateExportView('v1', { libelle: 'Vue Groupe v2' });

    expect(result.viewVersion).toBe(2);
    expect(result.id).toBe('v2');
  });
});

describe('deleteExportView', () => {
  it('DELETE /export-views/:id non utilisé → 204', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    } as Response);

    await deleteExportView('v1');

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-views/v1', {
      method: 'DELETE',
    });
  });
});
});