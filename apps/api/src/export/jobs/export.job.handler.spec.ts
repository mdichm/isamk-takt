// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du worker d'export pg-boss (L6-04)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportJobHandler } from './export.job.handler.js';
import { ExportService } from '../export.service.js';
import { FilestoreService } from '../../filestore/filestore.service.js';
import { ExportXlsxService } from './export.xlsx.service.js';
import { ExportPdfService } from './export.pdf.service.js';
import { ExportCsvService } from './export.csv.service.js';
import type { PgBoss as PgBossType } from 'pg-boss';

const mockExportService = {
  complete: vi.fn(),
  fail: vi.fn(),
};

const mockFilestore = {
  storeFile: vi.fn(),
};

const mockXlsxService = {
  generateXlsxForJob: vi.fn(),
};

const mockPdfService = {
  generatePdfForJob: vi.fn(),
};

const mockCsvService = {
  generateCsvForJob: vi.fn(),
};

const mockBoss = {
  subscribe: vi.fn(),
  send: vi.fn(),
  createQueue: vi.fn(),
  work: vi.fn(),
};

function makeHandler() {
  return new ExportJobHandler(
    mockBoss as never,
    mockExportService as never,
    mockFilestore as never,
    mockXlsxService as never,
    mockPdfService as never,
    mockCsvService as never,
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
    const baseJobData = {
      exportJobId: 'job-1',
      format: 'TXT',
      mode: 'BROUILLON',
      grille: 'NORMALE',
      avertissementIds: [],
      numeroVersion: '1.0',
      publieLe: null,
    };

    it('devrait stocker un fichier placeholder et marquer le job DONE', async () => {
      mockFilestore.storeFile.mockReturnValue({
        storageKey: 'abc/export-job-1.txt',
        sha256: 'hash123',
        size: 100,
      });
      mockExportService.complete.mockResolvedValue(undefined);

      const handler = makeHandler();
      (handler as any).currentJobData = baseJobData;
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

    it('devrait générer un fichier XLSX via ExportXlsxService quand format=XLSX', async () => {
      mockXlsxService.generateXlsxForJob.mockResolvedValue({
        buffer: Buffer.from('xlsx-content'),
        filename: 'export-2.0-20240115.xlsx',
      });
      mockFilestore.storeFile.mockReturnValue({
        storageKey: 'abc/export-job-1.xlsx',
        sha256: 'hash456',
        size: 2000,
      });
      mockExportService.complete.mockResolvedValue(undefined);

      const handler = makeHandler();
      (handler as any).currentJobData = {
        ...baseJobData,
        format: 'XLSX',
      };
      // @ts-ignore
      await (handler as any).processJob('job-1');

      expect(mockXlsxService.generateXlsxForJob).toHaveBeenCalledWith('job-1');
      expect(mockFilestore.storeFile).toHaveBeenCalledWith(
        Buffer.from('xlsx-content'),
        'export-2.0-20240115.xlsx',
      );
      expect(mockExportService.complete).toHaveBeenCalledWith(
        'job-1',
        'abc/export-job-1.xlsx',
        'hash456',
      );
    });

    it('devrait marquer le job FAILED en cas derreur', async () => {
      const error = new Error('rendu impossible');
      mockFilestore.storeFile.mockImplementation(() => {
        throw error;
      });
      mockExportService.fail.mockResolvedValue(undefined);

      const handler = makeHandler();
      (handler as any).currentJobData = baseJobData;
      await (handler as any).processJob('job-1');

      expect(mockExportService.fail).toHaveBeenCalledWith('job-1', 'rendu impossible');
    });

    it('devrait marquer le job FAILED quand generateXlsxForJob rejette', async () => {
      const error = new Error('xlsx render failed');
      mockXlsxService.generateXlsxForJob.mockRejectedValue(error);
      mockExportService.fail.mockResolvedValue(undefined);

      const handler = makeHandler();
      (handler as any).currentJobData = {
        ...baseJobData,
        format: 'XLSX',
      };
      await (handler as any).processJob('job-1');

      expect(mockExportService.fail).toHaveBeenCalledWith(
        'job-1',
        'xlsx render failed',
      );
    });

    it('devrait générer un PDF via ExportPdfService quand format=PDF', async () => {
      mockPdfService.generatePdfForJob.mockResolvedValue({
        buffer: Buffer.from('pdf-content'),
        filename: 'export-1.0-20240115.pdf',
      });
      mockFilestore.storeFile.mockReturnValue({
        storageKey: 'abc/export-job-1.pdf',
        sha256: 'hash789',
        size: 3000,
      });
      mockExportService.complete.mockResolvedValue(undefined);

      const handler = makeHandler();
      (handler as any).currentJobData = {
        ...baseJobData,
        format: 'PDF',
      };
      await (handler as any).processJob('job-1');

      expect(mockPdfService.generatePdfForJob).toHaveBeenCalledWith('job-1');
      expect(mockFilestore.storeFile).toHaveBeenCalledWith(
        Buffer.from('pdf-content'),
        'export-1.0-20240115.pdf',
      );
      expect(mockExportService.complete).toHaveBeenCalledWith(
        'job-1',
        'abc/export-job-1.pdf',
        'hash789',
      );
    });

    it('devrait générer un CSV via ExportCsvService quand format=CSV', async () => {
      mockCsvService.generateCsvForJob.mockResolvedValue({
        buffer: Buffer.from('csv-content'),
        filename: 'charges-2.0-20241028.csv',
      });
      mockFilestore.storeFile.mockReturnValue({
        storageKey: 'abc/export-job-1.csv',
        sha256: 'hash-csv',
        size: 1500,
      });
      mockExportService.complete.mockResolvedValue(undefined);

      const handler = makeHandler();
      (handler as any).currentJobData = {
        ...baseJobData,
        format: 'CSV',
      };
      await (handler as any).processJob('job-1');

      expect(mockCsvService.generateCsvForJob).toHaveBeenCalledWith('job-1');
      expect(mockFilestore.storeFile).toHaveBeenCalledWith(
        Buffer.from('csv-content'),
        'charges-2.0-20241028.csv',
      );
      expect(mockExportService.complete).toHaveBeenCalledWith(
        'job-1',
        'abc/export-job-1.csv',
        'hash-csv',
      );
    });

    it('devrait marquer le job FAILED quand generateCsvForJob rejette', async () => {
      const error = new Error('csv render failed');
      mockCsvService.generateCsvForJob.mockRejectedValue(error);
      mockExportService.fail.mockResolvedValue(undefined);

      const handler = makeHandler();
      (handler as any).currentJobData = {
        ...baseJobData,
        format: 'CSV',
      };
      await (handler as any).processJob('job-1');

      expect(mockExportService.fail).toHaveBeenCalledWith(
        'job-1',
        'csv render failed',
      );
    });

    it('devrait marquer le job FAILED quand generatePdfForJob rejette', async () => {
      const error = new Error('pdf render failed');
      mockPdfService.generatePdfForJob.mockRejectedValue(error);
      mockExportService.fail.mockResolvedValue(undefined);

      const handler = makeHandler();
      (handler as any).currentJobData = {
        ...baseJobData,
        format: 'PDF',
      };
      await (handler as any).processJob('job-1');

      expect(mockExportService.fail).toHaveBeenCalledWith(
        'job-1',
        'pdf render failed',
      );
    });
  });
});
