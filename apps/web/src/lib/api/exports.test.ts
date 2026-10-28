// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du client API exports
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchExportViews,
  fetchExportStyles,
  createExportJob,
  fetchExportJobs,
  fetchExportJobById,
  fetchExportDownloadUrl,
} from './exports';
import { apiFetch } from './client';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('fetchExportViews', () => {
  it('GET /export-views avec params', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: 'v1', code: 'GRP', viewVersion: 1, libelle: 'Groupe A1', vue: 'groupe', format: 'PDF', config: {}, actif: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ],
      }),
    } as Response);

    const result = await fetchExportViews({ page: 1, actif: true });

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-views?page=1&actif=true');
    expect(result).toHaveLength(1);
    expect(result[0].libelle).toBe('Groupe A1');
  });

  it('GET /export-views sans params', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    } as Response);

    const result = await fetchExportViews();

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-views');
    expect(result).toEqual([]);
  });
});

describe('fetchExportStyles', () => {
  it('GET /export-styles avec params', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: 's1', code: 'STYLE1', styleVersion: 1, libelle: 'Standard', config: {}, actif: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ],
      }),
    } as Response);

    const result = await fetchExportStyles({ actif: true });

    expect(mockedApiFetch).toHaveBeenCalledWith('/export-styles?actif=true');
    expect(result).toHaveLength(1);
  });
});

describe('createExportJob', () => {
  it('POST /exports avec payload complet', async () => {
    const dto = {
      versionId: 'ver-1',
      styleId: 'style-1',
      viewId: 'view-1',
      format: 'PDF' as const,
      mode: 'BROUILLON' as const,
      grille: 'NORMALE' as const,
      parametres: { departementIds: ['DEP-01'] },
    };
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'job-1',
        versionId: 'ver-1',
        styleId: 'style-1',
        viewId: 'view-1',
        auteurId: 'user-1',
        format: 'PDF',
        mode: 'BROUILLON',
        grille: 'NORMALE',
        parametres: { departementIds: ['DEP-01'] },
        statut: 'QUEUED',
        createdAt: '2026-01-01T00:00:00Z',
      }),
    } as Response);

    const result = await createExportJob(dto);

    expect(mockedApiFetch).toHaveBeenCalledWith('/exports', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    expect(result.id).toBe('job-1');
    expect(result.statut).toBe('QUEUED');
  });
});

describe('fetchExportJobs', () => {
  it('GET /exports avec filtres', async () => {
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

    const result = await fetchExportJobs({ statut: 'DONE', format: 'PDF' });

    expect(mockedApiFetch).toHaveBeenCalledWith('/exports?statut=DONE&format=PDF');
    expect(result.total).toBe(0);
  });
});

describe('fetchExportJobById', () => {
  it('GET /exports/:id', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'job-1',
        statut: 'DONE',
        createdAt: '2026-01-01T00:00:00Z',
      }),
    } as Response);

    const result = await fetchExportJobById('job-1');

    expect(mockedApiFetch).toHaveBeenCalledWith('/exports/job-1');
    expect(result.id).toBe('job-1');
    expect(result.statut).toBe('DONE');
  });
});

describe('fetchExportDownloadUrl', () => {
  it('GET /exports/:id/download retourne { downloadUrl, expiresIn }', async () => {
    mockedApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        downloadUrl: '/filestore/exports/job-1.pdf?token=abc',
        expiresIn: 3600,
      }),
    } as Response);

    const result = await fetchExportDownloadUrl('job-1');

    expect(mockedApiFetch).toHaveBeenCalledWith('/exports/job-1/download');
    expect(result.downloadUrl).toContain('/filestore/');
    expect(result.expiresIn).toBe(3600);
  });
});