// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service d'import CSV/XLSX générique (L1-26)
// Simulation (dryRun), rapport ligne par ligne, contrôle magic bytes,
// parseur isolé, analyse d'impact, application transactionnelle, audit.
import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { parse as parseCsvSync } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { WriteAuditDto } from '../audit/dto/audit.dto.js';
import type { JourSemaine, ContrainteNature } from '@takt/db';

import {
  ImportEntity,
  ALL_IMPORT_ENTITIES,
  ImportCsvDto,
  ImportPreviewDto,
  ImportPreviewItem,
  ImportAction,
  ImportImpact,
  ImportResume,
  ImportResultDto,
  ImportConflict,
  MAX_IMPORT_FILE_SIZE,
} from './dto/import-csv.dto.js';

const XLSX_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const MAX_LINES_REPORTED = 500;

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async importCsv(
    entite: ImportEntity,
    dto: ImportCsvDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<ImportPreviewDto | ImportResultDto> {
    if (!ALL_IMPORT_ENTITIES.includes(entite)) {
      throw new BadRequestException(`Entité non supportée : ${entite}`);
    }

    if (!file || file.size === 0) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      throw new BadRequestException(
        `Fichier trop volumineux : ${file.size} octets (max ${MAX_IMPORT_FILE_SIZE})`,
      );
    }

    this.validateFileType(file);

    const rows = this.parseFile(file);
    if (rows.length === 0) {
      throw new BadRequestException('Le fichier ne contient aucune ligne de données');
    }

    const importId = dto.importId ?? `import_${Date.now()}`;

    if (dto.dryRun !== false) {
      return this.buildPreview(entite, rows, importId);
    }

    if (dto.confirmation !== true) {
      throw new BadRequestException(
        'La confirmation est requise pour appliquer l\'import (définir confirmation=true)',
      );
    }

    return this.audit.auditTransaction<ImportResultDto>(
      async (tx) => {
        return this.applyImport(tx, entite, rows, importId);
      },
      this.buildAuditData(userId, entite, importId, rows.length),
    );
  }

  private validateFileType(file: Express.Multer.File): void {
    const buffer = file.buffer;
    const originalName = (file.originalname ?? '').toLowerCase();

    const isXlsx = originalName.endsWith('.xlsx');
    const isCsv = originalName.endsWith('.csv');

    if (!isXlsx && !isCsv) {
      throw new BadRequestException(
        `Extension non supportée : ${file.originalname} (attendu .csv ou .xlsx)`,
      );
    }

    const header = buffer.subarray(0, 4);

    if (isXlsx) {
      if (!XLSX_SIGNATURE.every((b, i) => header[i] === b)) {
        throw new BadRequestException(
          'Le fichier .xlsx ne semble pas être un fichier Excel valide (magic bytes incorrects)',
        );
      }
    } else {
      if (XLSX_SIGNATURE.every((b, i) => header[i] === b)) {
        throw new BadRequestException(
          'Le fichier .csv contient une signature binaire XLSX ; extension incohérente',
        );
      }
      const firstBytes = buffer.subarray(0, Math.min(buffer.length, 64));
      for (let i = 0; i < firstBytes.length; i++) {
        const b = firstBytes[i];
        if (b === 0x00) {
          throw new BadRequestException(
            'Le fichier .csv contient des octets nuls ; ce n\'est pas un fichier texte valide',
          );
        }
      }
    }
  }

  private parseFile(file: Express.Multer.File): Record<string, string>[] {
    const originalName = (file.originalname ?? '').toLowerCase();
    if (originalName.endsWith('.xlsx')) {
      return this.parseXlsx(file.buffer);
    }
    return this.parseCsv(file.buffer);
  }

  private parseCsv(buffer: Buffer): Record<string, string>[] {
    const text = buffer.toString('utf-8');
    // Supprimer le BOM (Byte Order Mark) UTF-8 s'il est présent
    const cleanText = text.startsWith('\uFEFF') ? text.slice(1) : text;

    // csv-parse gère nativement : CRLF/LF, guillemets, sauts de ligne dans les champs quoted,
    // champs multivaleurs, et lignes vides.
    const records = parseCsvSync(cleanText, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
    });

    if (records.length === 0) {
      return [];
    }

    // Garantir la présence de toutes les colonnes d'en-tête dans chaque ligne
    const header = Object.keys(records[0]);
    const rows: Record<string, string>[] = [];

    for (const record of records) {
      const row: Record<string, string> = {};
      for (const col of header) {
        row[col] = (record[col] ?? '').toString();
      }
      rows.push(row);
    }

    return rows;
  }

  private parseXlsx(buffer: Buffer): Record<string, string>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Le fichier .xlsx ne contient aucune feuille de donnees');
    }
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true }) as any[][];

    if (rawRows.length === 0) {
      return [];
    }

    const headers = (rawRows[0] as (string | undefined)[]).map((h, i) =>
      (h ?? `colonne_${i + 1}`).toString().trim(),
    );

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i] as any[];
      const obj: Record<string, string> = {};
      let hasData = false;
      for (let j = 0; j < headers.length; j++) {
        const val = row[j] ?? '';
        obj[headers[j]] = String(val);
        if (String(val).trim()) hasData = true;
      }
      if (hasData) rows.push(obj);
    }

    return rows;
  }

  private async buildPreview(
    entite: ImportEntity,
    rows: Record<string, string>[],
    importId: string,
  ): Promise<ImportPreviewDto> {
    const items: ImportPreviewItem[] = [];
    const impacts: ImportImpact[] = [];
    const resume: ImportResume = { ajout: 0, modification: 0, doublon: 0, conflit: 0, erreur: 0 };

    const maxLines = Math.min(rows.length, MAX_LINES_REPORTED);

    for (let i = 0; i < maxLines; i++) {
      const row = rows[i];
      const ligne = i + 2;

      const validation = this.validateRow(entite, row, ligne);
      const referentiel = await this.verifierReferentiel(entite, row, ligne);
      const impact = await this.detecterImpactRepartitionValidee(
        this.prisma,
        entite,
        row,
        ligne,
      );
      const rowItems = [...validation.items, ...referentiel.items, ...impact.items];
      items.push(...rowItems);

      for (const item of rowItems) {
        resume[item.action] = (resume[item.action] ?? 0) + 1;
        if (item.action === 'doublon' || item.action === 'conflit') {
          impacts.push({
            entite,
            code: item.valeur,
            utiliseDans: item.targetId ? [`${entite}:${item.targetId}`] : [],
          });
        }
      }
      for (const imp of impact.impacts) {
        impacts.push(imp);
      }
    }

    if (rows.length > MAX_LINES_REPORTED) {
      items.push({
        ligne: maxLines + 2,
        colonne: '—',
        valeur: '—',
        action: 'erreur',
        message: `Fichier trop grand : seules les ${MAX_LINES_REPORTED} premières lignes sont analysées`,
        correctionAttendue: 'Réduire la taille du fichier',
      });
      resume.erreur += 1;
    }

    return {
      importId,
      entite,
      totalLignes: rows.length,
      items,
      impacts,
      resume,
    };
  }

  private validateRow(
    entite: ImportEntity,
    row: Record<string, string>,
    ligne: number,
  ): { items: ImportPreviewItem[] } {
    const items: ImportPreviewItem[] = [];

    switch (entite) {
      case ImportEntity.ENSEIGNANTS:
        items.push(...this.validateEnseignant(row, ligne));
        break;
      case ImportEntity.SALLES:
        items.push(...this.validateSalle(row, ligne));
        break;
      case ImportEntity.GROUPES:
        items.push(...this.validateGroupe(row, ligne));
        break;
      case ImportEntity.MODULES:
        items.push(...this.validateModule(row, ligne));
        break;
      case ImportEntity.INDISPONIBILITES:
        items.push(...this.validateIndisponibilite(row, ligne));
        break;
      case ImportEntity.VOEUX:
        items.push(...this.validateVoeux(row, ligne));
        break;
      case ImportEntity.CONTRAINTES:
        items.push(...this.validateContrainte(row, ligne));
        break;
      case ImportEntity.COVOITURAGE:
        items.push(...this.validateCovoiturage(row, ligne));
        break;
    }

    return { items };
  }

  private async verifierReferentiel(
    entite: ImportEntity,
    row: Record<string, string>,
    ligne: number,
  ): Promise<{ items: ImportPreviewItem[] }> {
    const items: ImportPreviewItem[] = [];
    const verifications: {
      champ: string;
      valeur: string;
      modele: string;
      appel: () => Promise<any>;
    }[] = [];

    switch (entite) {
      case ImportEntity.ENSEIGNANTS: {
        const anneeId = (row.anneeId ?? '').trim();
        const departementId = (row.departementId ?? '').trim();
        if (anneeId) {
          verifications.push({
            champ: 'anneeId',
            valeur: anneeId,
            modele: 'Annee',
            appel: () => this.prisma.annee.findUnique({ where: { id: anneeId } }),
          });
        }
        if (departementId) {
          verifications.push({
            champ: 'departementId',
            valeur: departementId,
            modele: 'Departement',
            appel: () =>
              this.prisma.departement.findUnique({ where: { id: departementId } }),
          });
        }
        break;
      }
      case ImportEntity.SALLES: {
        const departementId = (row.departementId ?? '').trim();
        if (departementId) {
          verifications.push({
            champ: 'departementId',
            valeur: departementId,
            modele: 'Departement',
            appel: () =>
              this.prisma.departement.findUnique({ where: { id: departementId } }),
          });
        }
        break;
      }
      case ImportEntity.GROUPES: {
        const niveauId = (row.niveauId ?? '').trim();
        const semestreId = (row.semestreId ?? '').trim();
        if (niveauId) {
          verifications.push({
            champ: 'niveauId',
            valeur: niveauId,
            modele: 'Niveau',
            appel: () => this.prisma.niveau.findUnique({ where: { id: niveauId } }),
          });
        }
        if (semestreId) {
          verifications.push({
            champ: 'semestreId',
            valeur: semestreId,
            modele: 'Semestre',
            appel: () => this.prisma.semestre.findUnique({ where: { id: semestreId } }),
          });
        }
        break;
      }
      case ImportEntity.MODULES: {
        const niveauId = (row.niveauId ?? '').trim();
        const typeId = (row.typeId ?? '').trim();
        if (niveauId) {
          verifications.push({
            champ: 'niveauId',
            valeur: niveauId,
            modele: 'Niveau',
            appel: () => this.prisma.niveau.findUnique({ where: { id: niveauId } }),
          });
        }
        if (typeId) {
          verifications.push({
            champ: 'typeId',
            valeur: typeId,
            modele: 'TypeEnseignement',
            appel: () =>
              this.prisma.typeEnseignement.findUnique({ where: { id: typeId } }),
          });
        }
        break;
      }
      case ImportEntity.INDISPONIBILITES: {
        const semestreId = (row.semestreId ?? '').trim();
        const enseignantId = (row.enseignantId ?? '').trim();
        const salleId = (row.salleId ?? '').trim();
        if (semestreId) {
          verifications.push({
            champ: 'semestreId',
            valeur: semestreId,
            modele: 'Semestre',
            appel: () => this.prisma.semestre.findUnique({ where: { id: semestreId } }),
          });
        }
        if (enseignantId) {
          verifications.push({
            champ: 'enseignantId',
            valeur: enseignantId,
            modele: 'Enseignant',
            appel: () =>
              this.prisma.enseignant.findUnique({ where: { id: enseignantId } }),
          });
        }
        if (salleId) {
          verifications.push({
            champ: 'salleId',
            valeur: salleId,
            modele: 'Salle',
            appel: () => this.prisma.salle.findUnique({ where: { id: salleId } }),
          });
        }
        break;
      }
      case ImportEntity.VOEUX: {
        const semestreId = (row.semestreId ?? '').trim();
        const enseignantId = (row.enseignantId ?? '').trim();
        const moduleId = (row.moduleId ?? '').trim();
        if (semestreId) {
          verifications.push({
            champ: 'semestreId',
            valeur: semestreId,
            modele: 'Semestre',
            appel: () => this.prisma.semestre.findUnique({ where: { id: semestreId } }),
          });
        }
        if (enseignantId) {
          verifications.push({
            champ: 'enseignantId',
            valeur: enseignantId,
            modele: 'Enseignant',
            appel: () =>
              this.prisma.enseignant.findUnique({ where: { id: enseignantId } }),
          });
        }
        if (moduleId) {
          verifications.push({
            champ: 'moduleId',
            valeur: moduleId,
            modele: 'Module',
            appel: () => this.prisma.module.findUnique({ where: { id: moduleId } }),
          });
        }
        break;
      }
      case ImportEntity.CONTRAINTES: {
        const semestreId = (row.semestreId ?? '').trim();
        const definitionId = (row.definitionId ?? '').trim();
        const enseignantId = (row.enseignantId ?? '').trim();
        const groupeId = (row.groupeId ?? '').trim();
        if (semestreId) {
          verifications.push({
            champ: 'semestreId',
            valeur: semestreId,
            modele: 'Semestre',
            appel: () => this.prisma.semestre.findUnique({ where: { id: semestreId } }),
          });
        }
        if (definitionId) {
          verifications.push({
            champ: 'definitionId',
            valeur: definitionId,
            modele: 'ContrainteDefinition',
            appel: () =>
              this.prisma.contrainteDefinition.findUnique({ where: { id: definitionId } }),
          });
        }
        if (enseignantId) {
          verifications.push({
            champ: 'enseignantId',
            valeur: enseignantId,
            modele: 'Enseignant',
            appel: () =>
              this.prisma.enseignant.findUnique({ where: { id: enseignantId } }),
          });
        }
        if (groupeId) {
          verifications.push({
            champ: 'groupeId',
            valeur: groupeId,
            modele: 'Groupe',
            appel: () => this.prisma.groupe.findUnique({ where: { id: groupeId } }),
          });
        }
        break;
      }
      case ImportEntity.COVOITURAGE: {
        const semestreId = (row.semestreId ?? '').trim();
        if (semestreId) {
          verifications.push({
            champ: 'semestreId',
            valeur: semestreId,
            modele: 'Semestre',
            appel: () => this.prisma.semestre.findUnique({ where: { id: semestreId } }),
          });
        }
        break;
      }
    }

    const resultats = await Promise.all(
      verifications.map((v) => v.appel().then((trouve) => ({ ...v, trouve }))),
    );
    for (const v of resultats) {
      if (!v.trouve) {
        items.push({
          ligne,
          colonne: v.champ,
          valeur: v.valeur,
          action: 'erreur',
          message: `${v.modele} introuvable pour l'ID ${v.champ}`,
          correctionAttendue: `Renseigner un ${v.champ} valide existant dans le référentiel`,
        });
      }
    }

    return { items };
  }

  /**
   * Détecte si une entité importée est déjà utilisée dans une Repartition dont le statut est VALIDEE.
   * Retourne les impacts et les items de preview à afficher lors du dryRun.
   *
   * @param prisma client Prisma (this.prisma en dryRun, tx lors de l'application transactionnelle)
   * @param entite entité importée
   * @param row ligne CSV parsée
   * @param ligne numéro de ligne du fichier (pour l'item de preview)
   */
  private async detecterImpactRepartitionValidee(
    prisma: PrismaService,
    entite: ImportEntity,
    row: Record<string, string>,
    ligne: number,
  ): Promise<{ impacts: ImportImpact[]; items: ImportPreviewItem[] }> {
    const impacts: ImportImpact[] = [];
    const items: ImportPreviewItem[] = [];

    switch (entite) {
      case ImportEntity.ENSEIGNANTS: {
        const matricule = (row.matricule ?? '').trim();
        const anneeId = (row.anneeId ?? '').trim();
        if (!matricule || !anneeId) break;
        const enseignant = await prisma.enseignant.findFirst({
          where: { matricule, anneeId },
          select: { id: true, matricule: true },
        });
        if (!enseignant) break;
        const affectations = await prisma.affectation.findMany({
          where: { enseignantId: enseignant.id },
          include: { repartition: { select: { id: true, statut: true } } },
        });
        const validees = affectations.filter((a) => a.repartition.statut === 'VALIDEE');
        if (validees.length > 0) {
          const ids = validees.map((a) => `repartition:${a.repartition.id}`);
          impacts.push({ entite, code: matricule, utiliseDans: ids });
          items.push({
            ligne,
            colonne: 'matricule',
            valeur: matricule,
            action: 'conflit',
            message: `Enseignant "${matricule}" utilisé dans ${validees.length} répartition(s) validée(s)`,
          });
        }
        break;
      }
      case ImportEntity.GROUPES: {
        const code = (row.code ?? '').trim();
        const niveauId = (row.niveauId ?? '').trim();
        const semestreId = (row.semestreId ?? '').trim();
        if (!code || !niveauId || !semestreId) break;
        const groupe = await prisma.groupe.findFirst({
          where: { code, niveauId, semestreId },
          select: { id: true, code: true },
        });
        if (!groupe) break;
        const affectations = await prisma.affectation.findMany({
          where: { groupeId: groupe.id },
          include: { repartition: { select: { id: true, statut: true } } },
        });
        const validees = affectations.filter((a) => a.repartition.statut === 'VALIDEE');
        if (validees.length > 0) {
          const ids = validees.map((a) => `repartition:${a.repartition.id}`);
          impacts.push({ entite, code: groupe.code, utiliseDans: ids });
          items.push({
            ligne,
            colonne: 'code',
            valeur: code,
            action: 'conflit',
            message: `Groupe "${code}" utilisé dans ${validees.length} répartition(s) validée(s)`,
          });
        }
        break;
      }
      case ImportEntity.MODULES: {
        const code = (row.code ?? '').trim();
        const niveauId = (row.niveauId ?? '').trim();
        const semestreNumero = parseInt((row.semestreNumero ?? '').trim(), 10);
        if (!code || !niveauId || !Number.isInteger(semestreNumero)) break;
        const module = await prisma.module.findFirst({
          where: { code, niveauId, semestreNumero },
          select: { id: true, code: true },
        });
        if (!module) break;
        const affectations = await prisma.affectation.findMany({
          where: { moduleId: module.id },
          include: { repartition: { select: { id: true, statut: true } } },
        });
        const validees = affectations.filter((a) => a.repartition.statut === 'VALIDEE');
        if (validees.length > 0) {
          const ids = validees.map((a) => `repartition:${a.repartition.id}`);
          impacts.push({ entite, code: module.code, utiliseDans: ids });
          items.push({
            ligne,
            colonne: 'code',
            valeur: code,
            action: 'conflit',
            message: `Module "${code}" utilisé dans ${validees.length} répartition(s) validée(s)`,
          });
        }
        break;
      }
      case ImportEntity.SALLES: {
        // Pas de lien direct Affectation<Salle> dans le schéma actuel : aucun impact à signaler pour l'instant.
        break;
      }
      case ImportEntity.INDISPONIBILITES: {
        const enseignantId = (row.enseignantId ?? '').trim();
        const salleId = (row.salleId ?? '').trim();
        const semestreId = (row.semestreId ?? '').trim();
        if (!semestreId) break;
        const indisponibilite = await prisma.indisponibilite.findFirst({
          where: { semestreId, enseignantId, salleId },
          select: { id: true },
        });
        if (!indisponibilite) break;
        const repartitions = await prisma.repartition.findMany({
          where: { semestreId },
          select: { id: true, statut: true },
        });
        const valideRepIds = repartitions
          .filter((r) => r.statut === 'VALIDEE')
          .map((r) => r.id);
        const affectations = await prisma.affectation.findMany({
          where: { repartitionId: { in: valideRepIds } },
        });
        if (affectations.length > 0) {
          const ids = affectations.map((a) => `repartition:${a.repartitionId}`);
          impacts.push({ entite, code: semestreId, utiliseDans: ids });
          items.push({
            ligne,
            colonne: 'semestreId',
            valeur: semestreId,
            action: 'conflit',
            message: `Indisponibilité du semestre ${semestreId} utilisée dans ${affectations.length} répartition(s) validée(s)`,
          });
        }
        break;
      }
      case ImportEntity.VOEUX: {
        const enseignantId = (row.enseignantId ?? '').trim();
        const moduleId = (row.moduleId ?? '').trim();
        const semestreId = (row.semestreId ?? '').trim();
        if (!enseignantId || !moduleId || !semestreId) break;
        const existing = await prisma.enseignantModule.findFirst({
          where: { enseignantId, moduleId },
          select: { enseignantId: true, moduleId: true },
        });
        if (!existing) break;
        const repartitions = await prisma.repartition.findMany({
          where: { semestreId },
          select: { id: true, statut: true },
        });
        const valideRepIds = repartitions
          .filter((r) => r.statut === 'VALIDEE')
          .map((r) => r.id);
        const affectations = await prisma.affectation.findMany({
          where: {
            repartitionId: { in: valideRepIds },
            OR: [{ enseignantId }, { moduleId }],
          },
        });
        if (affectations.length > 0) {
          const ids = affectations.map((a) => `repartition:${a.repartitionId}`);
          impacts.push({ entite, code: `${enseignantId}:${moduleId}`, utiliseDans: ids });
          items.push({
            ligne,
            colonne: 'enseignantId',
            valeur: enseignantId,
            action: 'conflit',
            message: `Vœu enseignant ${enseignantId} / module ${moduleId} impacté dans ${affectations.length} répartition(s) validée(s)`,
          });
        }
        break;
      }
      case ImportEntity.CONTRAINTES: {
        const definitionId = (row.definitionId ?? '').trim();
        const semestreId = (row.semestreId ?? '').trim();
        if (!definitionId || !semestreId) break;
        const contrainte = await prisma.contrainteInstance.findFirst({
          where: { definitionId, semestreId },
          select: { id: true },
        });
        if (!contrainte) break;
        const repartitions = await prisma.repartition.findMany({
          where: { semestreId },
          select: { id: true, statut: true },
        });
        const valideRepIds = repartitions
          .filter((r) => r.statut === 'VALIDEE')
          .map((r) => r.id);
        const affectations = await prisma.affectation.findMany({
          where: { repartitionId: { in: valideRepIds } },
        });
        if (affectations.length > 0) {
          const ids = affectations.map((a) => `repartition:${a.repartitionId}`);
          impacts.push({ entite, code: definitionId, utiliseDans: ids });
          items.push({
            ligne,
            colonne: 'definitionId',
            valeur: definitionId,
            action: 'conflit',
            message: `Contrainte ${definitionId} utilisée dans ${affectations.length} répartition(s) validée(s)`,
          });
        }
        break;
      }
      case ImportEntity.COVOITURAGE: {
        const semestreId = (row.semestreId ?? '').trim();
        if (!semestreId) break;
        const groupe = await prisma.groupeCovoiturage.findFirst({
          where: { semestreId },
          select: { id: true },
        });
        if (!groupe) break;
        const repartitions = await prisma.repartition.findMany({
          where: { semestreId },
          select: { id: true, statut: true },
        });
        const valideRepIds = repartitions
          .filter((r) => r.statut === 'VALIDEE')
          .map((r) => r.id);
        const affectations = await prisma.affectation.findMany({
          where: { repartitionId: { in: valideRepIds } },
        });
        if (affectations.length > 0) {
          const ids = affectations.map((a) => `repartition:${a.repartitionId}`);
          impacts.push({ entite, code: semestreId, utiliseDans: ids });
          items.push({
            ligne,
            colonne: 'semestreId',
            valeur: semestreId,
            action: 'conflit',
            message: `Groupe de covoiturage du semestre ${semestreId} utilisé dans ${affectations.length} répartition(s) validée(s)`,
          });
        }
        break;
      }
    }

    return { impacts, items };
  }

  private validateEnseignant(row: Record<string, string>, ligne: number): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const matricule = (row.matricule ?? '').trim();
    const nom = (row.nom ?? '').trim();
    const email = (row.email ?? '').trim();

    if (!matricule) {
      items.push({
        ligne,
        colonne: 'matricule',
        valeur: matricule,
        action: 'erreur',
        message: 'Matricule obligatoire',
        correctionAttendue: 'Renseigner le matricule de l\'enseignant',
      });
      return items;
    }
    if (!email) {
      items.push({
        ligne,
        colonne: 'email',
        valeur: email,
        action: 'erreur',
        message: 'Email obligatoire',
        correctionAttendue: 'Renseigner l\'email de l\'enseignant',
      });
      return items;
    }

    items.push({
      ligne,
      colonne: 'matricule',
      valeur: matricule,
      action: 'ajout',
      message: `Enseignant ${nom} ${matricule}`,
    });

    if (nom) {
      items.push({ ligne, colonne: 'nom', valeur: nom, action: 'ajout', message: 'Nom' });
    }
    if (email) {
      items.push({ ligne, colonne: 'email', valeur: email, action: 'ajout', message: 'Email' });
    }

    return items;
  }

  private validateSalle(row: Record<string, string>, ligne: number): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const code = (row.code ?? '').trim();
    const libelle = (row.libelle ?? '').trim();
    const capaciteMax = parseInt((row.capaciteMax ?? '').trim(), 10);

    if (!code) {
      items.push({
        ligne,
        colonne: 'code',
        valeur: code,
        action: 'erreur',
        message: 'Code salle obligatoire',
        correctionAttendue: 'Renseigner le code de la salle',
      });
      return items;
    }
    if (!Number.isInteger(capaciteMax) || capaciteMax <= 0) {
      items.push({
        ligne,
        colonne: 'capaciteMax',
        valeur: row.capaciteMax ?? '',
        action: 'erreur',
        message: 'Capacité maximale obligatoire et supérieure à 0',
        correctionAttendue: 'Renseigner une capacité entière > 0',
      });
      return items;
    }

    items.push({
      ligne,
      colonne: 'code',
      valeur: code,
      action: 'ajout',
      message: `Salle ${libelle} (capacité ${capaciteMax})`,
    });

    return items;
  }

  private validateGroupe(row: Record<string, string>, ligne: number): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const code = (row.code ?? '').trim();
    const semestreId = (row.semestreId ?? '').trim();

    if (!code) {
      items.push({
        ligne,
        colonne: 'code',
        valeur: code,
        action: 'erreur',
        message: 'Code groupe obligatoire',
        correctionAttendue: 'Renseigner le code du groupe (format NIVEAU-ABR-GRP)',
      });
      return items;
    }
    if (!semestreId) {
      items.push({
        ligne,
        colonne: 'semestreId',
        valeur: semestreId,
        action: 'erreur',
        message: 'Semestre obligatoire pour un groupe',
        correctionAttendue: 'Renseigner l\'ID du semestre',
      });
      return items;
    }

    items.push({
      ligne,
      colonne: 'code',
      valeur: code,
      action: 'ajout',
      message: `Groupe ${code}`,
    });

    return items;
  }

  private validateModule(row: Record<string, string>, ligne: number): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const code = (row.code ?? '').trim();
    const libelle = (row.libelle ?? '').trim();
    const semestreNumero = parseInt((row.semestreNumero ?? '').trim(), 10);

    if (!code) {
      items.push({
        ligne,
        colonne: 'code',
        valeur: code,
        action: 'erreur',
        message: 'Code module obligatoire',
        correctionAttendue: 'Renseigner le code du module',
      });
      return items;
    }
    if (!Number.isInteger(semestreNumero) || (semestreNumero !== 1 && semestreNumero !== 2)) {
      items.push({
        ligne,
        colonne: 'semestreNumero',
        valeur: row.semestreNumero ?? '',
        action: 'erreur',
        message: 'Semestre obligatoire (1 ou 2)',
        correctionAttendue: 'Renseigner le numéro de semestre (1 ou 2)',
      });
      return items;
    }

    items.push({
      ligne,
      colonne: 'code',
      valeur: code,
      action: 'ajout',
      message: `Module ${libelle} (S${semestreNumero})`,
    });

    return items;
  }

  private validateIndisponibilite(
    row: Record<string, string>,
    ligne: number,
  ): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const semestreId = (row.semestreId ?? '').trim();
    const jour = (row.jour ?? '').trim();
    const ordre = parseInt((row.ordre ?? '').trim(), 10);
    const enseignantId = (row.enseignantId ?? '').trim() || undefined;
    const salleId = (row.salleId ?? '').trim() || undefined;

    if (!semestreId) {
      items.push({
        ligne,
        colonne: 'semestreId',
        valeur: semestreId,
        action: 'erreur',
        message: 'Semestre obligatoire',
        correctionAttendue: 'Renseigner l\'ID du semestre',
      });
      return items;
    }
    if (!jour) {
      items.push({
        ligne,
        colonne: 'jour',
        valeur: jour,
        action: 'erreur',
        message: 'Jour obligatoire',
        correctionAttendue: 'Renseigner le jour de la semaine (LUN, MAR, MER, JEU, VEN, SAM, DIM)',
      });
      return items;
    }
    if (!Number.isInteger(ordre) || ordre < 1) {
      items.push({
        ligne,
        colonne: 'ordre',
        valeur: row.ordre ?? '',
        action: 'erreur',
        message: 'Ordre obligatoire et supérieur à 0',
        correctionAttendue: 'Renseigner un ordre entier >= 1',
      });
      return items;
    }

    items.push({
      ligne,
      colonne: 'semestreId',
      valeur: semestreId,
      action: 'ajout',
      message: `Indisponibilité ${jour} ordre ${ordre}`,
    });

    return items;
  }

  private validateVoeux(
    row: Record<string, string>,
    ligne: number,
  ): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const semestreId = (row.semestreId ?? '').trim();
    const enseignantId = (row.enseignantId ?? '').trim();
    const moduleId = (row.moduleId ?? '').trim();
    const priorite = parseInt((row.priorite ?? '1').trim(), 10);

    if (!semestreId) {
      items.push({
        ligne,
        colonne: 'semestreId',
        valeur: semestreId,
        action: 'erreur',
        message: 'Semestre obligatoire',
        correctionAttendue: 'Renseigner l\'ID du semestre',
      });
      return items;
    }
    if (!enseignantId) {
      items.push({
        ligne,
        colonne: 'enseignantId',
        valeur: enseignantId,
        action: 'erreur',
        message: 'Enseignant obligatoire',
        correctionAttendue: 'Renseigner l\'ID de l\'enseignant',
      });
      return items;
    }
    if (!moduleId) {
      items.push({
        ligne,
        colonne: 'moduleId',
        valeur: moduleId,
        action: 'erreur',
        message: 'Module obligatoire',
        correctionAttendue: 'Renseigner l\'ID du module',
      });
      return items;
    }
    if (!Number.isInteger(priorite) || priorite < 1) {
      items.push({
        ligne,
        colonne: 'priorite',
        valeur: row.priorite ?? '',
        action: 'erreur',
        message: 'Priorité obligatoire et supérieure à 0',
        correctionAttendue: 'Renseigner une priorité entière >= 1',
      });
      return items;
    }

    items.push({
      ligne,
      colonne: 'enseignantId',
      valeur: enseignantId,
      action: 'ajout',
      message: `Vœu ${enseignantId} → ${moduleId} (priorité ${priorite})`,
    });

    return items;
  }

  private validateContrainte(
    row: Record<string, string>,
    ligne: number,
  ): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const semestreId = (row.semestreId ?? '').trim();
    const definitionId = (row.definitionId ?? '').trim();
    const enseignantId = (row.enseignantId ?? '').trim() || undefined;
    const groupeId = (row.groupeId ?? '').trim() || undefined;

    if (!semestreId) {
      items.push({
        ligne,
        colonne: 'semestreId',
        valeur: semestreId,
        action: 'erreur',
        message: 'Semestre obligatoire',
        correctionAttendue: 'Renseigner l\'ID du semestre',
      });
      return items;
    }
    if (!definitionId) {
      items.push({
        ligne,
        colonne: 'definitionId',
        valeur: definitionId,
        action: 'erreur',
        message: 'Définition de contrainte obligatoire',
        correctionAttendue: 'Renseigner l\'ID de la définition de contrainte',
      });
      return items;
    }

    items.push({
      ligne,
      colonne: 'definitionId',
      valeur: definitionId,
      action: 'ajout',
      message: `Contrainte ${definitionId} (semestre ${semestreId})`,
    });

    return items;
  }

  private validateCovoiturage(
    row: Record<string, string>,
    ligne: number,
  ): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const semestreId = (row.semestreId ?? '').trim();
    const margeMinutes = parseInt((row.margeMinutes ?? '60').trim(), 10);
    const joursCommunsMin = parseInt((row.joursCommunsMin ?? '1').trim(), 10);

    if (!semestreId) {
      items.push({
        ligne,
        colonne: 'semestreId',
        valeur: semestreId,
        action: 'erreur',
        message: 'Semestre obligatoire',
        correctionAttendue: 'Renseigner l\'ID du semestre',
      });
      return items;
    }
    if (!Number.isInteger(margeMinutes) || margeMinutes < 0) {
      items.push({
        ligne,
        colonne: 'margeMinutes',
        valeur: row.margeMinutes ?? '',
        action: 'erreur',
        message: 'Marge en minutes obligatoire et supérieure ou égale à 0',
        correctionAttendue: 'Renseigner une marge entière >= 0',
      });
      return items;
    }
    if (!Number.isInteger(joursCommunsMin) || joursCommunsMin < 1) {
      items.push({
        ligne,
        colonne: 'joursCommunsMin',
        valeur: row.joursCommunsMin ?? '',
        action: 'erreur',
        message: 'Jours communs minimum obligatoire et supérieur à 0',
        correctionAttendue: 'Renseigner un nombre de jours entier >= 1',
      });
      return items;
    }

    items.push({
      ligne,
      colonne: 'semestreId',
      valeur: semestreId,
      action: 'ajout',
      message: `Groupe de covoiturage semestre ${semestreId}`,
    });

    return items;
  }

  private async applyImport(
    tx: PrismaService,
    entite: ImportEntity,
    rows: Record<string, string>[],
    importId: string,
  ): Promise<ImportResultDto> {
    const crees: string[] = [];
    const ignores: string[] = [];
    const avertissements: string[] = [];
    const conflits: ImportConflict[] = [];

    for (const row of rows) {
      try {
        const impact = await this.detecterImpactRepartitionValidee(tx, entite, row, 0);
        if (impact.impacts.length > 0) {
          throw new ConflictException(
            `Import bloqué : ${entite} "${impact.impacts[0].code}" utilisé dans une répartition validée (${impact.impacts[0].utiliseDans.join(', ')})`,
          );
        }
        const result = await this.upsertEntite(tx, entite, row, importId);
        if (result.action === 'created') {
          crees.push(result.id);
        } else if (result.action === 'ignored') {
          ignores.push(result.id);
          avertissements.push(`${entite} ${result.code} déjà présent, ignoré (idempotent)`);
        } else if (result.action === 'conflict') {
          conflits.push({ entite, code: result.code, targetId: result.id });
        }
      } catch (err) {
        this.logger.error(`Erreur sur ligne import ${entite}:`, err);
        throw new ConflictException(
          `Erreur lors de l'import de l'entité ${entite} : ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return {
      importId,
      crees,
      ignores,
      avertissements,
      conflits: conflits.length > 0 ? conflits : undefined,
    };
  }

  private async upsertEntite(
    tx: PrismaService,
    entite: ImportEntity,
    row: Record<string, string>,
    importId: string,
  ): Promise<{ action: 'created' | 'ignored' | 'conflict'; id: string; code: string }> {
    switch (entite) {
      case ImportEntity.ENSEIGNANTS:
        return this.upsertEnseignant(tx, row, importId);
      case ImportEntity.SALLES:
        return this.upsertSalle(tx, row, importId);
      case ImportEntity.GROUPES:
        return this.upsertGroupe(tx, row, importId);
      case ImportEntity.MODULES:
        return this.upsertModule(tx, row, importId);
      case ImportEntity.INDISPONIBILITES:
        return this.upsertIndisponibilite(tx, row, importId);
      case ImportEntity.VOEUX:
        return this.upsertVoeux(tx, row, importId);
      case ImportEntity.CONTRAINTES:
        return this.upsertContrainte(tx, row, importId);
      case ImportEntity.COVOITURAGE:
        return this.upsertCovoiturage(tx, row, importId);
    }
  }

  private async upsertEnseignant(
    tx: PrismaService,
    row: Record<string, string>,
    importId: string,
  ): Promise<{ action: 'created' | 'ignored' | 'conflict'; id: string; code: string }> {
    const matricule = (row.matricule ?? '').trim();
    const email = (row.email ?? '').trim();
    const nom = (row.nom ?? '').trim();
    const prenom = (row.prenom ?? '').trim();
    const telephone = (row.telephone ?? '').trim() || null;
    const departementId = (row.departementId ?? '').trim();
    const gradeId = (row.gradeId ?? '').trim() || null;
    const anneeId = (row.anneeId ?? '').trim();

    if (!matricule || !email || !departementId || !anneeId) {
      throw new ConflictException(`Enseignant ${matricule}: matricule, email, departementId et anneeId requis`);
    }

    const existing = await tx.enseignant.findFirst({
      where: { matricule, anneeId },
      select: { id: true, matricule: true },
    });

    if (existing) {
      return { action: 'ignored', id: existing.id, code: matricule };
    }

    const created = await tx.enseignant.create({
      data: {
        matricule,
        nom,
        prenom,
        email,
        telephone,
        departementId,
        gradeId,
        anneeId,
        originId: importId,
      },
      select: { id: true, matricule: true },
    });

    return { action: 'created', id: created.id, code: matricule };
  }

  private async upsertSalle(
    tx: PrismaService,
    row: Record<string, string>,
    importId: string,
  ): Promise<{ action: 'created' | 'ignored' | 'conflict'; id: string; code: string }> {
    const code = (row.code ?? '').trim();
    const libelle = (row.libelle ?? '').trim();
    const capaciteMax = parseInt((row.capaciteMax ?? '').trim(), 10);
    const siteId = (row.siteId ?? '').trim() || null;
    const departementId = (row.departementId ?? '').trim() || null;

    if (!code) {
      throw new ConflictException('Salle: code requis');
    }

    const existing = await tx.salle.findFirst({ where: { code }, select: { id: true, code: true } });
    if (existing) {
      return { action: 'ignored', id: existing.id, code };
    }

    const created = await tx.salle.create({
      data: {
        code,
        libelle: libelle || code,
        capaciteMax: Number.isInteger(capaciteMax) && capaciteMax > 0 ? capaciteMax : 1,
        siteId,
        departementId,
        originId: importId,
      },
      select: { id: true, code: true },
    });

    return { action: 'created', id: created.id, code };
  }

  private async upsertGroupe(
    tx: PrismaService,
    row: Record<string, string>,
    importId: string,
  ): Promise<{ action: 'created' | 'ignored' | 'conflict'; id: string; code: string }> {
    const code = (row.code ?? '').trim();
    const semestreId = (row.semestreId ?? '').trim();
    const niveauId = (row.niveauId ?? '').trim();
    const libelle = (row.libelle ?? '').trim();
    const parentId = (row.parentId ?? '').trim() || null;
    const effectif = parseInt((row.effectif ?? '').trim(), 10) || 0;

    if (!code || !semestreId || !niveauId) {
      throw new ConflictException(`Groupe ${code}: code, semestreId et niveauId requis`);
    }

    const existing = await tx.groupe.findFirst({
      where: { code, niveauId, semestreId },
      select: { id: true, code: true },
    });

    if (existing) {
      return { action: 'ignored', id: existing.id, code };
    }

    const created = await tx.groupe.create({
      data: {
        code,
        libelle: libelle || code,
        niveauId,
        semestreId,
        parentId,
        effectif: Number.isInteger(effectif) && effectif >= 0 ? effectif : 0,
        type: 'SECTION',
        originId: importId,
      },
      select: { id: true, code: true },
    });

    return { action: 'created', id: created.id, code };
  }

  private async upsertModule(
    tx: PrismaService,
    row: Record<string, string>,
    importId: string,
  ): Promise<{ action: 'created' | 'ignored' | 'conflict'; id: string; code: string }> {
    const code = (row.code ?? '').trim();
    const libelle = (row.libelle ?? '').trim();
    const niveauId = (row.niveauId ?? '').trim();
    const semestreNumero = parseInt((row.semestreNumero ?? '').trim(), 10);
    const typeId = (row.typeId ?? '').trim();

    if (!code || !niveauId || !typeId) {
      throw new ConflictException(`Module ${code}: code, niveauId et typeId requis`);
    }

    if (!Number.isInteger(semestreNumero) || (semestreNumero !== 1 && semestreNumero !== 2)) {
      throw new ConflictException(`Module ${code}: semestreNumero doit être 1 ou 2`);
    }

    const existing = await tx.module.findFirst({
      where: { code, niveauId, semestreNumero },
      select: { id: true, code: true },
    });

    if (existing) {
      return { action: 'ignored', id: existing.id, code };
    }

    const created = await tx.module.create({
      data: {
        code,
        libelle: libelle || code,
        niveauId,
        typeId,
        semestreNumero,
        originId: importId,
      },
      select: { id: true, code: true },
    });

    return { action: 'created', id: created.id, code };
  }

  private async upsertIndisponibilite(
    tx: PrismaService,
    row: Record<string, string>,
    importId: string,
  ): Promise<{ action: 'created' | 'ignored' | 'conflict'; id: string; code: string }> {
    const semestreId = (row.semestreId ?? '').trim();
    const jour = (row.jour ?? '').trim();
    const ordre = parseInt((row.ordre ?? '').trim(), 10);
    const enseignantId = (row.enseignantId ?? '').trim() || null;
    const salleId = (row.salleId ?? '').trim() || null;
    const estActive = (row.estActive ?? 'true').trim() !== 'false';

    if (!semestreId || !jour || !Number.isInteger(ordre) || ordre < 1) {
      throw new ConflictException(
        `Indisponibilite ${semestreId}: semestreId, jour et ordre (>=1) requis`,
      );
    }

    const existing = await tx.indisponibilite.findFirst({
      where: { semestreId, jour: jour as JourSemaine, ordre, enseignantId, salleId },
      select: { id: true },
    });

    if (existing) {
      return { action: 'ignored', id: existing.id, code: `${semestreId}:${jour}:${ordre}` };
    }

    const created = await tx.indisponibilite.create({
      data: {
        semestreId,
        jour: jour as JourSemaine,
        ordre,
        enseignantId,
        salleId,
        estActive,
        originId: importId,
      },
      select: { id: true },
    });

    return { action: 'created', id: created.id, code: `${semestreId}:${jour}:${ordre}` };
  }

  private async upsertVoeux(
    tx: PrismaService,
    row: Record<string, string>,
    importId: string,
  ): Promise<{ action: 'created' | 'ignored' | 'conflict'; id: string; code: string }> {
    const semestreId = (row.semestreId ?? '').trim();
    const enseignantId = (row.enseignantId ?? '').trim();
    const moduleId = (row.moduleId ?? '').trim();
    const priorite = parseInt((row.priorite ?? '1').trim(), 10);

    if (!semestreId || !enseignantId || !moduleId) {
      throw new ConflictException(
        `Voeux ${enseignantId}:${moduleId}: semestreId, enseignantId et moduleId requis`,
      );
    }

    const existing = await tx.enseignantModule.findFirst({
      where: { enseignantId, moduleId },
      select: { enseignantId: true, moduleId: true },
    });

    if (existing) {
      return { action: 'ignored', id: `${enseignantId}:${moduleId}`, code: `${enseignantId}:${moduleId}` };
    }

    const created = await tx.enseignantModule.create({
      data: {
        enseignantId,
        moduleId,
      },
      select: { enseignantId: true, moduleId: true },
    });

    return { action: 'created', id: `${created.enseignantId}:${created.moduleId}`, code: `${enseignantId}:${moduleId}` };
  }

  private async upsertContrainte(
    tx: PrismaService,
    row: Record<string, string>,
    importId: string,
  ): Promise<{ action: 'created' | 'ignored' | 'conflict'; id: string; code: string }> {
    const semestreId = (row.semestreId ?? '').trim();
    const definitionId = (row.definitionId ?? '').trim();
    const enseignantId = (row.enseignantId ?? '').trim() || null;
    const groupeId = (row.groupeId ?? '').trim() || null;
    const salleId = (row.salleId ?? '').trim() || null;
    const moduleId = (row.moduleId ?? '').trim() || null;
    const poids = parseInt((row.poids ?? '').trim(), 10) || undefined;
    const nature = (row.nature ?? 'REGLE') as ContrainteNature;
    const commentaire = (row.commentaire ?? '').trim() || null;
    const creePar = (row.creePar ?? '').trim() || '';

    if (!semestreId || !definitionId) {
      throw new ConflictException(
        `Contrainte ${definitionId}: semestreId et definitionId requis`,
      );
    }

    const existing = await tx.contrainteInstance.findFirst({
      where: { semestreId, definitionId, enseignantId, groupeId, salleId, moduleId },
      select: { id: true },
    });

    if (existing) {
      return { action: 'ignored', id: existing.id, code: definitionId };
    }

    let paramsJson: any = {};
    try {
      paramsJson = (row.params ?? '').trim() ? JSON.parse(row.params) : {};
    } catch {
      paramsJson = {};
    }

    const created = await tx.contrainteInstance.create({
      data: {
        semestreId,
        definitionId,
        enseignantId,
        groupeId,
        salleId,
        moduleId,
        poids,
        nature,
        commentaire,
        creePar,
        params: paramsJson,
        originId: importId,
      },
      select: { id: true },
    });

    return { action: 'created', id: created.id, code: definitionId };
  }

  private async upsertCovoiturage(
    tx: PrismaService,
    row: Record<string, string>,
    importId: string,
  ): Promise<{ action: 'created' | 'ignored' | 'conflict'; id: string; code: string }> {
    const semestreId = (row.semestreId ?? '').trim();
    const margeMinutes = parseInt((row.margeMinutes ?? '60').trim(), 10);
    const joursCommunsMin = parseInt((row.joursCommunsMin ?? '1').trim(), 10);
    const strict = (row.strict ?? 'false').trim() === 'true';
    const enseignantIds = (row.enseignantIds ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!semestreId) {
      throw new ConflictException(`Covoiturage ${semestreId}: semestreId requis`);
    }

    const existing = await tx.groupeCovoiturage.findFirst({
      where: { semestreId },
      select: { id: true },
    });

    if (existing) {
      return { action: 'ignored', id: existing.id, code: semestreId };
    }

    const created = await tx.groupeCovoiturage.create({
      data: {
        semestreId,
        margeMinutes: Number.isInteger(margeMinutes) && margeMinutes >= 0 ? margeMinutes : 60,
        joursCommunsMin: Number.isInteger(joursCommunsMin) && joursCommunsMin >= 1 ? joursCommunsMin : 1,
        strict,
        enseignantIds,
        originId: importId,
      },
      select: { id: true },
    });

    return { action: 'created', id: created.id, code: semestreId };
  }

  private buildAuditData(
    userId: string,
    entite: ImportEntity,
    importId: string,
    totalLignes: number,
  ): WriteAuditDto {
    return {
      userId,
      action: `IMPORT_CSV_${entite.toUpperCase()}`,
      objetType: 'ImportCsv',
      objetId: importId,
      nouvelleValeur: { entite, totalLignes, importId },
      motif: `Import CSV/XLSX de ${totalLignes} ligne(s) pour l'entité ${entite}`,
      requestId: importId,
    };
  }
}
