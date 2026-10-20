// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Jeux de règles de charge (L2-03)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChargeRuleSetService } from './charge-ruleset.service.js';
import {
  CreateChargeRuleSetDto,
  UpdateChargeRuleSetDto,
} from './dto/charge-ruleset.response.dto.js';
import { CreateChargeReferenceGradeDto } from './dto/charge-reference-grade.dto.js';
import { CreateChargeCoefficientDto } from './dto/charge-coefficient.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: class {},
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const prisma: any = {};

describe('ChargeRuleSetService', () => {
  let service: ChargeRuleSetService;
  let audit: any;

  const rulesetId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma.chargeRuleSet = {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    prisma.chargeReferenceGrade = {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    prisma.chargeCoefficient = {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    audit = {
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    service = new ChargeRuleSetService(prisma as any, audit as any);
  });

  // ============================================
  // Jeux de règles de charge
  // ============================================
  describe('createChargeRuleSet', () => {
    const dto: CreateChargeRuleSetDto = {
      numero: 1,
      periode: 'HEBDOMADAIRE',
      seuil: 1200,
      plafond: 2400,
      arrondi: 30,
    };

    it('should create a draft ruleset successfully', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue(null);
      prisma.chargeRuleSet.create.mockResolvedValue({
        id: rulesetId,
        numero: 1,
        periode: 'HEBDOMADAIRE',
        seuil: 1200,
        plafond: 2400,
        arrondi: 30,
        publieLe: null,
        anneeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        referenceGrades: [],
        coefficients: [],
      });

      const result = await service.createChargeRuleSet(dto, userId);

      expect(result.numero).toBe(1);
      expect(result.periode).toBe('HEBDOMADAIRE');
      expect(result.publieLe).toBeNull();
      expect(prisma.chargeRuleSet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numero: 1, periode: 'HEBDOMADAIRE' }),
          include: { referenceGrades: true, coefficients: true },
        }),
      );
      expect(audit.auditTransaction).toHaveBeenCalledTimes(1);
    });

    it('should throw Conflict when numero already exists', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({ id: 'other', numero: 1 });

      await expect(service.createChargeRuleSet(dto, userId)).rejects.toThrow(
        'existe déjà',
      );
    });
  });

  describe('findAllChargeRuleSets', () => {
    it('should return all rulesets ordered by numero', async () => {
      prisma.chargeRuleSet.findMany.mockResolvedValue([
        { id: rulesetId, numero: 2, periode: 'ANNUELLE', referenceGrades: [], coefficients: [], publieLe: null, anneeId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 'other', numero: 1, periode: 'HEBDOMADAIRE', referenceGrades: [], coefficients: [], publieLe: null, anneeId: null, createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await service.findAllChargeRuleSets();

      expect(result).toHaveLength(2);
      expect(result[0].numero).toBe(2);
      expect(prisma.chargeRuleSet.findMany).toHaveBeenCalledWith({
        include: { referenceGrades: true, coefficients: true },
        orderBy: [{ numero: 'asc' }],
      });
    });
  });

  describe('findChargeRuleSetById', () => {
    it('should return the ruleset when it exists', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 1,
        periode: 'HEBDOMADAIRE',
        publieLe: null,
        anneeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        referenceGrades: [],
        coefficients: [],
      });

      const result = await service.findChargeRuleSetById(rulesetId);

      expect(result.id).toBe(rulesetId);
    });

    it('should throw NotFound when missing', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue(null);
      await expect(service.findChargeRuleSetById(rulesetId)).rejects.toThrow(
        'non trouvé',
      );
    });
  });

  describe('updateChargeRuleSet', () => {
    const dto: UpdateChargeRuleSetDto = { seuil: 1500 };

    it('should update a draft ruleset', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 1,
        periode: 'HEBDOMADAIRE',
        publieLe: null,
      });
      prisma.chargeRuleSet.update.mockResolvedValue({
        id: rulesetId,
        numero: 1,
        periode: 'HEBDOMADAIRE',
        seuil: 1500,
        publieLe: null,
        anneeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        referenceGrades: [],
        coefficients: [],
      });

      const result = await service.updateChargeRuleSet(rulesetId, dto, userId);

      expect(result.seuil).toBe(1500);
      expect(audit.auditTransaction).toHaveBeenCalledTimes(1);
    });

    it('should throw Conflict when ruleset is published', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 1,
        periode: 'HEBDOMADAIRE',
        publieLe: new Date(),
      });

      await expect(service.updateChargeRuleSet(rulesetId, dto, userId)).rejects.toThrow(
        'publié',
      );
    });
  });

  describe('removeChargeRuleSet', () => {
    it('should delete a draft ruleset', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 1,
        publieLe: null,
      });
      prisma.chargeRuleSet.delete.mockResolvedValue({ id: rulesetId });

      await service.removeChargeRuleSet(rulesetId, userId);

      expect(prisma.chargeRuleSet.delete).toHaveBeenCalledWith({
        where: { id: rulesetId },
      });
      expect(audit.auditTransaction).toHaveBeenCalledTimes(1);
    });

    it('should throw Conflict when ruleset is published', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 1,
        publieLe: new Date(),
      });

      await expect(service.removeChargeRuleSet(rulesetId, userId)).rejects.toThrow(
        'publié',
      );
    });
  });

  describe('publishChargeRuleSet', () => {
    it('should publish a draft ruleset', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 1,
        publieLe: null,
      });
      prisma.chargeRuleSet.update.mockResolvedValue({
        id: rulesetId,
        numero: 1,
        publieLe: new Date(),
        periode: 'HEBDOMADAIRE',
        anneeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        referenceGrades: [],
        coefficients: [],
      });

      const result = await service.publishChargeRuleSet(rulesetId, userId);

      expect(result.publieLe).not.toBeNull();
      expect(prisma.chargeRuleSet.update).toHaveBeenCalledWith({
        where: { id: rulesetId },
        data: { publieLe: expect.any(Date) },
        include: { referenceGrades: true, coefficients: true },
      });
    });

    it('should throw Conflict when already published', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 1,
        publieLe: new Date(),
      });

      await expect(service.publishChargeRuleSet(rulesetId, userId)).rejects.toThrow(
        'déjà publié',
      );
    });
  });

  describe('newChargeRuleSetVersion', () => {
    it('should create a new version (numero +1) from a published ruleset', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 3,
        periode: 'HEBDOMADAIRE',
        seuil: 1200,
        plafond: 2400,
        arrondi: 30,
        publieLe: new Date(),
        anneeId: null,
        referenceGrades: [],
        coefficients: [],
      });
      prisma.chargeRuleSet.create.mockResolvedValue({
        id: 'new-id',
        numero: 4,
        periode: 'HEBDOMADAIRE',
        publieLe: null,
        anneeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        referenceGrades: [],
        coefficients: [],
      });

      const result = await service.newChargeRuleSetVersion(rulesetId, userId);

      expect(result.numero).toBe(4);
      expect(result.publieLe).toBeNull();
      expect(prisma.chargeRuleSet.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ numero: 4 }) }),
      );
    });

    it('should throw BadRequest when the source is not published', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 3,
        publieLe: null,
      });

      await expect(
        service.newChargeRuleSetVersion(rulesetId, userId),
      ).rejects.toThrow('publié');
    });
  });

  // ============================================
  // Coefficients par grade
  // ============================================

  describe('createChargeReferenceGrade', () => {
    const dto: CreateChargeReferenceGradeDto = { gradeId: undefined, coefficient: 1.5 };

    it('should create a reference grade coefficient', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 1,
      });
      prisma.chargeReferenceGrade.create.mockResolvedValue({
        id: 'ref-id',
        ruleSetId: rulesetId,
        gradeId: null,
        coefficient: 1.5,
        createdAt: new Date(),
      });

      const result = await service.createChargeReferenceGrade(
        rulesetId,
        dto,
        userId,
      );

      expect(result.coefficient).toBe(1.5);
      expect(audit.auditTransaction).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // Coefficients par type d'enseignement
  // ============================================

  describe('createChargeCoefficient', () => {
    const dto: CreateChargeCoefficientDto = {
      typeId: '550e8400-e29b-41d4-a716-446655440002',
      coefficient: 2.0,
    };

    it('should create a type coefficient', async () => {
      prisma.chargeRuleSet.findUnique.mockResolvedValue({
        id: rulesetId,
        numero: 1,
      });
      prisma.chargeCoefficient.create.mockResolvedValue({
        id: 'coef-id',
        ruleSetId: rulesetId,
        typeId: dto.typeId,
        coefficient: 2.0,
        createdAt: new Date(),
      });

      const result = await service.createChargeCoefficient(rulesetId, dto, userId);

      expect(result.coefficient).toBe(2.0);
      expect(audit.auditTransaction).toHaveBeenCalledTimes(1);
    });
  });
});

