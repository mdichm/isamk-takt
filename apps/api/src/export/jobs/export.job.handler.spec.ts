// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du worker d'export pg-boss (L6-04)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportJobHandler } from './export.job.handler.js';
import { ExportService } from '../export.service.js';
import { FilestoreService } from '../../filestore/filestore.service.js';
import type { PgBoss as PgBossType } from 'pg-boss';

const mockExportService = {
  complete: vi.fn(),
  fail: vi.fn(),
};

const mockFilestore = {
  storeFile: vi.fn(),
};

const mockBoss = {
  subscribe: vi.fn(),
  send: vi.fn(),
};

function makeHandler() {
  return new ExportJobHandler(
    mockBoss as never,
    mockExportService as never,
    mockFilestore as never,
  );
}

describe('ExportJobHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('devrait souscrire à la file pg-boss export', async () => {
      const handler = makeHandler();
      mockBoss.subscribe.mockResolvedValue(undefined);

      await handler.onModuleInit();

      expect(mockBoss.subscribe).toHaveBeenCalledWith(
        'export',
        expect.any(Function),
      );
    });
  });

  describe('processJob', () => {
    it('devrait stocker un fichier placeholder et marquer le job DONE', async () => {
      mockFilestore.storeFile.mockReturnValue({
        storageKey: 'abc/export-job-1.txt',
        sha256: 'hash123',
        size: 100,
      });
      mockExportService.complete.mockResolvedValue(undefined);

      const handler = makeHandler();
      // @ts-ignore - méthode privée appelée via le souscripteur dans onModuleInit
      await (handler as any).processJob('job-1');

      expect(mockFilestore.storeFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'export-job-1.txt',
      );
      expect(mockExportService.complete).toHaveBeenCalledWith(
        'job-1',
        'abc/export-job-1.txt',
        'hash123',
      );
    });

    it('devrait marquer le job FAILED en cas derreur', async () => {
      const error = new Error('rendu impossible');
      mockFilestore.storeFile.mockImplementation(() => {
        throw error;
      });
      mockExportService.fail.mockResolvedValue(undefined);

      const handler = makeHandler();
      await (handler as any).processJob('job-1');

      expect(mockExportService.fail).toHaveBeenCalledWith('job-1', 'rendu impossible');
    });
  });
});
