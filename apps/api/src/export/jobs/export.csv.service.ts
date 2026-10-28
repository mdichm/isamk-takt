// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Service de génération CSV des charges (L6-08)
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ExportFormat } from '@takt/db';

interface ExportJobWithRelations {
  id: string;
  format: ExportFormat;
  versionId: string;
  parametres: Record<string, unknown>;
  createdAt: Date;
  version: {
    id: string;
    numero: string;
  } | null;
}

interface ChargeRow {
  enseignantId: string;
  volumeBrut: number;
  chargeCalculee: number;
  chargeReference: number;
  decharges: number;
  serviceDu: number;
  ecart: number;
  heuresSup: number;
}

interface EnseignantWithDept {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  departementId: string | null;
  departement: {
    id: string;
    code: string;
    libelle: string;
  } | null;
}

interface GenerateCsvResult {
  buffer: Buffer;
  filename: string;
}

const MINUTES_PAR_HEURE = 60;

function minutesEnHeures(minutes: number): number {
  return Math.round((minutes / MINUTES_PAR_HEURE) * 100) / 100;
}

function estPlafondDepasse(ecart: number): boolean {
  return ecart > 0;
}

@Injectable()
export class ExportCsvService {
  private readonly logger = new Logger(ExportCsvService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateCsvForJob(
    exportJobId: string,
  ): Promise<GenerateCsvResult> {
    const job = await this.prisma.exportJob.findUnique({
      where: { id: exportJobId },
      include: {
        version: {
          select: { id: true, numero: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`ExportJob introuvable : ${exportJobId}`);
    }

    const versionWithRelations: ExportJobWithRelations = {
      id: job.id,
      format: job.format,
      versionId: job.versionId,
      parametres: job.parametres as Record<string, unknown>,
      createdAt: job.createdAt,
      version: job.version
        ? { id: job.version.id, numero: job.version.numero }
        : null,
    };

    // --- Résolution du Snapshot de la version ---
    const versionSnapshot = await this.prisma.versionSnapshot.findFirst({
      where: { versionId: versionWithRelations.versionId },
      include: {
        snapshot: true,
      },
    });

    if (!versionSnapshot?.snapshot) {
      throw new NotFoundException(
        `Aucun snapshot trouvé pour la version ${versionWithRelations.versionId}`,
      );
    }

    const snapshotId = versionSnapshot.snapshot.id;

    // --- Chargement des SnapshotCharge du snapshot (pas de relation Prisma vers Enseignant) ---
    const charges: ChargeRow[] = await this.prisma.snapshotCharge.findMany({
      where: {
        snapshotId,
      },
      orderBy: { enseignantId: 'asc' },
    });

    if (charges.length === 0) {
      return this.buildEmptyCsv(versionWithRelations);
    }

    // --- Chargement des enseignants avec département (jointure en code) ---
    const enseignantIds = charges.map((c) => c.enseignantId);
    const enseignants: EnseignantWithDept[] =
      await this.prisma.enseignant.findMany({
        where: {
          id: { in: enseignantIds },
        },
        include: {
          departement: true,
        },
      });

    const enseignantById = new Map(
      enseignants.map((e) => [e.id, e]),
    );

    // --- Filtrage par département si spécifié dans les paramètres ---
    const departementIds = (
      (versionWithRelations.parametres.departementIds as string[]) ?? []
    ).map((d) => d);

    const lignes: string[][] = [];

    // En-têtes
    lignes.push([
      'Enseignant',
      'Matricule',
      'Département',
      'Volume brut (h)',
      'Charge calculée (h)',
      'Charge référence (h)',
      'Service dû (h)',
      'Écart (h)',
      'Heures sup',
      'Plafond dépassé',
    ]);

    // Données
    for (const c of charges) {
      const enseignant = enseignantById.get(c.enseignantId);

      // Filtrage par département
      if (departementIds.length > 0) {
        const depId = enseignant?.departementId ?? null;
        if (!depId || !departementIds.includes(depId)) {
          continue;
        }
      }

      const departementLibelle =
        enseignant?.departement?.libelle ?? '';
      const volumeBrutH = minutesEnHeures(c.volumeBrut);
      const chargeCalculeeH = minutesEnHeures(c.chargeCalculee);
      const chargeReferenceH = minutesEnHeures(c.chargeReference);
      const serviceDuH = minutesEnHeures(c.serviceDu);
      const ecartH = minutesEnHeures(c.ecart);
      const heuresSup = c.heuresSup > 0 ? 'OUI' : 'NON';
      const plafond = estPlafondDepasse(c.ecart) ? 'OUI' : 'NON';

      lignes.push([
        enseignant
          ? `${enseignant.prenom} ${enseignant.nom}`.trim()
          : 'Inconnu',
        enseignant?.matricule ?? '',
        departementLibelle,
        volumeBrutH.toFixed(2),
        chargeCalculeeH.toFixed(2),
        chargeReferenceH.toFixed(2),
        serviceDuH.toFixed(2),
        ecartH.toFixed(2),
        heuresSup,
        plafond,
      ]);
    }

    const csvContent = lignes.map((row) => row.join(';')).join('\r\n');
    const buffer = Buffer.from(csvContent, 'utf-8');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const versionNum = versionWithRelations.version?.numero ?? 'inconnue';
    const filename = `charges-${versionNum}-${dateStr}.csv`;

    return { buffer, filename };
  }

  private buildEmptyCsv(
    versionWithRelations: ExportJobWithRelations,
  ): GenerateCsvResult {
    const lignes: string[][] = [
      [
        'Enseignant',
        'Matricule',
        'Département',
        'Volume brut (h)',
        'Charge calculée (h)',
        'Charge référence (h)',
        'Service dû (h)',
        'Écart (h)',
        'Heures sup',
        'Plafond dépassé',
      ],
      ['Aucune donnée à exporter', '', '', '', '', '', '', '', '', ''],
    ];

    const csvContent = lignes.map((row) => row.join(';')).join('\r\n');
    const buffer = Buffer.from(csvContent, 'utf-8');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const versionNum = versionWithRelations.version?.numero ?? 'inconnue';
    const filename = `charges-${versionNum}-${dateStr}.csv`;

    return { buffer, filename };
  }
}
