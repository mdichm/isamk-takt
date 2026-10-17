// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Activity Tags (L1-06)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityTagsService } from './activity-tags.service.js';
import {
  CreateActivityTagDto,
  UpdateActivityTagDto,
} from './dto/activity-tag.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: vi.fn(),
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: any) => operation({} as any)),
  })),
}));

describe('ActivityTagsService', () => {
  let service: ActivityTagsService;
  let prisma: any;
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const tagId = '550e8400-e29b-41d4-a716-446655440010';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      activityTag: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn(async ([tx1, tx2]) => {
        const [res1, res2] = await Promise.all([
          tx1,
          tx2 instanceof Function ? tx2(prisma) : tx2,
        ]);
        return [res1, res2];
      }),
    };

    audit = {
      auditTransaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    service = new ActivityTagsService(prisma, audit);
  });

  describe('createActivityTag', () => {
    it('devrait créer un tag activité', async () => {
      const dto: CreateActivityTagDto = { code: 'TP', libelle: 'Travaux pratiques' };
      const expected = { id: tagId, code: 'TP', libelle: 'Travaux pratiques', isActive: true, createdAt: new Date(), updatedAt: new Date() };

      prisma.activityTag.findUnique.mockResolvedValue(null);
      prisma.activityTag.create.mockResolvedValue(expected);

      const result = await service.createActivityTag(dto, userId);

      expect(prisma.activityTag.findUnique).toHaveBeenCalledWith({ where: { code: 'TP' } });
      expect(result).toEqual(expected);
    });

    it('devrait lever ConflictException si le code existe déjà', async () => {
      const dto: CreateActivityTagDto = { code: 'TP', libelle: 'Travaux pratiques' };

      prisma.activityTag.findUnique.mockResolvedValue({ id: tagId, code: 'TP' });

      await expect(service.createActivityTag(dto, userId)).rejects.toThrow(
        'existe déjà',
      );
    });
  });

  describe('findAllActivityTags', () => {
    it('devrait retourner une liste paginée', async () => {
      const tags = [
        { id: tagId, code: 'TP', libelle: 'Travaux pratiques', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ];

      prisma.activityTag.findMany.mockResolvedValue(tags);
      prisma.activityTag.count.mockResolvedValue(1);

      const result = await service.findAllActivityTags({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findActivityTagById', () => {
    it('devrait retourner le tag trouvé', async () => {
      const expected = { id: tagId, code: 'TP', libelle: 'Travaux pratiques', isActive: true, createdAt: new Date(), updatedAt: new Date() };

      prisma.activityTag.findUnique.mockResolvedValue(expected);

      const result = await service.findActivityTagById(tagId);

      expect(result).toEqual(expected);
    });

    it('devrait lever NotFoundException si le tag n\'existe pas', async () => {
      prisma.activityTag.findUnique.mockResolvedValue(null);

      await expect(service.findActivityTagById(tagId)).rejects.toThrow(
        'non trouvé',
      );
    });
  });

  describe('updateActivityTag', () => {
    it('devrait mettre à jour le tag', async () => {
      const existing = { id: tagId, code: 'TP', libelle: 'Travaux pratiques', isActive: true };
      const updated = { ...existing, libelle: 'Travaux dirigés' };
      const dto: UpdateActivityTagDto = { libelle: 'Travaux dirigés' };

      prisma.activityTag.findUnique.mockResolvedValue(existing);
      prisma.activityTag.update.mockResolvedValue(updated);

      const result = await service.updateActivityTag(tagId, dto, userId);

      expect(result.libelle).toBe('Travaux dirigés');
    });

    it('devrait lever NotFoundException si le tag n\'existe pas', async () => {
      prisma.activityTag.findUnique.mockResolvedValue(null);

      await expect(
        service.updateActivityTag(tagId, { code: 'TD' }, userId),
      ).rejects.toThrow('non trouvé');
    });

    it('devrait lever ConflictException si le nouveau code existe déjà', async () => {
      const existing = { id: tagId, code: 'TP', libelle: 'Travaux pratiques', isActive: true };

      prisma.activityTag.findUnique.mockResolvedValueOnce(existing);
      prisma.activityTag.findUnique.mockResolvedValueOnce({ id: 'other', code: 'CM' });

      await expect(service.updateActivityTag(tagId, { code: 'CM' }, userId)).rejects.toThrow(
        'existe déjà',
      );
    });
  });

  describe('removeActivityTag', () => {
    it('devrait supprimer un tag non référencé', async () => {
      const existing = { id: tagId, code: 'TP', libelle: 'Travaux pratiques', isActive: true, typesEnseignement: [] };

      prisma.activityTag.findUnique.mockResolvedValue(existing);

      await service.removeActivityTag(tagId, userId);

      expect(prisma.activityTag.delete).toHaveBeenCalledWith({ where: { id: tagId } });
    });

    it('devrait lever ConflictException si le tag est référencé', async () => {
      const existing = { id: tagId, code: 'TP', libelle: 'Travaux pratiques', isActive: true, typesEnseignement: [{ id: 't1' }, { id: 't2' }] };

      prisma.activityTag.findUnique.mockResolvedValue(existing);

      await expect(service.removeActivityTag(tagId, userId)).rejects.toThrow(
        'référencé',
      );
    });

    it('devrait lever NotFoundException si le tag n\'existe pas', async () => {
      prisma.activityTag.findUnique.mockResolvedValue(null);

      await expect(service.removeActivityTag(tagId, userId)).rejects.toThrow(
        'non trouvé',
      );
    });
  });
});