// IndispoSet — indisponibilités enseignant / salle par (jour, ordre de créneau).

export class IndispoSet {
  private set = new Set<string>(); // "${ressourceType}|${ressourceId}|${jour}|${ordre}"

  add(ressourceType: string, ressourceId: string, jour: string, ordre: number): void {
    this.set.add(`${ressourceType}|${ressourceId}|${jour}|${ordre}`);
  }

  has(ressourceType: string, ressourceId: string, jour: string, ordre: number): boolean {
    return this.set.has(`${ressourceType}|${ressourceId}|${jour}|${ordre}`);
  }

  size(): number {
    return this.set.size;
  }
}
