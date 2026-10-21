// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service d'import CSV/XLSX (L1-26)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
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
      annee: { findUnique: vi.fn() },
      departement: { findUnique: vi.fn() },
      niveau: { findUnique: vi.fn() },
      typeEnseignement: { findUnique: vi.fn() },
      semestre: { findUnique: vi.fn() },
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
      prisma.annee.findUnique.mockResolvedValue({ id: anneeId });
      prisma.departement.findUnique.mockResolvedValue({ id: departementId });

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
      prisma.annee.findUnique.mockResolvedValue({ id: anneeId });
      prisma.departement.findUnique.mockResolvedValue({ id: departementId });

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

  describe('parseXlsx', () => {
    function makeXlsxBuffer(rows: any[][]): Buffer {
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Feuil1');
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    it('devrait parser un XLSX simple avec en-têtes', () => {
      const buffer = makeXlsxBuffer([
        ['matricule', 'nom', 'email'],
        ['M001', 'Doe', 'doe@example.com'],
        ['M002', 'Smith', 'smith@example.com'],
      ]);
      const rows = (service as any).parseXlsx(buffer);
      expect(rows).toHaveLength(2);
      expect(rows[0].matricule).toBe('M001');
      expect(rows[0].email).toBe('doe@example.com');
      expect(rows[1].nom).toBe('Smith');
    });

    it('devrait prendre la premiere feuille quand il y en a plusieurs', () => {
      const ws1 = XLSX.utils.aoa_to_sheet([
        ['a', 'b'],
        ['1', '2'],
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([
        ['x', 'y'],
        ['9', '8'],
      ]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws1, 'Feuil1');
      XLSX.utils.book_append_sheet(workbook, ws2, 'Feuil2');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const rows = (service as any).parseXlsx(buffer);
      expect(rows).toHaveLength(1);
      expect(rows[0].a).toBe('1');
      expect(rows[0].b).toBe('2');
    });

    it('devrait convertir les valeurs numeriques en string', () => {
      const buffer = makeXlsxBuffer([
        ['code', 'effectif'],
        ['S001', 120],
      ]);
      const rows = (service as any).parseXlsx(buffer);
      expect(rows[0].code).toBe('S001');
      expect(rows[0].effectif).toBe('120');
      expect(typeof rows[0].effectif).toBe('string');
    });

    it('devrait utiliser les en-tetes comme cles des lignes', () => {
      const buffer = makeXlsxBuffer([
        ['code', 'libelle', 'capacite'],
        ['S001', 'Amphi A', '120'],
      ]);
      const rows = (service as any).parseXlsx(buffer);
      expect(rows[0]).toEqual({ code: 'S001', libelle: 'Amphi A', capacite: '120' });
    });

    it('devrait ignorer les lignes completamente vides', () => {
      const buffer = makeXlsxBuffer([
        ['matricule', 'nom'],
        ['M001', 'Doe'],
        [undefined, undefined],
        ['M002', 'Smith'],
      ]);
      const rows = (service as any).parseXlsx(buffer);
      expect(rows).toHaveLength(2);
    });

    it('devrait retourner un tableau vide pour une feuille sans donnees', () => {
      const worksheet = XLSX.utils.aoa_to_sheet([]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Feuil1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const rows = (service as any).parseXlsx(buffer);
      expect(rows).toEqual([]);
    });
  });

  describe('controle referentiel (dryRun)', () => {
    it('devrait signaler une anneeId enseignant introuvable en dryRun', async () => {
      prisma.annee.findUnique.mockResolvedValue(null);
      prisma.departement.findUnique.mockResolvedValue({ id: departementId });

      const csv =
        'matricule,nom,email,departementId,anneeId\nM001,Doe,doe@example.com,' +
        departementId +
        ',annee-inconnu\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: true };

      const result = await service.importCsv(ImportEntity.ENSEIGNANTS, dto, file, userId);

      const erreur = (result as any).items.find(
        (i: any) => i.colonne === 'anneeId' && i.action === 'erreur',
      );
      expect(erreur).toBeDefined();
      expect(erreur.correctionAttendue).toContain('anneeId');
      expect((result as any).resume.erreur).toBeGreaterThan(0);
    });

    it('devrait signaler un departementId enseignant introuvable en dryRun', async () => {
      prisma.annee.findUnique.mockResolvedValue({ id: anneeId });
      prisma.departement.findUnique.mockResolvedValue(null);

      const csv =
        'matricule,nom,email,departementId,anneeId\nM001,Doe,doe@example.com,dep-inconnu,' +
        anneeId +
        '\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: true };

      const result = await service.importCsv(ImportEntity.ENSEIGNANTS, dto, file, userId);

      const erreur = (result as any).items.find(
        (i: any) => i.colonne === 'departementId' && i.action === 'erreur',
      );
      expect(erreur).toBeDefined();
      expect((result as any).resume.erreur).toBeGreaterThan(0);
    });

    it('devrait signaler un semestreId groupe introuvable en dryRun', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: 'niveau-id' });
      prisma.semestre.findUnique.mockResolvedValue(null);

      const csv = 'code,semestreId,niveauId\nINFO-L3-S1,sem-inconnu,niveau-id\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: true };

      const result = await service.importCsv(ImportEntity.GROUPES, dto, file, userId);

      const erreur = (result as any).items.find(
        (i: any) => i.colonne === 'semestreId' && i.action === 'erreur',
      );
      expect(erreur).toBeDefined();
    });

    it('devrait signaler un niveauId groupe introuvable en dryRun', async () => {
      prisma.niveau.findUnique.mockResolvedValue(null);
      prisma.semestre.findUnique.mockResolvedValue({ id: 'semestre-id' });

      const csv = 'code,semestreId,niveauId\nINFO-L3-S1,semestre-id,niveau-inconnu\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: true };

      const result = await service.importCsv(ImportEntity.GROUPES, dto, file, userId);

      const erreur = (result as any).items.find(
        (i: any) => i.colonne === 'niveauId' && i.action === 'erreur',
      );
      expect(erreur).toBeDefined();
    });

    it('devrait signaler un niveauId module introuvable en dryRun', async () => {
      prisma.niveau.findUnique.mockResolvedValue(null);
      prisma.typeEnseignement.findUnique.mockResolvedValue({ id: 'type-id' });

      const csv =
        'code,libelle,semestreNumero,niveauId,typeId\nINFO301,Algo,1,niveau-inconnu,type-id\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: true };

      const result = await service.importCsv(ImportEntity.MODULES, dto, file, userId);

      const erreur = (result as any).items.find(
        (i: any) => i.colonne === 'niveauId' && i.action === 'erreur',
      );
      expect(erreur).toBeDefined();
    });

    it('devrait signaler un typeId module introuvable en dryRun', async () => {
      prisma.niveau.findUnique.mockResolvedValue({ id: 'niveau-id' });
      prisma.typeEnseignement.findUnique.mockResolvedValue(null);

      const csv =
        'code,libelle,semestreNumero,niveauId,typeId\nINFO301,Algo,1,niveau-id,type-inconnu\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: true };

      const result = await service.importCsv(ImportEntity.MODULES, dto, file, userId);

      const erreur = (result as any).items.find(
        (i: any) => i.colonne === 'typeId' && i.action === 'erreur',
      );
      expect(erreur).toBeDefined();
    });

    it('ne devrait signaler aucune erreur referentiel quand tous les IDs sont valides', async () => {
      prisma.annee.findUnique.mockResolvedValue({ id: anneeId });
      prisma.departement.findUnique.mockResolvedValue({ id: departementId });

      const csv =
        'matricule,nom,email,departementId,anneeId\nM001,Doe,doe@example.com,' +
        departementId +
        ',' +
        anneeId +
        '\n';
      const file = makeFile(Buffer.from(csv), 'test.csv');
      const dto: ImportCsvDto = { dryRun: true };

      const result = await service.importCsv(ImportEntity.ENSEIGNANTS, dto, file, userId);

      const erreursReferentiel = (result as any).items.filter(
        (i: any) =>
          i.action === 'erreur' && (i.colonne === 'anneeId' || i.colonne === 'departementId'),
      );
      expect(erreursReferentiel).toHaveLength(0);
      expect((result as any).resume.erreur).toBe(0);
    });
  });
});
