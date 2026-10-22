import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports, no-restricted-imports
import type {
  ContrainteCategorie,
  ContraintePortee,
  ContrainteInstance,
  ContrainteDefinition,
} from '@takt/db';
import type { Prisma } from '@takt/db';
import type {
  ContrainteInstanceCreateDto,
  ContrainteInstanceUpdateDto,
  ContrainteInstanceListQueryDto,
  PaginatedContrainteInstancesDto,
  ContrainteInstanceResponseDto,
  ContrainteResolutionResponseDto,
  ResoluContrainteDto,
  CoherenceReportDto,
  IncoherenceDto,
} from './dto/contrainte-instance.dto.js';

@Injectable()
export class ContrainteInstanceService {
  constructor(private prisma: PrismaService) {}

  async createContrainteInstance(
    dto: ContrainteInstanceCreateDto,
    userId: string,
  ): Promise<ContrainteInstanceResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({ where: { id: dto.semestreId } });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${dto.semestreId}" introuvable`);
    }

    const definition = await this.prisma.contrainteDefinition.findUnique({
      where: { id: dto.definitionId },
    });
    if (!definition) {
      throw new NotFoundException(`Définition de contrainte "${dto.definitionId}" introuvable`);
    }

    this.validerCibleCoherente(definition, dto);
    this.validerPoids(definition.categorie, dto.poids);

    // L3-08 : contrôle fenêtre de pause (MAX_HOURS_IN_INTERVAL) — rejeter si des séances
    // existantes violent déjà la contrainte (règle dure).
    if (definition.code === 'MAX_HOURS_IN_INTERVAL') {
      const sujetType = definition.portee;
      const sujetId =
        sujetType === 'ENSEIGNANT'
          ? dto.enseignantId ?? null
          : sujetType === 'GROUPE'
          ? dto.groupeId ?? null
          : sujetType === 'SALLE'
          ? dto.salleId ?? null
          : sujetType === 'MODULE'
          ? dto.moduleId ?? null
          : null;
      const incoherences: IncoherenceDto[] = [];
      await this.verifierFenetrePause(
        dto.semestreId,
        sujetType,
        sujetId,
        incoherences,
      );
      const erreurs = incoherences.filter((i) => i.severite === 'ERREUR');
      if (erreurs.length > 0) {
        throw new BadRequestException(
          `Fenêtre de pause violée par des séances existantes : ${erreurs
            .map((e) => e.message)
            .join('; ')}`,
        );
      }
    }

    const instance = await this.prisma.contrainteInstance.create({
      data: {
        semestreId: dto.semestreId,
        definitionId: dto.definitionId,
        enseignantId: dto.enseignantId ?? null,
        groupeId: dto.groupeId ?? null,
        salleId: dto.salleId ?? null,
        moduleId: dto.moduleId ?? null,
        params: dto.params as Prisma.InputJsonValue,
        poids: dto.poids ?? null,
        nature: dto.nature,
        commentaire: dto.commentaire ?? null,
        actif: dto.actif ?? true,
        creePar: userId,
      },
    });

    return this.toDto(instance);
  }

  async findAll(
    query: ContrainteInstanceListQueryDto,
  ): Promise<PaginatedContrainteInstancesDto> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.semestreId) where.semestreId = query.semestreId;
    if (query.definitionId) where.definitionId = query.definitionId;
    if (query.enseignantId) where.enseignantId = query.enseignantId;
    if (query.groupeId) where.groupeId = query.groupeId;
    if (query.salleId) where.salleId = query.salleId;
    if (query.moduleId) where.moduleId = query.moduleId;
    if (query.nature) where.nature = query.nature;
    if (query.actif !== undefined) where.actif = query.actif;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contrainteInstance.findMany({
        where,
        orderBy: { creeLe: 'desc' },
        skip,
        take: limit,
        include: { definition: true },
      }),
      this.prisma.contrainteInstance.count({ where }),
    ]);

    return {
      data: items.map((i) => this.toDto(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneById(id: string): Promise<ContrainteInstanceResponseDto> {
    const instance = await this.prisma.contrainteInstance.findUnique({
      where: { id },
      include: { definition: true },
    });
    if (!instance) {
      throw new NotFoundException(`Instance de contrainte "${id}" introuvable`);
    }
    return this.toDto(instance);
  }

  async updateContrainteInstance(
    id: string,
    dto: ContrainteInstanceUpdateDto,
    userId: string,
  ): Promise<ContrainteInstanceResponseDto> {
    const existing = await this.prisma.contrainteInstance.findUnique({
      where: { id },
      include: { definition: true },
    });
    if (!existing) {
      throw new NotFoundException(`Instance de contrainte "${id}" introuvable`);
    }

    const definition = existing.definition;
    const cibleMixte = {
      enseignantId: dto.enseignantId ?? existing.enseignantId,
      groupeId: dto.groupeId ?? existing.groupeId,
      salleId: dto.salleId ?? existing.salleId,
      moduleId: dto.moduleId ?? existing.moduleId,
    };

    if (dto.definitionId && dto.definitionId !== existing.definitionId) {
      const def = await this.prisma.contrainteDefinition.findUnique({
        where: { id: dto.definitionId },
      });
      if (!def) {
        throw new NotFoundException(`Définition de contrainte "${dto.definitionId}" introuvable`);
      }
      this.validerCibleCoherente(def, cibleMixte as ContrainteInstanceCreateDto);
      this.validerPoids(def.categorie, dto.poids ?? existing.poids);
    } else if (
      dto.poids !== undefined ||
      dto.enseignantId !== undefined ||
      dto.groupeId !== undefined ||
      dto.salleId !== undefined ||
      dto.moduleId !== undefined
    ) {
      this.validerCibleCoherente(definition, cibleMixte as ContrainteInstanceCreateDto);
      this.validerPoids(definition.categorie, dto.poids ?? existing.poids);
    }

    const data: Prisma.ContrainteInstanceUncheckedUpdateInput = {};
    if (dto.semestreId !== undefined) data.semestreId = dto.semestreId;
    if (dto.definitionId !== undefined) data.definitionId = dto.definitionId;
    if (dto.enseignantId !== undefined) data.enseignantId = dto.enseignantId;
    if (dto.groupeId !== undefined) data.groupeId = dto.groupeId;
    if (dto.salleId !== undefined) data.salleId = dto.salleId;
    if (dto.moduleId !== undefined) data.moduleId = dto.moduleId;
    if (dto.params !== undefined) data.params = dto.params as Prisma.InputJsonValue;
    if (dto.poids !== undefined) data.poids = dto.poids;
    if (dto.nature !== undefined) data.nature = dto.nature;
    if (dto.commentaire !== undefined) data.commentaire = dto.commentaire;
    if (dto.actif !== undefined) data.actif = dto.actif;

    const instance = await this.prisma.contrainteInstance.update({
      where: { id },
      data,
      include: { definition: true },
    });

    return this.toDto(instance);
  }

  /**
   * Résout les contraintes applicables à un sujet avec précédence.
   * - Une instance dure spécifique remplace la globale dure de même code.
   * - Les instances souples de même code s'accumulent.
   * @param semestreId ID du semestre
   * @param sujetType Type de sujet (portée)
   * @param sujetId ID du sujet (optionnel, requis sauf si GLOBALE)
   */
  async resolveContraintesPourSujet(
    semestreId: string,
    sujetType: ContraintePortee,
    sujetId?: string,
  ): Promise<ContrainteResolutionResponseDto> {
    const semestre = await this.prisma.semestre.findUnique({ where: { id: semestreId } });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${semestreId}" introuvable`);
    }

    const instances = await this.prisma.contrainteInstance.findMany({
      where: { semestreId, actif: true },
      include: { definition: true },
      orderBy: { creeLe: 'asc' },
    });

    const applicables = instances.filter((inst) => {
      if (inst.definition.portee === 'GLOBALE') {
        return true;
      }
      if (inst.definition.portee !== sujetType) {
        return false;
      }
      return this.getCibleId(inst) === sujetId;
    });

    const parCode = new Map<string, typeof applicables>();
    for (const inst of applicables) {
      const code = inst.definition.code;
      if (!parCode.has(code)) {
        parCode.set(code, []);
      }
      parCode.get(code)!.push(inst);
    }

    const resolues: ResoluContrainteDto[] = [];

    for (const [, instancesList] of parCode) {
      const dures = instancesList.filter((i) => i.definition.categorie === 'DURE');
      const souples = instancesList.filter((i) => i.definition.categorie === 'SOUPLE');

      let dureSpecifique: (typeof instancesList)[number] | undefined;
      let dureGlobale: (typeof instancesList)[number] | undefined;

      for (const inst of dures) {
        if (inst.definition.portee === 'GLOBALE') {
          dureGlobale = inst;
        } else {
          dureSpecifique = inst;
        }
      }

      if (dureSpecifique) {
        resolues.push(this.toResoluDto(dureSpecifique, null));
        if (dureGlobale) {
          resolues.push(this.toResoluDto(dureGlobale, dureSpecifique.id));
        }
      } else if (dureGlobale) {
        resolues.push(this.toResoluDto(dureGlobale, null));
      }

      for (const souple of souples) {
        resolues.push(this.toResoluDto(souple, null));
      }
    }

    return {
      semestreId,
      sujetType,
      sujetId: sujetId ?? undefined,
      contraintes: resolues,
      total: resolues.length,
    };
  }

  /**
   * Contrôle la cohérence des contraintes d'un semestre.
   * Détecte : min > max pour un même sujet, doublons, avertissement volume groupe.
   * @param semestreId ID du semestre
   */
  async verifierCoherenceSemestre(
    semestreId: string,
  ): Promise<CoherenceReportDto> {
    const semestre = await this.prisma.semestre.findUnique({ where: { id: semestreId } });
    if (!semestre) {
      throw new NotFoundException(`Semestre "${semestreId}" introuvable`);
    }

    const instances = await this.prisma.contrainteInstance.findMany({
      where: { semestreId, actif: true },
      include: { definition: true },
      orderBy: { creeLe: 'asc' },
    });

    const incoherences: IncoherenceDto[] = [];

    // --- 1. Détecter les doublons de même code sur un même sujet ---
    type InstanceWithDef = ContrainteInstance & { definition: ContrainteDefinition };
    const parSujetEtCode = new Map<string, InstanceWithDef[]>();
    for (const inst of instances) {
      const sujetKey = `${inst.definition.portee}:${this.getCibleId(inst) ?? 'globale'}`;
      const code = inst.definition.code;
      const key = `${sujetKey}:${code}`;
      if (!parSujetEtCode.has(key)) {
        parSujetEtCode.set(key, []);
      }
      parSujetEtCode.get(key)!.push(inst as InstanceWithDef);
    }

    for (const [, lst] of parSujetEtCode) {
      if (lst.length > 1) {
        const first = lst[0];
        incoherences.push({
          type: 'DOUBLON',
          code: first.definition.code,
          sujetType: first.definition.portee,
          sujetId: this.getCibleId(first) ?? undefined,
          message: `Plusieurs instances actives de "${first.definition.code}" pour le même sujet`,
          severite: 'ERREUR',
          details: { instanceIds: lst.map((i) => i.id) },
        });
      }
    }

    // --- 2. Détecter min > max pour chaque sujet ---
    const MIN_MAX_PAIRS: Record<string, string> = {
      MIN_HOURS_PER_DAY: 'MAX_HOURS_PER_DAY',
      MIN_CONTINUOUS_HOURS: 'MAX_CONTINUOUS_HOURS',
      MIN_DAYS_PER_WEEK: 'MAX_DAYS_PER_WEEK',
    };

    const sujets = new Set<string>();
    for (const inst of instances) {
      sujets.add(`${inst.definition.portee}:${this.getCibleId(inst) ?? 'globale'}`);
    }

    for (const sujetKey of sujets) {
      const [sujetType, cibleId] = sujetKey.split(':') as [
        ContraintePortee,
        string,
      ];

      const resolution = await this.resolveContraintesPourSujet(
        semestreId,
        sujetType,
        cibleId === 'globale' ? undefined : cibleId,
      );

      for (const [minCode, maxCode] of Object.entries(MIN_MAX_PAIRS)) {
        const minInst = resolution.contraintes.find(
          (c) => c.code === minCode && c.categorie === 'DURE',
        );
        const maxInst = resolution.contraintes.find(
          (c) => c.code === maxCode && c.categorie === 'DURE',
        );

        if (minInst && maxInst) {
          const minVal = this.getParamValue(minInst, 'heures') as number | undefined;
          const maxVal = this.getParamValue(maxInst, 'heures') as number | undefined;

          if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
            incoherences.push({
              type: 'MIN_MAX',
              code: minCode,
              sujetType,
              sujetId: cibleId === 'globale' ? undefined : cibleId,
              message: `${minCode} (${minVal}) > ${maxCode} (${maxVal}) pour ce sujet`,
              severite: 'ERREUR',
              details: { min: minVal, max: maxVal },
            });
          }
        }
      }

      // --- 3. Avertissement volume groupe ---
      if (sujetType === 'GROUPE' && cibleId && cibleId !== 'globale') {
        await this.verifierVolumeGroupe(
          semestreId,
          cibleId,
          resolution.contraintes,
          incoherences,
        );
      }

      // L3-08 : contrôle fenêtre de pause (MAX_HOURS_IN_INTERVAL) pour enseignant et groupe
      if (
        (sujetType === 'ENSEIGNANT' || sujetType === 'GROUPE') &&
        cibleId &&
        cibleId !== 'globale'
      ) {
        await this.verifierFenetrePause(
          semestreId,
          sujetType,
          cibleId,
          incoherences,
        );
      }
    }

    const totalErreurs = incoherences.filter((i) => i.severite === 'ERREUR').length;
    const totalAvertissements = incoherences.filter(
      (i) => i.severite === 'AVERTISSEMENT',
    ).length;

    return {
      semestreId,
      incoherences,
      totalErreurs,
      totalAvertissements,
      estCoherent: totalErreurs === 0,
    };
  }

  /**
   * Vérifie si le volume hebdo d'un groupe dépasse MAX_HOURS_PER_DAY × MAX_DAYS_PER_WEEK.
   */
  private async verifierVolumeGroupe(
    semestreId: string,
    groupeId: string,
    contraintes: ResoluContrainteDto[],
    incoherences: IncoherenceDto[],
  ): Promise<void> {
    const maxHeuresJourInst = contraintes.find(
      (c) => c.code === 'MAX_HOURS_PER_DAY' && c.categorie === 'DURE',
    );
    const maxJoursSemaineInst = contraintes.find(
      (c) => c.code === 'MAX_DAYS_PER_WEEK' && c.categorie === 'DURE',
    );

    if (!maxHeuresJourInst || !maxJoursSemaineInst) {
      return;
    }

    const maxHeuresJour =
      (this.getParamValue(maxHeuresJourInst, 'heures') as number) ?? 0;
    const maxJoursSemaine =
      (this.getParamValue(maxJoursSemaineInst, 'jours') as number) ?? 0;

    if (maxHeuresJour <= 0 || maxJoursSemaine <= 0) {
      return;
    }

    const maxVolumeMinutes = maxHeuresJour * maxJoursSemaine * 60;

    const total = await this.prisma.affectation.aggregate({
      where: {
        groupeId,
        repartition: { semestreId },
      },
      _sum: { volumeHebdoMinutes: true },
    });

    const volumeTotal = total._sum.volumeHebdoMinutes ?? 0;

    if (volumeTotal > maxVolumeMinutes) {
      incoherences.push({
        type: 'VOLUME_GROUPE',
        code: 'MAX_HOURS_PER_DAY',
        sujetType: 'GROUPE',
        sujetId: groupeId,
        message: `Volume groupe (${volumeTotal} min) dépasse le plafond autorisé (${maxVolumeMinutes} min = ${maxHeuresJour} h/jour × ${maxJoursSemaine} j/semaine)`,
        severite: 'AVERTISSEMENT',
        details: {
          volumeTotalMinutes: volumeTotal,
          maxVolumeMinutes,
          maxHeuresJour,
          maxJoursSemaine,
        },
      });
    }
  }

  /**
   * L3-08 : vérifie qu'aucune séance du sujet ne dépasse la fenêtre de pause
   * définie par MAX_HOURS_IN_INTERVAL (occupation ≤ `heures` entre `debut` et `fin`).
   * Ajoute les incohérences de type PAUSE dans le tableau fourni.
   */
  private async verifierFenetrePause(
    semestreId: string,
    sujetType: ContraintePortee,
    sujetId: string | null,
    incoherences: IncoherenceDto[],
  ): Promise<void> {
    if (!sujetId) {
      return;
    }

    const pauseInstances = await this.prisma.contrainteInstance.findMany({
      where: {
        semestreId,
        actif: true,
        definition: { code: 'MAX_HOURS_IN_INTERVAL', actif: true },
      },
      include: { definition: true },
    });

    if (pauseInstances.length === 0) {
      return;
    }

    const whereSeance: Record<string, unknown> = {
      semestreId,
    };
    if (sujetType === 'ENSEIGNANT') {
      whereSeance['enseignantId'] = sujetId;
    } else if (sujetType === 'GROUPE') {
      whereSeance['groupes'] = { some: { groupeId: sujetId } };
    } else {
      return;
    }

    const seances = await this.prisma.seance.findMany({
      where: whereSeance,
      include: { creneauDebut: true },
    });

    const seancesParJour = new Map<string, typeof seances>();
    for (const s of seances) {
      if (!s.jour || !s.creneauDebut) continue;
      const key = String(s.jour);
      if (!seancesParJour.has(key)) seancesParJour.set(key, []);
      seancesParJour.get(key)!.push(s);
    }

    for (const inst of pauseInstances) {
      const params = inst.params as Record<string, unknown>;
      const debut = params['debut'] as string | undefined;
      const fin = params['fin'] as string | undefined;
      const heures = params['heures'] as number | undefined;
      if (!debut || !fin || heures === undefined) continue;

      const debutMinutes = this.timeToMinutes(debut);
      const finMinutes = this.timeToMinutes(fin);
      const maxMinutes = heures * 60;

      for (const [jour, jourSeances] of seancesParJour) {
        let totalOccupationMinutes = 0;
        for (const s of jourSeances) {
          if (!s.creneauDebut) continue;
          const sessionStart = this.dateTimeToMinutes(s.creneauDebut.heureDebut);
          const sessionEnd = sessionStart + s.nbCreneaux * 30;
          const overlapStart = Math.max(sessionStart, debutMinutes);
          const overlapEnd = Math.min(sessionEnd, finMinutes);
          if (overlapEnd > overlapStart) {
            totalOccupationMinutes += overlapEnd - overlapStart;
          }
        }
        if (totalOccupationMinutes > maxMinutes) {
          incoherences.push({
            type: 'PAUSE',
            code: 'MAX_HOURS_IN_INTERVAL',
            sujetType,
            sujetId,
            message: `Fenêtre de pause ${debut}-${fin} dépassée le ${jour} (${totalOccupationMinutes} min > ${maxMinutes} min)`,
            severite: 'ERREUR',
            details: {
              debut,
              fin,
              heures,
              jour,
              totalOccupationMinutes,
              maxMinutes,
            },
          });
        }
      }
    }
  }

  private dateTimeToMinutes(dt: Date): number {
    return dt.getHours() * 60 + dt.getMinutes();
  }

  private timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  async removeContrainteInstance(id: string): Promise<void> {
    const existing = await this.prisma.contrainteInstance.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Instance de contrainte "${id}" introuvable`);
    }

    await this.prisma.contrainteInstance.update({
      where: { id },
      data: { actif: false },
    });
  }

  private validerCibleCoherente(
    definition: { portee: ContraintePortee; categorie: ContrainteCategorie },
    cible: ContrainteInstanceCreateDto,
  ): void {
    const portee = definition.portee;
    const champsRemplis: string[] = [];
    if (cible.enseignantId) champsRemplis.push('enseignantId');
    if (cible.groupeId) champsRemplis.push('groupeId');
    if (cible.salleId) champsRemplis.push('salleId');
    if (cible.moduleId) champsRemplis.push('moduleId');

    switch (portee) {
      case 'GLOBALE':
        if (champsRemplis.length > 0) {
          throw new BadRequestException(
            'Une contrainte de portée GLOBALE ne doit pas avoir de cible.',
          );
        }
        break;
      case 'ENSEIGNANT':
        if (champsRemplis.length !== 1 || !champsRemplis.includes('enseignantId')) {
          throw new BadRequestException(
            'Une contrainte de portée ENSEIGNANT doit cibler exactement un enseignant.',
          );
        }
        break;
      case 'GROUPE':
        if (champsRemplis.length !== 1 || !champsRemplis.includes('groupeId')) {
          throw new BadRequestException(
            'Une contrainte de portée GROUPE doit cibler exactement un groupe.',
          );
        }
        break;
      case 'SALLE':
        if (champsRemplis.length !== 1 || !champsRemplis.includes('salleId')) {
          throw new BadRequestException(
            'Une contrainte de portée SALLE doit cibler exactement une salle.',
          );
        }
        break;
      case 'MODULE':
        if (champsRemplis.length !== 1 || !champsRemplis.includes('moduleId')) {
          throw new BadRequestException(
            'Une contrainte de portée MODULE doit cibler exactement un module.',
          );
        }
        break;
    }
  }

  private validerPoids(categorie: ContrainteCategorie, poids: number | undefined | null): void {
    if (categorie === 'DURE') {
      if (poids !== undefined && poids !== null) {
        throw new BadRequestException('Une contrainte dure ne doit pas avoir de poids.');
      }
    } else {
      if (poids === undefined || poids === null) {
        throw new BadRequestException(
          'Une contrainte souple doit avoir un poids compris entre 0 et 100.',
        );
      }
      if (poids < 0 || poids > 100) {
        throw new BadRequestException(
          'Le poids d\'une contrainte souple doit être compris entre 0 et 100.',
        );
      }
    }
  }

  private toDto(instance: ContrainteInstance): ContrainteInstanceResponseDto {
    return {
      id: instance.id,
      semestreId: instance.semestreId,
      definitionId: instance.definitionId,
      enseignantId: instance.enseignantId ?? undefined,
      groupeId: instance.groupeId ?? undefined,
      salleId: instance.salleId ?? undefined,
      moduleId: instance.moduleId ?? undefined,
      params: instance.params as Record<string, unknown>,
      poids: instance.poids ?? undefined,
      nature: instance.nature,
      commentaire: instance.commentaire ?? undefined,
      actif: instance.actif,
      creePar: instance.creePar,
      creeLe: instance.creeLe,
    };
  }

  private toResoluDto(
    instance: ContrainteInstance & { definition: ContrainteDefinition },
    overridenBy: string | null,
  ): ResoluContrainteDto {
    return {
      id: instance.id,
      semestreId: instance.semestreId,
      definitionId: instance.definitionId,
      code: instance.definition.code,
      categorie: instance.definition.categorie,
      portee: instance.definition.portee,
      enseignantId: instance.enseignantId ?? undefined,
      groupeId: instance.groupeId ?? undefined,
      salleId: instance.salleId ?? undefined,
      moduleId: instance.moduleId ?? undefined,
      params: instance.params as Record<string, unknown>,
      poids: instance.poids ?? undefined,
      nature: instance.nature,
      commentaire: instance.commentaire ?? undefined,
      overridenBy,
      actif: instance.actif,
      creePar: instance.creePar,
      creeLe: instance.creeLe,
    };
  }

  private getCibleId(
    instance: ContrainteInstance & { definition: ContrainteDefinition },
  ): string | null {
    switch (instance.definition.portee) {
      case 'ENSEIGNANT':
        return instance.enseignantId ?? null;
      case 'GROUPE':
        return instance.groupeId ?? null;
      case 'SALLE':
        return instance.salleId ?? null;
      case 'MODULE':
        return instance.moduleId ?? null;
      case 'GLOBALE':
        return null;
    }
  }

  private getParamValue(
    instance: ResoluContrainteDto,
    paramName: string,
  ): unknown {
    return (instance.params as Record<string, unknown> | undefined)?.[paramName];
  }

}