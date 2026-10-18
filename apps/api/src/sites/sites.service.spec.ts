// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service Sites (L1-14)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SitesService } from './sites.service.js';
import {
  CreateSiteDto,
  UpdateSiteDto,
} from './dto/site.dto.js';

vi.mock('@takt/db', () => ({
  PrismaClient: vi.fn(),
}));

describe('SitesService', () => {
  let service: SitesService;
  let prisma: any;

  const siteId = '550e8400-e29b-41d4-a716-446655440010';
  const otherSiteId = '550e8400-e29b-41d4-a716-446655440011';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      site: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      salle: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn(async (calls: any[]) => {
        const results = await Promise.all(calls.map((c) =>
          typeof c === 'function' ? c(prisma) : c,
        ));
        return results;
      }),
    };

    service = new SitesService(prisma);
  });

  describe('createSite', () => {
    it('devrait créer un site', async () => {
      const dto: CreateSiteDto = {
        code: 'SITE-PRINCIPAL',
        libelle: 'Campus Principal',
        estPrincipal: true,
      };

      prisma.site.findUnique.mockResolvedValue(null);
      prisma.site.updateMany.mockResolvedValue({ count: 1 });
      prisma.site.create.mockResolvedValue({
        id: siteId,
        code: 'SITE-PRINCIPAL',
        libelle: 'Campus Principal',
        estPrincipal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createSite(dto);

      expect(result.id).toBe(siteId);
      expect(result.code).toBe('SITE-PRINCIPAL');
      expect(result.libelle).toBe('Campus Principal');
      expect(result.estPrincipal).toBe(true);
      expect(prisma.site.create).toHaveBeenCalledWith({
        data: {
          code: 'SITE-PRINCIPAL',
          libelle: 'Campus Principal',
          estPrincipal: true,
        },
      });
    });

    it('devrait lever ConflictException si le code existe déjà', async () => {
      const dto: CreateSiteDto = {
        code: 'SITE-PRINCIPAL',
        libelle: 'Campus Principal',
      };

      prisma.site.findUnique.mockResolvedValue({
        id: siteId,
        code: 'SITE-PRINCIPAL',
        libelle: 'Campus Principal',
        estPrincipal: false,
      });

      await expect(service.createSite(dto)).rejects.toThrow('existe déjà');
    });

    it('devrait désactiver l’ancien site principal lors de la création d’un nouveau principal', async () => {
      const dto: CreateSiteDto = {
        code: 'SITE-2',
        libelle: 'Site Annexe',
        estPrincipal: true,
      };

      prisma.site.findUnique.mockResolvedValue(null);
      prisma.site.updateMany.mockResolvedValue({ count: 1 });
      prisma.site.create.mockResolvedValue({
        id: siteId,
        code: 'SITE-2',
        libelle: 'Site Annexe',
        estPrincipal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.createSite(dto);

      expect(prisma.site.updateMany).toHaveBeenCalledWith({
        where: { estPrincipal: true },
        data: { estPrincipal: false },
      });
    });
  });

  describe('findAllSites', () => {
    it('devrait retourner une liste paginée de sites', async () => {
      const sites = [
        { id: siteId, code: 'SITE-PRINCIPAL', libelle: 'Campus Principal', estPrincipal: true, createdAt: new Date(), updatedAt: new Date() },
        { id: otherSiteId, code: 'SITE-2', libelle: 'Site Annexe', estPrincipal: false, createdAt: new Date(), updatedAt: new Date() },
      ];

      prisma.site.findMany.mockResolvedValue(sites);
      prisma.site.count.mockResolvedValue(2);

      const result = await service.findAllSites({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('devrait filtrer par recherche sur code/libellé', async () => {
      prisma.site.findMany.mockResolvedValue([]);
      prisma.site.count.mockResolvedValue(0);

      await service.findAllSites({ page: 1, limit: 10, search: 'Campus' });

      expect(prisma.site.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { code: { contains: 'Campus', mode: 'insensitive' } },
            { libelle: { contains: 'Campus', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { estPrincipal: 'desc', code: 'asc' },
      });
    });
  });

  describe('findSiteById', () => {
    it('devrait retourner un site par ID', async () => {
      prisma.site.findUnique.mockResolvedValue({
        id: siteId,
        code: 'SITE-PRINCIPAL',
        libelle: 'Campus Principal',
        estPrincipal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findSiteById(siteId);

      expect(result.id).toBe(siteId);
      expect(result.code).toBe('SITE-PRINCIPAL');
    });

    it('devrait lever NotFoundException si le site n’existe pas', async () => {
      prisma.site.findUnique.mockResolvedValue(null);

      await expect(service.findSiteById(siteId)).rejects.toThrow('non trouvé');
    });
  });

  describe('updateSite', () => {
    it('devrait mettre à jour un site', async () => {
      const dto: UpdateSiteDto = { libelle: 'Nouveau Libellé' };

      prisma.site.findUnique.mockResolvedValue({
        id: siteId,
        code: 'SITE-PRINCIPAL',
        libelle: 'Campus Principal',
        estPrincipal: false,
      });
      prisma.site.update.mockResolvedValue({
        id: siteId,
        code: 'SITE-PRINCIPAL',
        libelle: 'Nouveau Libellé',
        estPrincipal: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateSite(siteId, dto);

      expect(result.libelle).toBe('Nouveau Libellé');
      expect(prisma.site.update).toHaveBeenCalledWith({
        where: { id: siteId },
        data: { libelle: 'Nouveau Libellé' },
      });
    });

    it('devrait lever NotFoundException si le site n’existe pas', async () => {
      prisma.site.findUnique.mockResolvedValue(null);

      await expect(service.updateSite(siteId, { libelle: 'Test' })).rejects.toThrow('non trouvé');
    });
  });

  describe('removeSite', () => {
    it('devrait supprimer un site sans salles', async () => {
      prisma.site.findUnique.mockResolvedValue({
        id: siteId,
        code: 'SITE-2',
        libelle: 'Site Annexe',
        estPrincipal: false,
        salles: [],
      });
      prisma.site.delete.mockResolvedValue({});

      await service.removeSite(siteId);

      expect(prisma.site.delete).toHaveBeenCalledWith({ where: { id: siteId } });
    });

    it('devrait lever ConflictException si des salles sont rattachées', async () => {
      prisma.site.findUnique.mockResolvedValue({
        id: siteId,
        code: 'SITE-PRINCIPAL',
        libelle: 'Campus Principal',
        estPrincipal: true,
        salles: [{ id: 'salle-1', code: 'AMPHI-A' }],
      });

      await expect(service.removeSite(siteId)).rejects.toThrow('rattachées');
    });

    it('devrait lever NotFoundException si le site n’existe pas', async () => {
      prisma.site.findUnique.mockResolvedValue(null);

      await expect(service.removeSite(siteId)).rejects.toThrow('non trouvé');
    });
  });

  describe('setSitePrincipal', () => {
    it('devrait définir le site comme principal et désactiver l’ancien', async () => {
      prisma.site.findUnique.mockResolvedValue({
        id: siteId,
        code: 'SITE-2',
        libelle: 'Site Annexe',
        estPrincipal: false,
      });
      prisma.site.updateMany.mockResolvedValue({ count: 1 });
      prisma.site.update.mockResolvedValue({
        id: siteId,
        code: 'SITE-2',
        libelle: 'Site Annexe',
        estPrincipal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.setSitePrincipal(siteId);

      expect(result.estPrincipal).toBe(true);
      expect(prisma.site.updateMany).toHaveBeenCalledWith({
        where: { estPrincipal: true },
        data: { estPrincipal: false },
      });
      expect(prisma.site.update).toHaveBeenCalledWith({
        where: { id: siteId },
        data: { estPrincipal: true },
      });
    });

    it('devrait lever NotFoundException si le site n’existe pas', async () => {
      prisma.site.findUnique.mockResolvedValue(null);

      await expect(service.setSitePrincipal(siteId)).rejects.toThrow('non trouvé');
    });
  });

  describe('getSallesParSite', () => {
    it('devrait retourner les salles d’un site', async () => {
      prisma.site.findUnique.mockResolvedValue({
        id: siteId,
        code: 'SITE-PRINCIPAL',
        libelle: 'Campus Principal',
        estPrincipal: true,
      });
      prisma.salle.findMany.mockResolvedValue([
        { id: 'salle-1', code: 'AMPHI-A', libelle: 'Amphithéâtre A', siteId, createdAt: new Date(), updatedAt: new Date() },
      ]);
      prisma.salle.count.mockResolvedValue(1);

      const result = await service.getSallesParSite(siteId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.salleCount).toBe(1);
      expect(prisma.salle.findMany).toHaveBeenCalledWith({
        where: { siteId },
        skip: 0,
        take: 10,
        orderBy: { code: 'asc' },
      });
    });

    it('devrait lever NotFoundException si le site n’existe pas', async () => {
      prisma.site.findUnique.mockResolvedValue(null);

      await expect(service.getSallesParSite(siteId, { page: 1, limit: 10 })).rejects.toThrow('non trouvé');
    });
  });
});