// SnapshotIndex — enseignants autorisés, volume attendu, durée par (groupe, module, type).

export interface SnapshotEntry {
  enseignantsAutorises: string[];   // ids d'enseignants autorisés
  volumeAttendu: number;            // minutes par semaine attendus
  dureeCreneaux: number;            // durée d'un créneau en minutes
}

export class SnapshotIndex {
  private index = new Map<string, SnapshotEntry>(); // key: "${groupeId}|${moduleId}|${typeEnseignementId}"

  set(groupeId: string, moduleId: string, typeEnseignementId: string, entry: SnapshotEntry): void {
    this.index.set(`${groupeId}|${moduleId}|${typeEnseignementId}`, entry);
  }

  get(groupeId: string, moduleId: string, typeEnseignementId: string): SnapshotEntry | undefined {
    return this.index.get(`${groupeId}|${moduleId}|${typeEnseignementId}`);
  }

  has(groupeId: string, moduleId: string, typeEnseignementId: string): boolean {
    return this.index.has(`${groupeId}|${moduleId}|${typeEnseignementId}`);
  }
}
