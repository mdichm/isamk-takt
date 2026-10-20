import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  API_BASE: 'http://localhost:3000',
}));

import { apiFetch } from './client';
import {
  findModuleVolumes,
  createModuleVolume,
  updateModuleVolume,
  deleteModuleVolume,
} from './volumes';

describe('volumes API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findModuleVolumes', () => {
    it('should GET volumes for a module with query params', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({
        data: [], total: 0, page: 1, limit: 10, totalPages: 0,
      }), { status: 200 }));

      await findModuleVolumes('m-1', { page: 2, limit: 5 });

      expect(apiFetch).toHaveBeenCalledWith('/modules/m-1/volumes?page=2&limit=5');
    });

    it('should GET volumes without query params', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({
        data: [], total: 0, page: 1, limit: 10, totalPages: 0,
      }), { status: 200 }));

      await findModuleVolumes('m-1');

      expect(apiFetch).toHaveBeenCalledWith('/modules/m-1/volumes?');
    });
  });

  describe('createModuleVolume', () => {
    it('should POST the volume', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({
        id: 'v-1', moduleId: 'm-1', type: 'CM', volume: 90,
        createdAt: '', updatedAt: '',
      }), { status: 201 }));

      await createModuleVolume({ moduleId: 'm-1', type: 'CM', volume: 90 });

      expect(apiFetch).toHaveBeenCalledWith('/modules/m-1/volumes', {
        method: 'POST',
        body: JSON.stringify({ moduleId: 'm-1', type: 'CM', volume: 90 }),
      });
    });
  });

  describe('updateModuleVolume', () => {
    it('should PATCH the volume', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({
        id: 'v-1', moduleId: 'm-1', type: 'CM', volume: 120,
        createdAt: '', updatedAt: '',
      }), { status: 200 }));

      await updateModuleVolume('m-1', 'v-1', { volume: 120 });

      expect(apiFetch).toHaveBeenCalledWith('/modules/m-1/volumes/v-1', {
        method: 'PATCH',
        body: JSON.stringify({ volume: 120 }),
      });
    });
  });

  describe('deleteModuleVolume', () => {
    it('should DELETE by id', async () => {
      vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));

      await deleteModuleVolume('m-1', 'v-1');

      expect(apiFetch).toHaveBeenCalledWith('/modules/m-1/volumes/v-1', {
        method: 'DELETE',
      });
    });
  });
});
