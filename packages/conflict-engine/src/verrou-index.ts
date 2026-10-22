// VerrouIndex — verrous actifs par (séance, type).
// Types : CRENEAU, SALLE, ENSEIGNANT, ACTIVITE.

export class VerrouIndex {
  private verrous = new Set<string>(); // "${seanceId}|${type}"

  add(seanceId: string, type: string): void {
    this.verrous.add(`${seanceId}|${type}`);
  }

  has(seanceId: string, type: string): boolean {
    return this.verrous.has(`${seanceId}|${type}`);
  }

  delete(seanceId: string, type: string): boolean {
    return this.verrous.delete(`${seanceId}|${type}`);
  }

  size(): number {
    return this.verrous.size;
  }
}
