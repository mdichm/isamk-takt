// Reqs — exigences d'équipement, tags compatibles, salles autorisées par activité.

export interface ActivityReqs {
  activityTag?: string;                       // tag de l'activité (ex. CM, TD, TP)
  equipementsObligatoires: string[];          // codes d'équipement requis (OBLIGATOIRE)
  equipementsSouhaites: string[];             // codes d'équipement souhaités (SOUHAITE)
  sallesAutorisees?: string[];                // undefined = toutes les salles autorisées
  salleImposee?: string;                      // salle imposée (null = aucune)
}

export class Reqs {
  private reqs = new Map<string, ActivityReqs>(); // activityId -> ActivityReqs

  set(activityId: string, reqs: ActivityReqs): void {
    this.reqs.set(activityId, reqs);
  }

  get(activityId: string): ActivityReqs | undefined {
    return this.reqs.get(activityId);
  }

  has(activityId: string): boolean {
    return this.reqs.has(activityId);
  }
}
