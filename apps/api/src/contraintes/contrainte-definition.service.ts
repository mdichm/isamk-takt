import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ContrainteDefinition } from '@takt/db';
import {
  ContrainteDefinitionListQueryDto,
  PaginatedContrainteDefinitionsDto,
  ContrainteDefinitionResponseDto,
} from './dto/contrainte-definition.dto.js';

@Injectable()
export class ContrainteDefinitionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Liste les définitions de contraintes du catalogue.
   * Lecture seule : aucune mutation exposée dans L3-01.
   */
  async findAll(
    query: ContrainteDefinitionListQueryDto,
  ): Promise<PaginatedContrainteDefinitionsDto> {
    const {
      actif = true,
      categorie,
      portee,
      classe,
      traductionFET,
      page = 1,
      limit = 50,
    } = query;

    const where: Record<string, unknown> = {};

    if (actif !== undefined) {
      where.actif = actif;
    }

    if (categorie) {
      where.categorie = categorie;
    }

    if (portee) {
      where.portee = portee;
    }

    if (classe) {
      where.classe = classe;
    }

    if (traductionFET) {
      where.traductionFET = traductionFET;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contrainteDefinition.findMany({
        where,
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contrainteDefinition.count({ where }),
    ]);

    return {
      data: items.map((d) => this.toDto(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupère une définition par son code.
   */
  async findOneByCode(code: string): Promise<ContrainteDefinitionResponseDto> {
    const definition = await this.prisma.contrainteDefinition.findUnique({
      where: { code },
    });
    if (!definition) {
      throw new NotFoundException(`Définition de contrainte introuvable : ${code}`);
    }
    return this.toDto(definition);
  }

  /**
   * Récupère une définition par son ID.
   */
  async findOneById(id: string): Promise<ContrainteDefinitionResponseDto> {
    const definition = await this.prisma.contrainteDefinition.findUnique({
      where: { id },
    });
    if (!definition) {
      throw new NotFoundException(`Définition de contrainte introuvable : ${id}`);
    }
    return this.toDto(definition);
  }

  /**
   * Valide les paramètres d'une instance contre le paramsSchema de la définition.
   * Validation applicative légère (JSON Schema minimal) avant écriture d'une instance.
   */
  validateParams(definition: ContrainteDefinition, params: unknown): void {
    if (!definition.paramsSchema) {
      return;
    }

    const schema = definition.paramsSchema as Record<string, unknown>;
    const required = (schema.required as string[] | undefined) ?? [];

    if (params === null || params === undefined || typeof params !== 'object') {
      throw new Error('Les paramètres doivent être un objet JSON');
    }

    const obj = params as Record<string, unknown>;

    for (const field of required) {
      if (!(field in obj)) {
        throw new Error(`Paramètre requis manquant : ${field}`);
      }
    }

    const properties = (schema.properties as Record<string, unknown> | undefined) ?? {};

    for (const [field, value] of Object.entries(obj)) {
      const propSchema = properties[field] as Record<string, unknown> | undefined;
      if (!propSchema) {
        continue;
      }

      const type = propSchema.type as string | undefined;

      if (type === 'integer' && (typeof value !== 'number' || !Number.isInteger(value))) {
        throw new Error(`Le paramètre ${field} doit être un entier`);
      }

      if (type === 'number' && typeof value !== 'number') {
        throw new Error(`Le paramètre ${field} doit être un nombre`);
      }

      if (type === 'string' && typeof value !== 'string') {
        throw new Error(`Le paramètre ${field} doit être une chaîne`);
      }

      if (type === 'boolean' && typeof value !== 'boolean') {
        throw new Error(`Le paramètre ${field} doit être un booléen`);
      }

      const minimum = (propSchema.minimum as number | undefined) ?? Number.MIN_SAFE_INTEGER;
      const maximum = (propSchema.maximum as number | undefined) ?? Number.MAX_SAFE_INTEGER;

      if (typeof value === 'number') {
        if (value < minimum) {
          throw new Error(`Le paramètre ${field} doit être >= ${minimum}`);
        }
        if (value > maximum) {
          throw new Error(`Le paramètre ${field} doit être <= ${maximum}`);
        }
      }
    }
  }

  private toDto(definition: ContrainteDefinition): ContrainteDefinitionResponseDto {
    return {
      id: definition.id,
      code: definition.code,
      libelle: definition.libelle,
      categorie: definition.categorie,
      portee: definition.portee,
      classe: definition.classe,
      traductionFET: definition.traductionFET,
      paramsSchema: definition.paramsSchema as Record<string, unknown>,
      fetSupport: definition.fetSupport,
      actif: definition.actif,
    };
  }
}