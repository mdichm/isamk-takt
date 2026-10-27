// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service agrégateur de consultation pour l'espace Direction (L5-29)
// Lecture seule : plannings publiés/archivés, répartition, charges, contraintes, audit, exports.
// Aucune route d'écriture n'est exposée.
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { VersionStatut } from '@takt/db';
import { PrismaService } from '../prisma/prisma.service.js';
import { SeancesService } from '../seances/seances.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RepartitionsService } from '../repartitions/repartitions.service.js';
import { ChargesService } from '../charges/charges.service.js';
import { ContrainteDefinitionService } from '../contraintes/contrainte-definition.service.js';
import type { SeanceQueryDto } from '../seances/dto/seance-query.dto.js';
import type { SeanceResponseDto } from '../seances/dto/seance-response.dto.js';
import type {
  RepartitionQueryDto,
  PaginatedRepartitionsDto,
} from '../repartitions/dto/repartition.dto.js';
import type {
  ChargeQueryDto,
  PaginatedChargesDto,
} from '../charges/dto/charge.dto.js';
import type {
  ContrainteDefinitionListQueryDto,
  PaginatedContrainteDefinitionsDto,
} from '../contraintes/dto/contrainte-definition.dto.js';
import { DirectionVersionDto } from './dto/direction-version.dto.js';

const PUBLISHED_STATUSES: VersionStatut[] = ['VALIDE', 'PUBLIE', 'ARCHIVE'];

@Injectable()
export class DirectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seances: SeancesService,
    private readonly audit: AuditService,
    private readonly repartitions: RepartitionsService,
    private readonly charges: ChargesService,
    private readonly contraintes: ContrainteDefinitionService,
  ) {}

  /** Liste les versions publiées ou archivées accessibles à la Direction. */
  async findVersions(): Promise<DirectionVersionDto[]> {
    const versions = await this.prisma.versionEdt.findMany({
      where: { statut: { in: PUBLISHED_STATUSES } },
      select: { id: true, statut: true, numero: true },
      orderBy: { createdAt: 'desc' },
    });
    return versions.map((v) => ({
      id: v.id,
      numero: v.numero,
      statut: v.statut,
    }));
  }

  /** Séances d'une version publiée/archivée (avec scope Direction appliqué par le service sous-jacent). */
  async findSeancesByVersion(
    versionId: string,
    query: SeanceQueryDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<{
    data: SeanceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Le SeancesService vérifie déjà que la version est PUBLIE/ARCHIVE pour DIRECTION.
    return this.seances.findSeancesByVersion(versionId, query, currentUser);
  }

  /** Détail d'une séance (lecture seule, scope Direction appliqué par le service sous-jacent). */
  async findSeanceById(
    id: string,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceResponseDto> {
    return this.seances.findSeanceById(id, currentUser);
  }

  /** Répartitions (lecture seule). */
  async findRepartitions(
    query: RepartitionQueryDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<PaginatedRepartitionsDto> {
    return this.repartitions.findAllRepartitions(query);
  }

  /** Charges (lecture seule). */
  async findCharges(
    query: ChargeQueryDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<PaginatedChargesDto> {
    return this.charges.findAllCharges(query, currentUser);
  }

  /** Définitions de contraintes (lecture seule). */
  async findContraintes(
    query: ContrainteDefinitionListQueryDto,
  ): Promise<PaginatedContrainteDefinitionsDto> {
    return this.contraintes.findAll(query);
  }

  /** Entrées d'audit (lecture seule, scope Direction appliqué par le service sous-jacent). */
  async findAudit(
    query: {
      objetType?: string;
      objetId?: string;
      userId?: string;
      from?: string;
      to?: string;
      limit?: number;
      cursor?: string;
    },
    currentUser: { id: string; role: string; departments?: string[] },
  ) {
    return this.audit.findAll(query, currentUser);
  }

  /** Métadonnées des exports officiels disponibles pour la Direction (lecture seule). */
  async findExports() {
    return [
      {
        id: 'plannings-publies',
        libelle: 'Plannings publiés',
        description: 'Export des séances des versions publiées et archivées',
        format: 'CSV',
        disponible: true,
        roles: ['DIRECTION'],
      },
      {
        id: 'repartitions',
        libelle: 'Répartitions',
        description: 'Export des répartitions par semestre et département',
        format: 'CSV',
        disponible: true,
        roles: ['DIRECTION'],
      },
      {
        id: 'charges',
        libelle: 'Charges',
        description: 'Export des charges enseignants',
        format: 'CSV',
        disponible: true,
        roles: ['DIRECTION'],
      },
      {
        id: 'audit',
        libelle: 'Journal d\'audit',
        description: 'Export des entrées d\'audit',
        format: 'CSV',
        disponible: true,
        roles: ['DIRECTION'],
      },
    ];
  }
}
