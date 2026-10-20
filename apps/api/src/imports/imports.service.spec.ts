// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service d'import CSV/XLSX (L1-26)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportsService } from './imports.service.js';
import { ImportEntity, ImportCsvDto } from './dto/import-csv.dto.js';

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('ImportsService', () => {
  let service: ImportsService;
  let prisma: any;
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const anneeId = '550e8400-e29b-41d4-a716-446655440001';
  const departementId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      enseignant: { findFirst: vi.fn(), create: vi.fn() },
      salle: { findFirst: vi.fn(), create: vi.fn() },
      groupe: { findFirst: vi.fn(), create: vi.fn() },
      module: { findFirst: vi.fn(), create: vi.fn() },
    };

    audit = {
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    service = new (ImportsService as any)(prisma, audit);
  });

  function makeFile(buffer: Buffer, originalname: string): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname,
      encoding: '7bit',
      mimetype: originalname.endsWith('.xlsx')
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv',
      size: buffer.length,
      destination: '',
      filename: originalname,
      path: '',
      buffer,
    } as unknown as Express.Multer.File;
  }

  describe('parseCsv', () => {
    it('devrait parser un CSV simple avec en-têtes', () => {
      const csv = 'matricule,nom,email\nM001,Doe,doe@example.com\nM002,Smith,smith@example.com\n';
      const rows = (service as any).parseCsv(Buffer.from(csv));
      expect(rows).toHaveLength(2);
      expect(rows[0].matricule).toBe('M001');
      expect(rows[0].email).toBe('doe@example.com');
      expect(rows[1].nom).toBe('Smith');
    });

    it('devrait gérer les champs entre guillemets contenant des virgules', () => {
      const csv = 'matricule,nom,email\nM001,"Doe, John",doe@example.com\n';
      const rows = (service as any).parseCsv(Buffer.from(csv));
      expect(rows[0].nom).toBe('Doe, John');
    });

    it('devrait ignorer les lignes vides', () => {
      const csv = 'matricule,nom\nM001,Doe\n\nM002,Smith\n';
      const rows = (service as any).parseCsv(Buffer.from(csv));
      expect(rows).toHaveLength(2);
    });

    it('devrait supprimer le BOM UTF-8 en début de fichier', () => {
      const csv = '\uFEFFmatricule,nom\nM001,Doe\n';
      const rows = (service as any).parseCsv(Buffer.from(csv));
      expect(rows).toHaveLength(1);
      expect(rows[0].matricule).toBe('M001');
      expect(rows[0].nom).toBe('Doe');
    });

    it('devrait gérer les fins de ligne CRLF', () => {
      const csv = 'matricule,nom\r\nM001,Doe\r\nM002,Smith\r\n';
      const rows = (service as any).parseCsv(Buffer.from(csv));
      expect(rows).toHaveLength(2);
      expect(rows[0].matricule).toBe('M001');
      expect(rows[1].nom).toBe('Smith');
    });

    it('devrait gérer les sauts de ligne dans les champs entre guillemets', () => {
      const csv = 'matricule,adresse\nM001,"1 rue de Paris\n75001 Paris"\nM002,2 avenue Lyon\n';
      const rows = (service as any).parseCsv(Buffer.from(csv));
      expect(rows).toHaveLength(2);
      expect(rows[0].adresse).toBe('1 rue de Paris\n75001 Paris');
      expect(rows[1].matricule).toBe('M002');
    });
  });

  describe('validateFileType', () => {
    it('devrait accepter un fichier CSV valide', () => {
      const file = makeFile(Buffer.from('matricule,nom\nM001,Doe\n'), 'test.csv');
      expect(() => (service as any).validateFileType(file)).not.toThrow();
    });

    it('devrait accepter un fichier XLSX avec magic bytes PK', () => {
      const xlsxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const file = makeFile(Buffer.concat([xlsxHeader, Buffer.from('reste du xlsx')]), 'test.xlsx');
      expect(() => (service as any).validateFileType(file)).not.toThrow();
    });

    it('devrait rejeter un fichier .csv avec signature binaire XLSX', () => {
      const xlsxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const file = makeFile(Buffer.concat([xlsxHeader, Buffer.from('data')]), 'test.csv');
      expect(() => (service as any).validateFileType(file)).toThrow('extension incohérente');
    });

    it('devrait rejeter une extension non supportée', () => {
      const file = makeFile(Buffer.from('data'), 'test.txt');
      expect(() => (service as any).validateFileType(file)).toThrow('Extension non supportée');
    });
  });

  describe('buildPreview (dryRun)', () => {
    it('devrait retourner un aperçu sans écrire en base', async () => {
      const csv = 'matricule,nom,email,departementId,anneeId\nM001,Doe,doe@example.com,' + departementId + ',' + anneeId + '\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: true };

      const result = await service.importCsv(ImportEntity.ENSEIGNANTS, dto, file, userId);

      expect((result as any).entite).toBe('enseignants');
      expect((result as any).totalLignes).toBe(1);
      expect((result as any).resume.ajout).toBeGreaterThan(0);
      expect(prisma.enseignant.create).not.toHaveBeenCalled();
    });

    it('devrait détecter les erreurs de validation ligne par ligne', async () => {
      const csv = 'matricule,nom,email,departementId,anneeId\n,,,' + departementId + ',' + anneeId + '\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: true };

      const result = await service.importCsv(ImportEntity.ENSEIGNANTS, dto, file, userId);

      expect((result as any).resume.erreur).toBeGreaterThan(0);
    });
  });

  describe('applyImport (confirmation)', () => {
    it('devrait créer une salle en base', async () => {
      const csv = 'code,libelle,capaciteMax\nS001,Amphi A,120\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: false, confirmation: true };

      prisma.salle.findFirst.mockResolvedValue(null);
      prisma.salle.create.mockResolvedValue({ id: 'salle-id-1', code: 'S001' });

      const result = await service.importCsv(ImportEntity.SALLES, dto, file, userId);

      expect((result as any).crees).toHaveLength(1);
      expect(prisma.salle.create).toHaveBeenCalled();
    });

    it('devrait ignorer une salle déjà existante (idempotent)', async () => {
      const csv = 'code,libelle,capaciteMax\nS001,Amphi A,120\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: false, confirmation: true };

      prisma.salle.findFirst.mockResolvedValue({ id: 'salle-id-1', code: 'S001' });

      const result = await service.importCsv(ImportEntity.SALLES, dto, file, userId);

      expect((result as any).ignores).toHaveLength(1);
      expect(prisma.salle.create).not.toHaveBeenCalled();
    });

    it('devrait refuser l\'import sans confirmation', async () => {
      const csv = 'code,libelle,capaciteMax\nS001,Amphi A,120\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: false, confirmation: false };

      await expect(service.importCsv(ImportEntity.SALLES, dto, file, userId)).rejects.toThrow('confirmation');
    });
  });

  describe('validation par entité', () => {
    it('devrait rejeter un groupe sans semestre', () => {
      const items = (service as any).validateGroupe({ code: 'INFO-L3-S1', semestreId: '' }, 2);
      const erreur = items.find((i: any) => i.action === 'erreur');
      expect(erreur.colonne).toBe('semestreId');
    });

    it('devrait rejeter un module sans semestreNumero valide', () => {
      const items = (service as any).validateModule({ code: 'INFO301', semestreNumero: '3' }, 2);
      const erreur = items.find((i: any) => i.action === 'erreur');
      expect(erreur.colonne).toBe('semestreNumero');
    });
  });
});
