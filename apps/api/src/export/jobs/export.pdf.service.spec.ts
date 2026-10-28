// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de génération PDF (L6-07)
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ExportPdfService, GeneratePdfInput } from './export.pdf.service.js';
import { ExportFormat, VersionStatut } from '@takt/db';
import { chromium } from 'playwright';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

const mockPrisma = {
  exportJob: {
    findUnique: vi.fn(),
  },
  seance: {
    findMany: vi.fn(),
  },
  creneauAffichage: {
    findMany: vi.fn(),
  },
};

const mockGeneratePdf = vi.fn();

describe('ExportPdfService', () => {
  let service: ExportPdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportPdfService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExportPdfService>(ExportPdfService);
    vi.clearAllMocks();
  });

  describe('generatePdfForJob', () => {
    const jobId = 'job-123';
    const jobData = {
      id: jobId,
      mode: 'OFFICIEL',
      grille: 'NORMALE',
      avertissementIds: [],
      format: 'PDF' as const,
      version: {
        id: 'version-1',
        numero: '2.0',
        statut: 'PUBLIEE' as VersionStatut,
        publieLe: new Date('2024-01-15T10:00:00Z'),
        grilleFigée: null,
        semestreId: 'sem-1',
      },
      style: {
        id: 'style-1',
        code: 'DEFAULT',
        libelle: 'Style par défaut',
        config: {},
      },
      view: {
        id: 'view-1',
        code: 'GLOBAL',
        libelle: 'Vue globale',
        vue: 'global',
        format: 'PDF' as ExportFormat,
        config: {
          colonnes: ['Jour', 'Créneau', 'Groupe', 'Enseignant', 'Salle', 'Module'],
        },
      },
    };

    beforeEach(() => {
      mockPrisma.exportJob.findUnique.mockResolvedValue(jobData);
      mockPrisma.seance.findMany.mockResolvedValue([]);
      mockPrisma.creneauAffichage.findMany.mockResolvedValue([]);
      vi.spyOn(service, 'generatePdf').mockImplementation(mockGeneratePdf);
      mockGeneratePdf.mockResolvedValue({
        buffer: Buffer.from('fake-pdf-content'),
        filename: 'export-2.0-20240115.pdf',
      });
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockPrisma.exportJob.findUnique.mockResolvedValue(null);
      await expect(service.generatePdfForJob('inexistant')).rejects.toThrow(
        'ExportJob introuvable : inexistant',
      );
    });

    it('should load job, version, style, view, seances and call generatePdf', async () => {
      const result = await service.generatePdfForJob(jobId);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/^export-2\.0-\d{8}\.pdf$/);
      expect(mockGeneratePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          job: expect.objectContaining({
            exportJobId: jobId,
            format: 'PDF',
            mode: 'OFFICIEL',
            grille: 'NORMALE',
            numeroVersion: '2.0',
          }),
          version: expect.objectContaining({
            id: 'version-1',
            numero: '2.0',
            statut: 'PUBLIEE',
          }),
          style: expect.objectContaining({ id: 'style-1', code: 'DEFAULT' }),
          view: expect.objectContaining({ id: 'view-1', code: 'GLOBAL' }),
          seances: [],
          creneauxAffichage: [],
        }),
      );
    });

    it('should load creneauxAffichage when grille is RAMADAN', async () => {
      mockPrisma.exportJob.findUnique.mockResolvedValue({
        ...jobData,
        grille: 'RAMADAN',
      });
      mockPrisma.creneauAffichage.findMany.mockResolvedValue([
        {
          id: 'aff-1',
          creneauId: 'creneau-1',
          grille: 'RAMADAN',
          heureDebut: new Date('2024-01-01T09:00:00Z'),
          heureFin: new Date('2024-01-01T12:00:00Z'),
          creneau: {
            id: 'creneau-1',
            jour: 'LUNDI',
            ordre: 1,
          },
        },
      ]);

      await service.generatePdfForJob(jobId);

      expect(mockPrisma.creneauAffichage.findMany).toHaveBeenCalledWith({
        where: { versionId: 'version-1', grille: 'RAMADAN' },
        include: { creneau: { select: { id: true, jour: true, ordre: true } } },
      });
      expect(mockGeneratePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          creneauxAffichage: expect.arrayContaining([
            expect.objectContaining({ id: 'aff-1', grille: 'RAMADAN' }),
          ]),
        }),
      );
    });

    it('should propagate errors from generatePdf', async () => {
      const error = new Error('pdf render failed');
      mockGeneratePdf.mockRejectedValue(error);

      await expect(service.generatePdfForJob(jobId)).rejects.toThrow(
        'pdf render failed',
      );
    });

  });

  describe('generatePdf', () => {
    const baseInput: GeneratePdfInput = {
      job: {
        exportJobId: 'job-1',
        format: 'PDF',
        mode: 'BROUILLON',
        grille: 'NORMALE',
        avertissementIds: [],
        numeroVersion: '1.0',
        publieLe: null,
      },
      version: {
        id: 'v1',
        numero: '1.0',
        statut: 'PUBLIEE' as VersionStatut,
        publieLe: null,
        grilleFigée: null,
        semestreId: 'sem-1',
      },
      style: {
        id: 's1',
        code: 'DEFAULT',
        libelle: 'Défaut',
        config: { format: 'A4' as const, orientation: 'portrait' as const },
      },
      view: {
        id: 'vw1',
        code: 'GLOBAL',
        libelle: 'Globale',
        vue: 'global',
        format: 'PDF' as ExportFormat,
        config: { colonnes: ['Jour', 'Créneau'] },
      },
      seances: [],
      creneauxAffichage: [],
    };

    beforeEach(() => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(
          Buffer.from('<html><body>BROUILLON watermark</body></html>'),
        ),
      };
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);
      (service as any)._mockPage = mockPage;
    });

    it('should produce a non-empty PDF buffer with correct filename', async () => {
      const result = await service.generatePdf(baseInput);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toMatch(/^export-1\.0-\d{8}\.pdf$/);
      expect(vi.mocked(chromium.launch)).toHaveBeenCalledTimes(1);
      expect((service as any)._mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'A4',
          landscape: false,
          printBackground: true,
        }),
      );
    });

    it('should use A3 format and landscape when style config says so', async () => {
      const input: GeneratePdfInput = {
        ...baseInput,
        style: {
          ...baseInput.style,
          config: { format: 'A3' as const, orientation: 'landscape' as const },
        },
      };

      const result = await service.generatePdf(input);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/^export-1\.0-\d{8}\.pdf$/);
      expect((service as any)._mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'A3',
          landscape: true,
        }),
      );
    });

    it('should include watermark text for BROUILLON mode', async () => {
      const result = await service.generatePdf(baseInput);
      const html = result.buffer.toString('utf-8');
      expect(html).toContain('BROUILLON');
    });

    it('should not include watermark div for OFFICIEL mode', async () => {
      const input: GeneratePdfInput = {
        ...baseInput,
        job: { ...baseInput.job, mode: 'OFFICIEL' },
      };
      const result = await service.generatePdf(input);
      const html = result.buffer.toString('utf-8');
      expect(html).not.toContain('class="watermark"');
    });
  });
});
