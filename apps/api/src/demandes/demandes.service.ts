// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service métier Demandes de modification (L2-15)
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@takt/db';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto.js';
import { EvenementNotification } from '../notifications/notifications.constants.js';
import {
  CreateDemandeDto,
  TraiterDemandeDto,
  DemandeResponseDto,
  PaginatedDemandesDto,
  DemandeQueryDto,
  DemandeStatut,
  DemandeType,
  toDemandeDto,
} from './dto/demande.dto.js';

const PAGINATION_DEFAULT_LIMIT = 10;

@Injectable()
export class DemandesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async createDemande(
    dto: CreateDemandeDto,
    auteurId: string,
  ): Promise<DemandeResponseDto> {
    // Vérifier que le semestre existe
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: dto.semestreId },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre ${dto.semestreId} introuvable`);
    }

    const demande = await this.audit.auditTransaction<any>(
      async (tx) => {
        const d = await tx.demandeModification.create({
          data: {
            semestreId: dto.semestreId,
            departementCode: dto.departementCode,
            auteurId,
            versionId: dto.versionId ?? null,
            type: dto.type as DemandeType,
            cible: dto.cible as Prisma.InputJsonValue,
            motif: dto.motif,
            statut: DemandeStatut.OUVERTE,
          },
        });

        // Notification DEMANDE_CREEE aux responsables du département (SF §14)
        const responsables = await tx.userSystemRole.findMany({
          where: {
            departementCode: dto.departementCode,
            role: 'RESPONSABLE_DEPARTEMENT',
          },
          select: { userId: true },
        });

        const dtos: CreateNotificationDto[] = responsables.map((r) => ({
          destinataireId: r.userId,
          demandeId: d.id,
          evenement: EvenementNotification.DEMANDE_CREEE,
          titre: `Nouvelle demande de modification (${dto.type})`,
          lien: `/demandes/${d.id}`,
        }));

        if (dtos.length > 0) {
          await this.notifications.creerNotifications(tx, dtos);
        }

        return d;
      },
      {
        userId: auteurId,
        action: 'CREATE',
        objetType: 'DemandeModification',
        motif: `Création demande ${dto.type} pour semestre=${dto.semestreId} dept=${dto.departementCode}`,
      },
    );

    return toDemandeDto(demande);
  }

  async findAllDemandes(
    query: DemandeQueryDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<PaginatedDemandesDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? PAGINATION_DEFAULT_LIMIT, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.type) where.type = query.type;
    if (query.statut) where.statut = query.statut;
    if (query.semestreId) where.semestreId = query.semestreId;
    if (query.departementCode) where.departementCode = query.departementCode;
    if (query.auteurId) where.auteurId = query.auteurId;
    if (query.search) {
      where.OR = [
        { motif: { contains: query.search, mode: 'insensitive' } },
        { departementCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filtrage par périmètre : un RESPONSABLE_DEPARTEMENT ne voit que les demandes de son département
    const isAdmin = currentUser.role === 'ADMINISTRATEUR';
    const isDirection = currentUser.role === 'DIRECTION';
    if (!isAdmin && !isDirection && currentUser.departments?.length) {
      where.departementCode = { in: currentUser.departments };
    }

    const [demandes, total] = await Promise.all([
      this.prisma.demandeModification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          semestre: { select: { id: true, numero: true } },
          auteur: { select: { id: true, email: true, firstName: true, lastName: true } },
          traiteePar: { select: { id: true, email: true } },
        },
      }),
      this.prisma.demandeModification.count({ where }),
    ]);

    return {
      data: demandes.map((d) => toDemandeDto(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDemandeById(id: string): Promise<DemandeResponseDto> {
    const demande = await this.prisma.demandeModification.findUnique({
      where: { id },
      include: {
        semestre: { select: { id: true, numero: true } },
        auteur: { select: { id: true, email: true, firstName: true, lastName: true } },
        traiteePar: { select: { id: true, email: true } },
      },
    });
    if (!demande) {
      throw new NotFoundException(`Demande ${id} introuvable`);
    }
    return toDemandeDto(demande);
  }

  async traiterDemande(
    id: string,
    dto: TraiterDemandeDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<DemandeResponseDto> {
    const demande = await this.prisma.demandeModification.findUnique({
      where: { id },
    });
    if (!demande) {
      throw new NotFoundException(`Demande ${id} introuvable`);
    }

    if (demande.statut !== DemandeStatut.OUVERTE) {
      throw new ConflictException(
        `Cette demande a déjà été traitée (statut actuel: ${demande.statut})`,
      );
    }

    // Filtrage par périmètre : un RESPONSABLE_DEPARTEMENT ne peut traiter que les demandes de son département
    const isAdmin = currentUser.role === 'ADMINISTRATEUR';
    const isDirection = currentUser.role === 'DIRECTION';
    if (!isAdmin && !isDirection && currentUser.departments?.length) {
      if (!currentUser.departments.includes(demande.departementCode)) {
        throw new BadRequestException(
          'OUT_OF_SCOPE : cette demande n\'appartient pas à votre département',
        );
      }
    }

    const updated = await this.audit.auditTransaction<any>(
      async (tx) => {
        const u = await tx.demandeModification.update({
          where: { id },
          data: {
            statut: dto.statut as DemandeStatut,
            reponse: dto.reponse ?? null,
            traiteePar: currentUser.id,
            traiteeLe: new Date(),
          },
        });

        // Notification DEMANDE_TRAITEE à l'auteur (SF §14)
        await this.notifications.creerNotifications(tx, [
          {
            destinataireId: demande.auteurId,
            demandeId: id,
            evenement: EvenementNotification.DEMANDE_TRAITEE,
            titre: `Votre demande a été traitée (${dto.statut})`,
            lien: `/demandes/${id}`,
          },
        ]);

        return u;
      },
      {
        userId: currentUser.id,
        action: 'UPDATE',
        objetType: 'DemandeModification',
        objetId: id,
        motif: `Traitement demande ${id}: statut=${dto.statut}`,
      },
    );

    return toDemandeDto(updated);
  }
}