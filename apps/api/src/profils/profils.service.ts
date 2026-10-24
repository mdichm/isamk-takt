// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service des profils de génération (L4-10)
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { WriteAuditDto } from '../audit/dto/audit.dto.js';
import {
  CreateProfilDto,
  UpdateProfilDto,
  ProfilResponseDto,
} from './dto/index.js';
import { SetDefaultProfilDto } from './dto/set-default-profil.dto.js';

const DEFAULT_GRAINES: number[] = [10, 11, 12, 20, 21, 22];
const DEFAULT_DUREE_LIMITE_MINUTES = 120;

function toDto(profil: {
  id: string;
  semestreId: string;
  nom: string;
  numero: number;
  estParDefaut: boolean;
  dureeLimiteMinutes: number;
  preserverVerrous: boolean;
  engineVersion: string | null;
  constructeurVersion: string | null;
  graines: unknown;
  poidsScore: unknown;
  valeursSnapshot: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ProfilResponseDto {
  return {
    id: profil.id,
    semestreId: profil.semestreId,
    nom: profil.nom,
    numero: profil.numero,
    estParDefaut: profil.estParDefaut,
    dureeLimiteMinutes: profil.dureeLimiteMinutes,
    preserverVerrous: profil.preserverVerrous,
    engineVersion: profil.engineVersion ?? undefined,
    constructeurVersion: profil.constructeurVersion ?? undefined,
    graines: Array.isArray(profil.graines) ? profil.graines : [],
    poidsScore:
      typeof profil.poidsScore === 'object' && profil.poidsScore !== null
        ? (profil.poidsScore as Record<string, unknown>)
        : {},
    valeursSnapshot:
      typeof profil.valeursSnapshot === 'object' &&
      profil.valeursSnapshot !== null
        ? (profil.valeursSnapshot as Record<string, unknown>)
        : {},
    createdAt: profil.createdAt,
    updatedAt: profil.updatedAt,
  };
}

@Injectable()
export class ProfilsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ============================================
  // Création d'un profil (profil:write)
  // ============================================

  async createProfil(
    semestreId: string,
    dto: CreateProfilDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ProfilResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: semestreId },
      select: { id: true },
    });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${semestreId}" introuvable`);
    }

    const graines = dto.graines ?? DEFAULT_GRAINES;
    const dureeLimiteMinutes = dto.dureeLimiteMinutes ?? DEFAULT_DUREE_LIMITE_MINUTES;
    const preserverVerrous = dto.preserverVerrous ?? false;

    const valeursSnapshot = {
      nom: dto.nom,
      dureeLimiteMinutes,
      preserverVerrous,
      engineVersion: dto.engineVersion,
      constructeurVersion: dto.constructeurVersion,
      graines,
      poidsScore: dto.poidsScore ?? {},
    };

    const profil = await this.prisma.$transaction(async (tx) => {
      const created = await (tx as unknown as PrismaService).profilGeneration.create({
        data: {
          semestreId,
          nom: dto.nom,
          numero: 1,
          estParDefaut: false,
          dureeLimiteMinutes,
          preserverVerrous,
          engineVersion: dto.engineVersion ?? null,
          constructeurVersion: dto.constructeurVersion ?? null,
          graines: graines as any,
          poidsScore: (dto.poidsScore ?? {}) as any,
          valeursSnapshot: valeursSnapshot as any,
        },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'PROFIL_CREATE',
        objetType: 'ProfilGeneration',
        objetId: created.id,
        ancienneValeur: undefined,
        nouvelleValeur: valeursSnapshot,
        motif: `Creation du profil de generation "${dto.nom}" (semestre ${semestreId})`,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(tx as unknown as PrismaService, auditData);
      return created;
    });

    return toDto(profil);
  }

  // ============================================
  // Liste des profils d'un semestre (profil:read)
  // ============================================

  async getProfils(semestreId: string): Promise<ProfilResponseDto[]> {
    const profils = await this.prisma.profilGeneration.findMany({
      where: { semestreId },
      orderBy: [{ estParDefaut: 'desc' }, { numero: 'asc' }, { createdAt: 'asc' }],
    });
    return profils.map((p) => toDto(p as any));
  }

  // ============================================
  // Détail d'un profil (profil:read)
  // ============================================

  async getProfil(id: string): Promise<ProfilResponseDto> {
    const profil = await this.prisma.profilGeneration.findUnique({
      where: { id },
    });
    if (!profil) {
      throw new NotFoundException(`Profil "${id}" introuvable`);
    }
    return toDto(profil as any);
  }

  // ============================================
  // Modification d'un profil (profil:write)
  // Règle d'immuabilité : si le profil est utilisé par au moins une génération,
  // on crée une nouvelle version (numero + 1) au lieu de modifier en place.
  // ============================================

  async updateProfil(
    id: string,
    dto: UpdateProfilDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ProfilResponseDto> {
    const existing = await this.prisma.profilGeneration.findUnique({
      where: { id },
      include: { generations: { select: { id: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Profil "${id}" introuvable`);
    }

    const newNom = dto.nom ?? existing.nom;
    const newDureeLimiteMinutes = dto.dureeLimiteMinutes ?? existing.dureeLimiteMinutes;
    const newPreserverVerrous = dto.preserverVerrous ?? existing.preserverVerrous;
    const newEngineVersion = dto.engineVersion ?? existing.engineVersion;
    const newConstructeurVersion = dto.constructeurVersion ?? existing.constructeurVersion;
    const newGraines = dto.graines ?? (Array.isArray(existing.graines) ? (existing.graines as number[]) : DEFAULT_GRAINES);
    const newPoidsScore = dto.poidsScore ?? (typeof existing.poidsScore === 'object' && existing.poidsScore !== null ? (existing.poidsScore as Record<string, unknown>) : {});
    const newValeursSnapshot = {
      nom: newNom,
      dureeLimiteMinutes: newDureeLimiteMinutes,
      preserverVerrous: newPreserverVerrous,
      engineVersion: newEngineVersion,
      constructeurVersion: newConstructeurVersion,
      graines: newGraines,
      poidsScore: newPoidsScore,
    };

    const estUtiliseParUneGeneration = existing.generations.length > 0;

    if (estUtiliseParUneGeneration) {
      return this.creerNouvelleVersion(
        existing,
        newNom,
        newDureeLimiteMinutes,
        newPreserverVerrous,
        newEngineVersion,
        newConstructeurVersion,
        newGraines as any,
        newPoidsScore as any,
        newValeursSnapshot as any,
        currentUser,
      );
    }

    return this.miseAJourEnPlace(
      id,
      existing,
      newNom,
      newDureeLimiteMinutes,
      newPreserverVerrous,
      newEngineVersion,
      newConstructeurVersion,
      newGraines as any,
      newPoidsScore as any,
      newValeursSnapshot as any,
      currentUser,
    );
  }

  // ============================================
  // Création d'une nouvelle version de profil (immuabilité)
  // ============================================

  private async creerNouvelleVersion(
    existing: {
      id: string;
      semestreId: string;
      nom: string;
      numero: number;
      dureeLimiteMinutes: number;
      preserverVerrous: boolean;
      engineVersion: string | null;
      constructeurVersion: string | null;
      graines: unknown;
      poidsScore: unknown;
      generations: { id: string }[];
    },
    newNom: string,
    newDureeLimiteMinutes: number,
    newPreserverVerrous: boolean,
    newEngineVersion: string | null,
    newConstructeurVersion: string | null,
    newGraines: any,
    newPoidsScore: any,
    newValeursSnapshot: any,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ProfilResponseDto> {
    const nouvelleVersion = (existing.numero ?? 0) + 1;
    const resultat = await this.prisma.$transaction(async (tx) => {
      const created = await (tx as unknown as PrismaService).profilGeneration.create({
        data: {
          semestreId: existing.semestreId,
          nom: newNom,
          numero: nouvelleVersion,
          estParDefaut: false,
          dureeLimiteMinutes: newDureeLimiteMinutes,
          preserverVerrous: newPreserverVerrous,
          engineVersion: newEngineVersion ?? null,
          constructeurVersion: newConstructeurVersion ?? null,
          graines: newGraines as any,
          poidsScore: newPoidsScore as any,
          valeursSnapshot: newValeursSnapshot as any,
        },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'PROFIL_VERSION_CREATE',
        objetType: 'ProfilGeneration',
        objetId: created.id,
        ancienneValeur: {
          id: existing.id,
          numero: existing.numero,
          nom: existing.nom,
          dureeLimiteMinutes: existing.dureeLimiteMinutes,
          preserverVerrous: existing.preserverVerrous,
          engineVersion: existing.engineVersion,
          constructeurVersion: existing.constructeurVersion,
          graines: existing.graines,
          poidsScore: existing.poidsScore,
        },
        nouvelleValeur: newValeursSnapshot,
        motif: `Nouvelle version (v${nouvelleVersion}) du profil "${existing.nom}" — version précédente utilisée par ${existing.generations.length} génération(s)`,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(tx as unknown as PrismaService, auditData);
      return created;
    });

    return toDto(resultat);
  }

  // ============================================
  // Mise à jour en place (profil non utilisé par une génération)
  // ============================================

  private async miseAJourEnPlace(
    id: string,
    existing: {
      id: string;
      semestreId: string;
      nom: string;
      dureeLimiteMinutes: number;
      preserverVerrous: boolean;
      engineVersion: string | null;
      constructeurVersion: string | null;
      graines: unknown;
      poidsScore: unknown;
    },
    newNom: string,
    newDureeLimiteMinutes: number,
    newPreserverVerrous: boolean,
    newEngineVersion: string | null,
    newConstructeurVersion: string | null,
    newGraines: any,
    newPoidsScore: any,
    newValeursSnapshot: any,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ProfilResponseDto> {
    const resultat = await this.prisma.$transaction(async (tx) => {
      const updated = await (tx as unknown as PrismaService).profilGeneration.update({
        where: { id },
        data: {
          nom: newNom,
          dureeLimiteMinutes: newDureeLimiteMinutes,
          preserverVerrous: newPreserverVerrous,
          engineVersion: newEngineVersion ?? null,
          constructeurVersion: newConstructeurVersion ?? null,
          graines: newGraines as any,
          poidsScore: newPoidsScore as any,
          valeursSnapshot: newValeursSnapshot as any,
        },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'PROFIL_UPDATE',
        objetType: 'ProfilGeneration',
        objetId: id,
        ancienneValeur: {
          nom: existing.nom,
          dureeLimiteMinutes: existing.dureeLimiteMinutes,
          preserverVerrous: existing.preserverVerrous,
          engineVersion: existing.engineVersion,
          constructeurVersion: existing.constructeurVersion,
          graines: existing.graines,
          poidsScore: existing.poidsScore,
        },
        nouvelleValeur: newValeursSnapshot,
        motif: `Modification du profil "${existing.nom}" (semestre ${existing.semestreId})`,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(tx as unknown as PrismaService, auditData);
      return updated;
    });

    return toDto(resultat);
  }

  // ============================================
  // Définir le profil par défaut d'un semestre (profil:write)
  // ============================================

  async setDefaultProfil(
    semestreId: string,
    dto: SetDefaultProfilDto,
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ProfilResponseDto> {
    const cible = await this.prisma.profilGeneration.findUnique({
      where: { id: dto.profilId },
    });
    if (!cible) {
      throw new NotFoundException(`Profil "${dto.profilId}" introuvable`);
    }
    if (cible.semestreId !== semestreId) {
      throw new BadRequestException(
        `Le profil "${dto.profilId}" n'appartient pas au semestre "${semestreId}"`,
      );
    }

    const resultat = await this.prisma.$transaction(async (tx) => {
      await (tx as unknown as PrismaService).profilGeneration.updateMany({
        where: { semestreId, estParDefaut: true },
        data: { estParDefaut: false },
      });

      const updated = await (tx as unknown as PrismaService).profilGeneration.update({
        where: { id: dto.profilId },
        data: { estParDefaut: true },
      });

      const auditData: WriteAuditDto = {
        userId: currentUser.id,
        action: 'PROFIL_DEFAULT_SET',
        objetType: 'ProfilGeneration',
        objetId: dto.profilId,
        ancienneValeur: undefined,
        nouvelleValeur: {
          semestreId,
          profilId: dto.profilId,
          estParDefaut: true,
        },
        motif: `Définition du profil "${cible.nom}" comme profil par défaut du semestre ${semestreId}`,
        ip: undefined,
        requestId: undefined,
      };

      await this.audit.writeAudit(tx as unknown as PrismaService, auditData);
      return updated;
    });

    return toDto(resultat);
  }

  // ============================================
  // Récupérer le profil par défaut d'un semestre (profil:read)
  // ============================================

  async getDefaultProfil(semestreId: string): Promise<ProfilResponseDto | null> {
    const profil = await this.prisma.profilGeneration.findFirst({
      where: { semestreId, estParDefaut: true },
    });
    if (!profil) {
      return null;
    }
    return toDto(profil as any);
  }
}
