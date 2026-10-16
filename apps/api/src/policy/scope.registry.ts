import { Injectable } from '@nestjs/common';

/**
 * Résout le département d'un objet métier à partir de l'ID de ressource.
 * Chaque module métier enregistre ses résolveurs au démarrage.
 */
export type ScopeResolver = (
  id: string,
  userDepartments: string[] | undefined,
) => Promise<string | undefined | null>;

@Injectable()
export class ScopeRegistry {
  private resolvers = new Map<string, ScopeResolver>();

  register(resource: string, resolver: ScopeResolver): void {
    this.resolvers.set(resource, resolver);
  }

  resolve(resource: string): ScopeResolver | undefined {
    return this.resolvers.get(resource);
  }
}
