// GroupeClosure — fermeture {soi, ancêtres, descendants} par groupe.
// Hiérarchie auto-référencée (Groupe.parentId / enfants).

export interface GroupeNode {
  id: string;
  parentId: string | null;
  enfants: string[];
}

export interface GroupeClosureEntry {
  soi: string;
  ancetres: string[];   // parent, grand-parent, …
  descendants: string[]; // enfants, petits-enfants, …
}

export class GroupeClosure {
  private closure = new Map<string, GroupeClosureEntry>();

  constructor(groupes: GroupeNode[]) {
    const byId = new Map<string, GroupeNode>();
    for (const g of groupes) byId.set(g.id, g);

    for (const g of groupes) {
      this.closure.set(g.id, this.computeClosure(g.id, byId));
    }
  }

  private computeClosure(id: string, byId: Map<string, GroupeNode>): GroupeClosureEntry {
    // Ancêtres (en remontant par parentId)
    const ancetres: string[] = [];
    let current: string | null = byId.get(id)?.parentId ?? null;
    while (current) {
      ancetres.push(current);
      current = byId.get(current)?.parentId ?? null;
    }

    // Descendants (BFS par enfants)
    const descendants: string[] = [];
    const seen = new Set<string>();
    const queue = [...(byId.get(id)?.enfants ?? [])];
    while (queue.length > 0) {
      const child = queue.shift()!;
      if (seen.has(child)) continue;
      seen.add(child);
      descendants.push(child);
      queue.push(...(byId.get(child)?.enfants ?? []));
    }

    return { soi: id, ancetres, descendants };
  }

  get(id: string): GroupeClosureEntry | undefined {
    return this.closure.get(id);
  }

  has(id: string): boolean {
    return this.closure.has(id);
  }

  ids(): string[] {
    return Array.from(this.closure.keys());
  }
}
