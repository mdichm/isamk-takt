// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de génération CSV des charges (L6-08)
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ExportCsvService } from './export.csv.service.js';
import { ExportFormat } from '@takt/db';

const mockPrisma = {
  exportJob: {
    findUnique: vi.fn(),
  },
  versionSnapshot: {
    findFirst: vi.fn(),
  },
  snapshotCharge: {
    findMany: vi.fn(),
  },
  enseignant: {
    findMany: vi.fn(),
  },
};

describe('ExportCsvService', () => {
  let service: ExportCsvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportCsvService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExportCsvService>(ExportCsvService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCsvForJob', () => {
    const jobId = 'job-csv-123';
    const jobData = {
      id: jobId,
      format: 'CSV' as ExportFormat,
      versionId: 'version-1',
      parametres: { departementIds: ['dep-1'] },
      createdAt: new Date('2024-10-28T00:00:00Z'),
      version: { id: 'version-1', numero: '2.0' },
    };

    beforeEach(() => {
      mockPrisma.exportJob.findUnique.mockResolvedValue(jobData);
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockPrisma.exportJob.findUnique.mockResolvedValue(null);
      await expect(
        service.generateCsvForJob('inexistant'),
      ).rejects.toThrow('ExportJob introuvable : inexistant');
    });

    it('should throw NotFoundException when no snapshot exists for version', async () => {
      mockPrisma.versionSnapshot.findFirst.mockResolvedValue(null);
      await expect(
        service.generateCsvForJob(jobId),
      ).rejects.toThrow(
        'Aucun snapshot trouvé pour la version version-1',
      );
    });

    it('should generate a valid CSV buffer with charges data', async () => {
      mockPrisma.versionSnapshot.findFirst.mockResolvedValue({
        snapshot: { id: 'snapshot-1' },
      });
      mockPrisma.snapshotCharge.findMany.mockResolvedValue([
        {
          id: 'sc-1',
          enseignantId: 'ens-1',
          volumeBrut: 1200, // 20 h
          chargeCalculee: 900, // 15 h
          chargeReference: 1080, // 18 h
          decharges: 120, // 2 h
          serviceDu: 960, // 16 h
          ecart: -180, // -3 h
          heuresSup: 0,
        },
      ]);
      mockPrisma.enseignant.findMany.mockResolvedValue([
        {
          id: 'ens-1',
          nom: 'Dupont',
          prenom: 'Jean',
          matricule: 'MAT-001',
          departementId: 'dep-1',
          departement: { id: 'dep-1', code: 'DEP1', libelle: 'Mathématiques' },
        },
      ]);

      const result = await service.generateCsvForJob(jobId);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/^charges-2\.0-\d{8}\.csv$/);

      const csvContent = result.buffer.toString('utf-8');
      const lines = csvContent.split('\r\n');
      expect(lines.length).toBe(2); // header + 1 data row
      expect(lines[0]).toContain('Enseignant');
      expect(lines[0]).toContain('Matricule');
      expect(lines[0]).toContain('Département');
      expect(lines[0]).toContain('Volume brut (h)');
      expect(lines[1]).toContain('Jean Dupont');
      expect(lines[1]).toContain('MAT-001');
      expect(lines[1]).toContain('Mathématiques');
      expect(lines[1]).toContain('20.00');
      expect(lines[1]).toContain('15.00');
      expect(lines[1]).toContain('18.00');
      expect(lines[1]).toContain('NON'); // heuresSup = 0
      expect(lines[1]).toContain('NON'); // ecart < 0 => plafond non dépassé

      expect(mockPrisma.exportJob.findUnique).toHaveBeenCalledWith({
        where: { id: jobId },
        include: { version: { select: { id: true, numero: true } } },
      });
      expect(mockPrisma.snapshotCharge.findMany).toHaveBeenCalledWith({
        where: { snapshotId: 'snapshot-1' },
        orderBy: { enseignantId: 'asc' },
      });
      expect(mockPrisma.enseignant.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['ens-1'] } },
        include: { departement: true },
      });
    });

    it('should generate CSV without departement filter when none specified', async () => {
      mockPrisma.versionSnapshot.findFirst.mockResolvedValue({
        snapshot: { id: 'snapshot-1' },
      });
      mockPrisma.snapshotCharge.findMany.mockResolvedValue([]);
      mockPrisma.enseignant.findMany.mockResolvedValue([]);

      const jobWithoutDep = { ...jobData, parametres: {} };
      mockPrisma.exportJob.findUnique.mockResolvedValue(jobWithoutDep);

      await service.generateCsvForJob(jobId);

      expect(mockPrisma.snapshotCharge.findMany).toHaveBeenCalledWith({
        where: { snapshotId: 'snapshot-1' },
        orderBy: { enseignantId: 'asc' },
      });
    });

    it('should return empty CSV when no charges found', async () => {
      mockPrisma.versionSnapshot.findFirst.mockResolvedValue({
        snapshot: { id: 'snapshot-1' },
      });
      mockPrisma.snapshotCharge.findMany.mockResolvedValue([]);

      const result = await service.generateCsvForJob(jobId);

      expect(result.buffer).toBeInstanceOf(Buffer);
      const csvContent = result.buffer.toString('utf-8');
      expect(csvContent).toContain('Aucune donnée à exporter');
    });
  });
});
