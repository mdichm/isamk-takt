import { describe, it, expect } from 'vitest';
import {
  computeConflicts,
  impactedSeances,
  type Placement,
} from './recompute.js';
import {
  type SeanceInput,
  type ConflictContext,
} from './validate-placement.js';
import { OccupancyIndex } from './occupancy-index.js';
import { GroupeClosure } from './groupe-closure.js';
import { IndispoSet } from './indispo-set.js';
import { Reqs } from './reqs.js';
import { SnapshotIndex } from './snapshot-index.js';
import { VerrouIndex } from './verrou-index.js';

function makeCtx(overrides: Partial<ConflictContext> = {}): ConflictContext {
  const salles = new Map<string, { id: string; capaciteMax: number; capaciteRecommandee?: number }>([
    ['r1', { id: 'r1', capaciteMax: 30, capaciteRecommandee: 25 }],
    ['r2', { id: 'r2', capaciteMax: 100, capaciteRecommandee: 80 }],
  ]);
  const creneaux = new Map<string, { estPause: boolean; ordre: number; jour: string; heureDebutMinutes: number }>([
    ['c1', { estPause: false, ordre: 1, jour: 'LUNDI', heureDebutMinutes: 480 }],
    ['c2', { estPause: false, ordre: 2, jour: 'LUNDI', heureDebutMinutes: 540 }],
    ['c3', { estPause: false, ordre: 3, jour: 'LUNDI', heureDebutMinutes: 600 }],
  ]);
  const grille = {
    consecutifs: (jour: string, creneauDebut: string, nb: number): string[] | null => {
      const slots: string[] = [];
      for (let i = 0; i < nb; i++) slots.push(`${jour}|c${1 + i}`);
      return slots;
    },
  };
  return {
    versionId: 'v1',
    grille,
    occ: new OccupancyIndex(),
    indispo: new IndispoSet(),
    reqs: new Reqs(),
    snapshot: new SnapshotIndex(),
    verrous: new VerrouIndex(),
    salles,
    salleEquipements: new Map(),
    salleTags: new Map(),
    creneaux,
    groupeEffectifs: new Map([['g1', 20], ['g2', 20], ['g3', 20]]),
    covoiturageGroupes: new Map(),
    ...overrides,
  };
}

function makeSeance(overrides: Partial<SeanceInput> = {}): SeanceInput {
  return {
    id: 's1', enseignantId: 'e1', salleId: 'r1', groupes: ['g1'], nbCreneaux: 1,
    tag: 'CM', moduleId: 'm1', typeEnseignementId: 't1', statut: 'PLACEE', versionId: 'v1', ...overrides,
  };
}

function seancesWithPlacement(
  seances: SeanceInput[],
  placementOverrides: Record<string, Partial<Placement>> = {},
): { seance: SeanceInput; jour: string; creneauDebut: string; salle: string }[] {
  return seances.map((s) => {
    const p = placementOverrides[s.id] ?? {};
    return {
      seance: s,
      jour: p.jour ?? 'LUNDI',
      creneauDebut: p.creneauDebut ?? 'c1',
      salle: p.salle ?? s.salleId,
    };
  });
}

// ============================================================================
// computeConflicts
// ============================================================================

describe('computeConflicts', () => {
  it('aucun conflit sur des créneaux libres', () => {
    const ctx = makeCtx();
    const seances = [makeSeance({ id: 's1' })];
    const c = computeConflicts(seancesWithPlacement(seances), ctx);
    expect(c).toEqual([]);
  });

  it('détecte TEACHER_DOUBLE_BOOKING entre deux séances', () => {
    const ctx = makeCtx();
    ctx.occ.build([
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
    ]);
    const seances = [
      makeSeance({ id: 's1', enseignantId: 'e1' }),
      makeSeance({ id: 's2', enseignantId: 'e1', salleId: 'r2' }),
    ];
    const c = computeConflicts(seancesWithPlacement(seances), ctx);
    expect(c.some(x => x.regleCode === 'TEACHER_DOUBLE_BOOKING')).toBe(true);
    expect(c.some(x => x.severite === 'BLOQUANT')).toBe(true);
  });

  it('détecte ROOM_DOUBLE_BOOKING entre deux séances', () => {
    const ctx = makeCtx();
    ctx.occ.build([
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' },
    ]);
    const seances = [
      makeSeance({ id: 's1', enseignantId: 'e1', salleId: 'r1' }),
      makeSeance({ id: 's2', enseignantId: 'e2', salleId: 'r1' }),
    ];
    const c = computeConflicts(seancesWithPlacement(seances), ctx);
    expect(c.some(x => x.regleCode === 'ROOM_DOUBLE_BOOKING')).toBe(true);
  });

  it('ajoute SESSION_UNPLACED pour une séance NON_PLACEE', () => {
    const ctx = makeCtx();
    const seances = [makeSeance({ id: 's1', statut: 'NON_PLACEE' })];
    const c = computeConflicts(seancesWithPlacement(seances), ctx);
    expect(c.some(x => x.regleCode === 'SESSION_UNPLACED')).toBe(true);
    expect(c.some(x => x.severite === 'BLOQUANT')).toBe(true);
  });

  it('chaque conflit possède une signature de 64 caractères', () => {
    const ctx = makeCtx();
    ctx.occ.build([
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
    ]);
    const seances = [
      makeSeance({ id: 's1', enseignantId: 'e1' }),
      makeSeance({ id: 's2', enseignantId: 'e1', salleId: 'r2' }),
    ];
    const c = computeConflicts(seancesWithPlacement(seances), ctx);
    for (const conflit of c) {
      expect(conflit.signature).toHaveLength(64);
    }
  });

  it('recalcul incrémental = recalcul complet sur un scénario simple', () => {
    const ctx = makeCtx();
    ctx.occ.build([
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r2' },
      { seanceId: 's3', jour: 'LUNDI', creneauId: 'c2', ressourceType: 'ENSEIGNANT', ressourceId: 'e3' },
      { seanceId: 's3', jour: 'LUNDI', creneauId: 'c2', ressourceType: 'SALLE', ressourceId: 'r2' },
    ]);
    const seances = [
      makeSeance({ id: 's1', enseignantId: 'e1', salleId: 'r1' }),
      makeSeance({ id: 's2', enseignantId: 'e1', salleId: 'r2' }),
      makeSeance({ id: 's3', enseignantId: 'e3', salleId: 'r2' }),
    ];

    const complet = computeConflicts(seancesWithPlacement(seances, { s3: { creneauDebut: 'c2' } }), ctx);

    // On déplace s1 de c1/salle r1 vers c2/salle r1
    // Impactées : s2 (même enseignant e1 sur c1) ; pas s3 (différent enseignant et salle sur c2)
    const impactes = impactedSeances(
      seances[0],
      { jour: 'LUNDI', creneauDebut: 'c1', salle: 'r1' },
      { jour: 'LUNDI', creneauDebut: 'c2', salle: 'r1' },
      ctx,
    );
    expect(impactes).toContain('s2');
    expect(impactes).not.toContain('s3');
    expect(impactes).not.toContain('s1');

    const seancesImpactes = seances.filter((s) => impactes.includes(s.id));
    const incrementale = computeConflicts(
      seancesWithPlacement(seancesImpactes, { s1: { creneauDebut: 'c2' } }),
      ctx,
    );

    const completNonImpactes = complet.filter((c) => !c.seanceIds.some((id) => impactes.includes(id)));
    const incrementaleNonImpactes = incrementale.filter((c) => !c.seanceIds.some((id) => impactes.includes(id)));
    expect(completNonImpactes).toEqual(incrementaleNonImpactes);
  });
});

// ============================================================================
// impactedSeances
// ============================================================================

describe('impactedSeances', () => {
  it('retourne les séances partageant le même enseignant', () => {
    const ctx = makeCtx();
    ctx.occ.build([
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r2' },
      { seanceId: 's3', jour: 'LUNDI', creneauId: 'c2', ressourceType: 'ENSEIGNANT', ressourceId: 'e3' },
      { seanceId: 's3', jour: 'LUNDI', creneauId: 'c2', ressourceType: 'SALLE', ressourceId: 'r3' },
    ]);
    const seance = makeSeance({ id: 's1', enseignantId: 'e1', salleId: 'r1' });
    const impactes = impactedSeances(
      seance,
      { jour: 'LUNDI', creneauDebut: 'c1', salle: 'r1' },
      { jour: 'LUNDI', creneauDebut: 'c2', salle: 'r2' },
      ctx,
    );
    expect(impactes).toContain('s2');
    expect(impactes).not.toContain('s3');
    expect(impactes).not.toContain('s1');
  });

  it('retourne les séances partageant la même salle', () => {
    const ctx = makeCtx();
    ctx.occ.build([
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e2' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' },
      { seanceId: 's3', jour: 'LUNDI', creneauId: 'c2', ressourceType: 'ENSEIGNANT', ressourceId: 'e3' },
      { seanceId: 's3', jour: 'LUNDI', creneauId: 'c2', ressourceType: 'SALLE', ressourceId: 'r2' },
    ]);
    const seance = makeSeance({ id: 's1', enseignantId: 'e1', salleId: 'r1' });
    const impactes = impactedSeances(
      seance,
      { jour: 'LUNDI', creneauDebut: 'c1', salle: 'r1' },
      { jour: 'LUNDI', creneauDebut: 'c2', salle: 'r2' },
      ctx,
    );
    expect(impactes).toContain('s2');
    expect(impactes).not.toContain('s3');
  });

  it('retourne les séances partageant un groupe via fermeture hiérarchique', () => {
    const groupes = [
      { id: 'gp', parentId: null, enfants: ['p'] },
      { id: 'p', parentId: 'gp', enfants: ['c1', 'c2'] },
      { id: 'c1', parentId: 'p', enfants: [] },
      { id: 'c2', parentId: 'p', enfants: [] },
    ];
    const groupeClosure = new GroupeClosure(groupes);
    const ctx = makeCtx({ groupeClosure });
    ctx.occ.build([
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' },
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'GROUPE', ressourceId: 'c1' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e2' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r2' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'GROUPE', ressourceId: 'gp' },
    ]);
    const seance = makeSeance({ id: 's1', enseignantId: 'e1', salleId: 'r1', groupes: ['c1'] });
    const impactes = impactedSeances(
      seance,
      { jour: 'LUNDI', creneauDebut: 'c1', salle: 'r1' },
      { jour: 'LUNDI', creneauDebut: 'c2', salle: 'r2' },
      ctx,
    );
    expect(impactes).toContain('s2');
  });

  it('n\'retourne aucune séance si aucune ressource n\'est partagée', () => {
    const ctx = makeCtx();
    ctx.occ.build([
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c2', ressourceType: 'ENSEIGNANT', ressourceId: 'e2' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c2', ressourceType: 'SALLE', ressourceId: 'r2' },
    ]);
    const seance = makeSeance({ id: 's1', enseignantId: 'e1', salleId: 'r1' });
    const impactes = impactedSeances(
      seance,
      { jour: 'LUNDI', creneauDebut: 'c1', salle: 'r1' },
      { jour: 'LUNDI', creneauDebut: 'c2', salle: 'r2' },
      ctx,
    );
    expect(impactes).toEqual([]);
  });
});

// ============================================================================
// Performance (EX-NFR-04 : conflits:recompute < 2 s pour 4 000 séances)
// ============================================================================

describe('performance', () => {
  it('computeConflicts < 2 s pour 4 000 séances', () => {
    const ctx = makeCtx();
    const nbSeances = 4000;
    const seances: SeanceInput[] = [];
    const occupations: { seanceId: string; jour: string; creneauId: string; ressourceType: 'ENSEIGNANT' | 'SALLE' | 'GROUPE'; ressourceId: string }[] = [];

    for (let i = 0; i < nbSeances; i++) {
      const id = `s${i}`;
      const enseignantId = i % 2 === 0 ? 'e1' : 'e2';
      const salleId = i % 2 === 0 ? 'r1' : 'r2';
      const groupeId = i % 2 === 0 ? 'g1' : 'g2';
      seances.push(makeSeance({
        id,
        enseignantId,
        salleId,
        groupes: [groupeId],
        nbCreneaux: 1,
        statut: 'PLACEE',
        volumePlace: 90,
      }));
      occupations.push({ seanceId: id, jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: enseignantId });
      occupations.push({ seanceId: id, jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: salleId });
      occupations.push({ seanceId: id, jour: 'LUNDI', creneauId: 'c1', ressourceType: 'GROUPE', ressourceId: groupeId });
    }

    ctx.occ.build(occupations);
    const seancesAvecPlacement = seances.map((s) => ({
      seance: s,
      jour: 'LUNDI',
      creneauDebut: 'c1',
      salle: s.salleId,
    }));

    const start = performance.now();
    const conflits = computeConflicts(seancesAvecPlacement, ctx);
    const elapsedMs = performance.now() - start;

    expect(elapsedMs).toBeLessThan(2000);
    expect(conflits.length).toBeGreaterThan(0);
    console.log(`computeConflicts sur ${nbSeances} séances : ${elapsedMs.toFixed(2)} ms, ${conflits.length} conflits`);
  });
});
