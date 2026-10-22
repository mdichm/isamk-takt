// OccupancyIndex — qui occupe quel créneau (enseignant, salle, groupe).
// Construit en O(S) depuis les occupations d'une version.

export type SlotKey = string; // "${jour}|${creneauId}"

export interface SlotOccupant {
  seanceId: string;
}

export interface SlotOccupancy {
  ens: Map<string, SlotOccupant>;      // enseignantId -> occupant
  salle: Map<string, SlotOccupant>;    // salleId -> occupant
  groupe: Map<string, SlotOccupant>;   // groupeId -> occupant
}

export interface OccupationInput {
  seanceId: string;
  jour: string;
  creneauId: string;
  ressourceType: 'ENSEIGNANT' | 'SALLE' | 'GROUPE';
  ressourceId: string;
}

export class OccupancyIndex {
  private index = new Map<string, SlotOccupancy>();

  build(occupations: OccupationInput[]): void {
    this.index.clear();
    for (const o of occupations) {
      const slotKey = `${o.jour}|${o.creneauId}`;
      let slot = this.index.get(slotKey);
      if (!slot) {
        slot = { ens: new Map(), salle: new Map(), groupe: new Map() };
        this.index.set(slotKey, slot);
      }
      if (o.ressourceType === 'ENSEIGNANT') slot.ens.set(o.ressourceId, { seanceId: o.seanceId });
      else if (o.ressourceType === 'SALLE') slot.salle.set(o.ressourceId, { seanceId: o.seanceId });
      else if (o.ressourceType === 'GROUPE') slot.groupe.set(o.ressourceId, { seanceId: o.seanceId });
    }
  }

  get(slotKey: SlotKey): SlotOccupancy | undefined {
    return this.index.get(slotKey);
  }

  has(slotKey: SlotKey): boolean {
    return this.index.has(slotKey);
  }

  keys(): string[] {
    return Array.from(this.index.keys());
  }
}
