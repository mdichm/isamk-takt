// VerrouIndex — verrous actifs par (séance, type).
// Types : CRENEAU, SALLE, ENSEIGNANT, ACTIVITE.

export class VerrouIndex {
  private verrous = new Set<string>(); // "${seanceId}|${type}"
  private verrousOverridables = new Set<string>(); // "${seanceId}|${type}" overridables

  add(seanceId: string, type: string, overridable = false): void {
    this.verrous.add(`${seanceId}|${type}`);
    if (overridable) {
      this.verrousOverridables.add(`${seanceId}|${type}`);
    }
  }

  has(seanceId: string, type: string): boolean {
    return this.verrous.has(`${seanceId}|${type}`);
  }

  getOverride(seanceId: string, type: string): boolean {
    return this.verrousOverridables.has(`${seanceId}|${type}`);
  }

  delete(seanceId: string, type: string): boolean {
    this.verrousOverridables.delete(`${seanceId}|${type}`);
    return this.verrous.delete(`${seanceId}|${type}`);
  }

  size(): number {
    return this.verrous.size;
  }
}
