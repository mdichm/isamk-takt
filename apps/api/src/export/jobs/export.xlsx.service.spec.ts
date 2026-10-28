// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de génération XLSX (L6-06)
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ExportXlsxService } from './export.xlsx.service.js';
import * as XLSX from 'xlsx';
import { ExportFormat, VersionStatut } from '@takt/db';

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

describe('ExportXlsxService', () => {
  let service: ExportXlsxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportXlsxService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExportXlsxService>(ExportXlsxService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateXlsxForJob', () => {
    const jobId = 'job-123';
    const jobData = {
      id: jobId,
      mode: 'OFFICIEL',
      grille: 'NORMALE',
      avertissementIds: [],
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
        format: 'XLSX' as ExportFormat,
        config: {
          colonnes: ['Jour', 'Créneau', 'Groupe', 'Enseignant', 'Salle', 'Module'],
          feuilles: ['Export'],
          regroupements: [],
        },
      },
    };

    beforeEach(() => {
      mockPrisma.exportJob.findUnique.mockResolvedValue(jobData);
      mockPrisma.seance.findMany.mockResolvedValue([]);
      mockPrisma.creneauAffichage.findMany.mockResolvedValue([]);
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockPrisma.exportJob.findUnique.mockResolvedValue(null);
      await expect(service.generateXlsxForJob('inexistant')).rejects.toThrow(
        'ExportJob introuvable : inexistant',
      );
    });

    it('should generate a valid XLSX buffer for an official export without seances', async () => {
      const result = await service.generateXlsxForJob(jobId);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/^export-2\.0-\d{8}\.xlsx$/);
      expect(mockPrisma.exportJob.findUnique).toHaveBeenCalledWith({
        where: { id: jobId },
        include: {
          version: {
            select: {
              id: true,
              numero: true,
              statut: true,
              publieLe: true,
              grilleFigée: true,
              semestreId: true,
            },
          },
          style: {
            select: { id: true, code: true, libelle: true, config: true },
          },
          view: {
            select: {
              id: true,
              code: true,
              libelle: true,
              vue: true,
              format: true,
              config: true,
            },
          },
        },
      });
    });

    it('should include BROUILLON watermark for brouillon mode', async () => {
      mockPrisma.exportJob.findUnique.mockResolvedValue({
        ...jobData,
        mode: 'BROUILLON',
      });
      const result = await service.generateXlsxForJob(jobId);

      const workbook = XLSX.read(result.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Vérifier que le texte BROUILLON apparaît quelque part dans la feuille
      const cellValues = Object.values(sheet)
        .filter((v: any) => typeof v === 'object' && v !== null && 'v' in v)
        .map((v: any) => v.v);
      const brouillonFound = cellValues.some((v: string) =>
        typeof v === 'string' && v.includes('BROUILLON'),
      );
      expect(brouillonFound).toBe(true);
    });

    it('should use Ramadan display hours when grille is RAMADAN', async () => {
      mockPrisma.exportJob.findUnique.mockResolvedValue({
        ...jobData,
        grille: 'RAMADAN',
        version: {
          ...jobData.version,
          grilleFigée: 'RAMADAN',
        },
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
      mockPrisma.seance.findMany.mockResolvedValue([
        {
          id: 'seance-1',
          jour: 'LUNDI',
          creneauDebutId: 'creneau-1',
          creneauDebut: {
            id: 'creneau-1',
            jour: 'LUNDI',
            ordre: 1,
            heureDebut: new Date('2024-01-01T08:00:00Z'),
            heureFin: new Date('2024-01-01T09:00:00Z'),
            estPause: false,
          },
          nbCreneaux: 1,
          enseignantId: 'ens-1',
          salleId: null,
          tag: 'MATH',
          groupes: [{ groupeId: 'G1' }],
        },
      ]);

      const result = await service.generateXlsxForJob(jobId);

      const workbook = XLSX.read(result.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Le créneau Ramadan (09:00 – 12:00) doit remplacer le créneau normal (08:00 – 09:00)
      const cellValues = Object.values(sheet)
        .filter((v: any) => typeof v === 'object' && v !== null && 'v' in v)
        .map((v: any) => v.v);
      const ramadanFound = cellValues.some((v: string) =>
        typeof v === 'string' && v.includes('09:00'),
      );
      expect(ramadanFound).toBe(true);
    });
  });

  describe('generateXlsx', () => {
    it('should produce a non-empty buffer with correct sheet count', () => {
      const input = {
        job: {
          exportJobId: 'job-1',
          mode: 'OFFICIEL',
          grille: 'NORMALE',
          avertissementIds: ['warn-1'],
          numeroVersion: '1.0',
          publieLe: '2024-01-15T10:00:00Z',
        },
        version: {
          id: 'v1',
          numero: '1.0',
          statut: 'PUBLIEE' as VersionStatut,
          publieLe: new Date('2024-01-15T10:00:00Z'),
          grilleFigée: null,
          semestreId: 'sem-1',
        },
        style: {
          id: 's1',
          code: 'DEFAULT',
          libelle: 'Défaut',
          config: {},
        },
        view: {
          id: 'vw1',
          code: 'GLOBAL',
          libelle: 'Globale',
          vue: 'global',
          format: 'XLSX' as ExportFormat,
          config: {
            colonnes: ['Jour', 'Créneau', 'Groupe'],
            feuilles: ['Feuille1', 'Feuille2'],
            regroupements: [],
          },
        },
        seances: [],
        creneauxAffichage: [],
      };

      const result = service.generateXlsx(input);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toMatch(/^export-1\.0-\d{8}\.xlsx$/);

      const workbook = XLSX.read(result.buffer, { type: 'buffer' });
      expect(workbook.SheetNames.length).toBe(2);
      expect(workbook.SheetNames).toContain('Feuille1');
      expect(workbook.SheetNames).toContain('Feuille2');
    });
  });
});
