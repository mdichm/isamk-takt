import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  computeSignature,
  OccupancyIndex,
  GroupeClosure,
  IndispoSet,
  Reqs,
  SnapshotIndex,
  VerrouIndex,
  validatePlacement,
  validatePlacementWithGroups,
  type SeanceInput,
  type PlacementCandidat,
  type ConflictContext,
  type ValidatePlacementCtx,
  type SalleData,
} from './index.js';

// ============================================================================
// computeSignature
// ============================================================================

describe('computeSignature', () => {
  it('produit une signature stable pour les mêmes entrées', () => {
    const s1 = computeSignature('TEACHER_DOUBLE_BOOKING', ['s1', 's2'], 'enseignant', 'e1', ['LUNDI|C1', 'LUNDI|C2']);
    const s2 = computeSignature('TEACHER_DOUBLE_BOOKING', ['s2', 's1'], 'enseignant', 'e1', ['LUNDI|C2', 'LUNDI|C1']);
    expect(s1).toBe(s2);
    expect(s1).toHaveLength(64);
  });

  it('change dès qu\'une entrée change', () => {
    const base = computeSignature('R1', ['s1'], 'T', 'O1', ['LUNDI|C1']);
    expect(computeSignature('R2', ['s1'], 'T', 'O1', ['LUNDI|C1'])).not.toBe(base);
    expect(computeSignature('R1', ['s2'], 'T', 'O1', ['LUNDI|C1'])).not.toBe(base);
    expect(computeSignature('R1', ['s1'], 'T2', 'O1', ['LUNDI|C1'])).not.toBe(base);
    expect(computeSignature('R1', ['s1'], 'T', 'O2', ['LUNDI|C1'])).not.toBe(base);
    expect(computeSignature('R1', ['s1'], 'T', 'O1', ['LUNDI|C2'])).not.toBe(base);
  });
});

// ============================================================================
// OccupancyIndex
// ============================================================================

describe('OccupancyIndex', () => {
  it('construit et interroge par slot', () => {
    const idx = new OccupancyIndex();
    idx.build([
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
      { seanceId: 's1', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c2', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' },
    ]);
    const slot = idx.get('LUNDI|c1');
    expect(slot?.ens.get('e1')?.seanceId).toBe('s1');
    expect(slot?.salle.get('r1')?.seanceId).toBe('s1');
    expect(idx.get('LUNDI|c2')?.ens.get('e1')?.seanceId).toBe('s2');
    expect(idx.get('MARDI|c1')).toBeUndefined();
  });
});

// ============================================================================
// GroupeClosure
// ============================================================================

describe('GroupeClosure', () => {
  it('calcule ancêtres et descendants', () => {
    const groupes = [
      { id: 'gp', parentId: null, enfants: ['p'] },
      { id: 'p', parentId: 'gp', enfants: ['c1', 'c2'] },
      { id: 'c1', parentId: 'p', enfants: ['pc'] },
      { id: 'c2', parentId: 'p', enfants: [] },
      { id: 'pc', parentId: 'c1', enfants: [] },
    ];
    const gc = new GroupeClosure(groupes);
    const p = gc.get('p')!;
    expect(p.ancetres).toEqual(['gp']);
    expect(p.descendants.sort()).toEqual(['c1', 'c2', 'pc']);
    const gp = gc.get('gp')!;
    expect(gp.ancetres).toEqual([]);
    expect(gp.descendants.sort()).toEqual(['c1', 'c2', 'p', 'pc']);
    const pc = gc.get('pc')!;
    expect(pc.ancetres).toEqual(['c1', 'p', 'gp']);
    expect(pc.descendants).toEqual([]);
  });
});

// ============================================================================
// IndispoSet
// ============================================================================

describe('IndispoSet', () => {
  it('add et has', () => {
    const s = new IndispoSet();
    s.add('ENSEIGNANT', 'e1', 'LUNDI', 3);
    expect(s.has('ENSEIGNANT', 'e1', 'LUNDI', 3)).toBe(true);
    expect(s.has('ENSEIGNANT', 'e1', 'LUNDI', 4)).toBe(false);
    expect(s.has('SALLE', 'r1', 'LUNDI', 3)).toBe(false);
  });
});

// ============================================================================
// Reqs
// ============================================================================

describe('Reqs', () => {
  it('set et get', () => {
    const r = new Reqs();
    r.set('a1', { activityTag: 'CM', equipementsObligatoires: ['VIDEOPROJ'], equipementsSouhaites: ['TABLEAU'], sallesAutorisees: ['r1', 'r2'] });
    const reqs = r.get('a1');
    expect(reqs?.activityTag).toBe('CM');
    expect(reqs?.equipementsObligatoires).toContain('VIDEOPROJ');
    expect(r.get('a2')).toBeUndefined();
  });
});

// ============================================================================
// SnapshotIndex
// ============================================================================

describe('SnapshotIndex', () => {
  it('set et get par (groupe, module, type)', () => {
    const s = new SnapshotIndex();
    s.set('g1', 'm1', 't1', { enseignantsAutorises: ['e1', 'e2'], volumeAttendu: 180, dureeCreneaux: 90 });
    const snap = s.get('g1', 'm1', 't1');
    expect(snap?.enseignantsAutorises).toContain('e1');
    expect(snap?.volumeAttendu).toBe(180);
    expect(s.get('g2', 'm1', 't1')).toBeUndefined();
  });
});

// ============================================================================
// VerrouIndex
// ============================================================================

describe('VerrouIndex', () => {
  it('add / has / delete', () => {
    const v = new VerrouIndex();
    v.add('s1', 'CRENEAU');
    expect(v.has('s1', 'CRENEAU')).toBe(true);
    expect(v.has('s1', 'SALLE')).toBe(false);
    v.delete('s1', 'CRENEAU');
    expect(v.has('s1', 'CRENEAU')).toBe(false);
  });
});
// ============================================================================
// validatePlacement — règles de collision
// ============================================================================

function makeCtx(overrides: Partial<ConflictContext> = {}): ConflictContext {
  const salles = new Map<string, SalleData>([
    ['r1', { id: 'r1', capaciteMax: 30, capaciteRecommandee: 25 }],
    ['r2', { id: 'r2', capaciteMax: 100, capaciteRecommandee: 80 }],
  ]);
  const creneaux = new Map<string, { estPause: boolean; ordre: number; jour: string }>([
    ['c1', { estPause: false, ordre: 1, jour: 'LUNDI' }],
    ['c2', { estPause: false, ordre: 2, jour: 'LUNDI' }],
    ['cp', { estPause: true, ordre: 3, jour: 'LUNDI' }],
  ]);
  const grille = {
    consecutifs: (jour: string, creneauDebut: string, nb: number): string[] | null => {
      if (creneauDebut === 'cp') return null;
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
    salleEquipements: new Map([['r1', ['VIDEOPROJ']]]),
    salleTags: new Map([['r1', ['CM', 'TD']]]),
    creneaux,
    groupeEffectifs: new Map([['g1', 20]]),
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

function makeCandidat(overrides: Partial<PlacementCandidat> = {}): PlacementCandidat {
  return { jour: 'LUNDI', creneauDebut: 'c1', salle: 'r1', ...overrides };
}

describe('validatePlacement', () => {
  it('aucun conflit sur un créneau libre', () => {
    const ctx = makeCtx();
    const c = validatePlacement(makeSeance(), makeCandidat(), ctx);
    expect(c).toEqual([]);
  });

  it('TEACHER_DOUBLE_BOOKING', () => {
    const ctx = makeCtx();
    ctx.occ.build([{ seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'ENSEIGNANT', ressourceId: 'e1' }]);
    const c = validatePlacement(makeSeance(), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'TEACHER_DOUBLE_BOOKING')).toBe(true);
    expect(c[0]?.severite).toBe('BLOQUANT');
    expect(c[0]?.signature).toHaveLength(64);
  });

  it('ROOM_DOUBLE_BOOKING', () => {
    const ctx = makeCtx();
    ctx.occ.build([{ seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' }]);
    const c = validatePlacement(makeSeance(), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'ROOM_DOUBLE_BOOKING')).toBe(true);
  });

  it('SLOT_SPANS_BREAK sur pause', () => {
    const ctx = makeCtx();
    const c = validatePlacement(makeSeance(), makeCandidat({ creneauDebut: 'cp' }), ctx);
    expect(c.some(x => x.regleCode === 'SLOT_SPANS_BREAK')).toBe(true);
    expect(c[0]?.severite).toBe('BLOQUANT');
  });

  it('ROOM_CAPACITY bloquant quand effectif > capMax', () => {
    const ctx = makeCtx({ groupeEffectifs: new Map([['g1', 200]]) });
    const c = validatePlacement(makeSeance(), makeCandidat({ salle: 'r1' }), ctx);
    expect(c.some(x => x.regleCode === 'ROOM_CAPACITY' && x.severite === 'BLOQUANT')).toBe(true);
  });

  it('ROOM_CAPACITY_RECOMMENDED avertissement quand effectif > capRec mais ≤ capMax', () => {
    const ctx = makeCtx({ groupeEffectifs: new Map([['g1', 30]]) });
    const c = validatePlacement(makeSeance(), makeCandidat({ salle: 'r1' }), ctx);
    expect(c.some(x => x.regleCode === 'ROOM_CAPACITY_RECOMMENDED' && x.severite === 'AVERTISSEMENT')).toBe(true);
  });

  it('ROOM_UNAVAILABLE quand salle indisponible sur le créneau', () => {
    const indispo = new IndispoSet();
    indispo.add('SALLE', 'r1', 'LUNDI', 1);
    const ctx = makeCtx({ indispo });
    const c = validatePlacement(makeSeance(), makeCandidat({ salle: 'r1' }), ctx);
    expect(c.some(x => x.regleCode === 'ROOM_UNAVAILABLE')).toBe(true);
    expect(c[0]?.severite).toBe('BLOQUANT');
  });

  it('ROOM_EQUIPMENT_MISSING équipement obligatoire absent → BLOQUANT', () => {
    const ctx = makeCtx();
    ctx.reqs.set('s1', { activityTag: 'CM', equipementsObligatoires: ['TABLEAU_BLANC'], equipementsSouhaites: [] });
    const c = validatePlacement(makeSeance(), makeCandidat({ salle: 'r1' }), ctx);
    expect(c.some(x => x.regleCode === 'ROOM_EQUIPMENT_MISSING' && x.severite === 'BLOQUANT')).toBe(true);
  });

  it('ROOM_EQUIPMENT_MISSING équipement souhaité absent → AVERTISSEMENT', () => {
    const ctx = makeCtx();
    ctx.reqs.set('s1', { activityTag: 'CM', equipementsObligatoires: [], equipementsSouhaites: ['TABLEAU_BLANC'] });
    const c = validatePlacement(makeSeance(), makeCandidat({ salle: 'r1' }), ctx);
    expect(c.some(x => x.regleCode === 'ROOM_EQUIPMENT_MISSING' && x.severite === 'AVERTISSEMENT')).toBe(true);
  });

  it('ROOM_NOT_ALLOWED quand salle imposée ≠ salle candidate', () => {
    const ctx = makeCtx();
    ctx.reqs.set('s1', { activityTag: 'CM', equipementsObligatoires: [], equipementsSouhaites: [], salleImposee: 'r2' });
    const c = validatePlacement(makeSeance(), makeCandidat({ salle: 'r1' }), ctx);
    expect(c.some(x => x.regleCode === 'ROOM_NOT_ALLOWED')).toBe(true);
    expect(c[0]?.severite).toBe('BLOQUANT');
  });

  it('ROOM_NOT_ALLOWED quand salle hors liste autorisée', () => {
    const ctx = makeCtx();
    ctx.reqs.set('s1', { activityTag: 'CM', equipementsObligatoires: [], equipementsSouhaites: [], sallesAutorisees: ['r2'] });
    const c = validatePlacement(makeSeance(), makeCandidat({ salle: 'r1' }), ctx);
    expect(c.some(x => x.regleCode === 'ROOM_NOT_ALLOWED')).toBe(true);
    expect(c[0]?.severite).toBe('BLOQUANT');
  });

  it('capacité avec groupeClosure : ancêtre prime sur descendant (pas de double comptage)', () => {
    const ctx = makeCtx({
      groupeClosure: new GroupeClosure([
        { id: 'gp', parentId: null, enfants: ['g1'] },
        { id: 'g1', parentId: 'gp', enfants: [] },
      ]),
      groupeEffectifs: new Map([['gp', 25], ['g1', 20]]),
    });
    // gp=25 seul compté (ancêtre), g1 ignoré → 25 ≤ capMax 30 → pas de conflit
    const c = validatePlacement(
      makeSeance({ groupes: ['gp', 'g1'] }),
      makeCandidat({ salle: 'r1' }),
      ctx as ValidatePlacementCtx,
    );
    expect(c.some(x => x.regleCode === 'ROOM_CAPACITY')).toBe(false);

    // gp=40 > capMax 30 → conflit bloquant
    const ctx2 = makeCtx({
      groupeClosure: new GroupeClosure([
        { id: 'gp', parentId: null, enfants: ['g1'] },
        { id: 'g1', parentId: 'gp', enfants: [] },
      ]),
      groupeEffectifs: new Map([['gp', 40], ['g1', 20]]),
    });
    const c2 = validatePlacement(
      makeSeance({ groupes: ['gp', 'g1'] }),
      makeCandidat({ salle: 'r1' }),
      ctx2 as ValidatePlacementCtx,
    );
    expect(c2.some(x => x.regleCode === 'ROOM_CAPACITY' && x.severite === 'BLOQUANT')).toBe(true);
  });

  it('TEACHER_UNAVAILABLE', () => {
    const indispo = new IndispoSet();
    indispo.add('ENSEIGNANT', 'e1', 'LUNDI', 1);
    const ctx = makeCtx({ indispo });
    const c = validatePlacement(makeSeance(), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'TEACHER_UNAVAILABLE')).toBe(true);
  });

  it('ROOM_TAG_INCOMPATIBLE', () => {
    const ctx = makeCtx();
    ctx.reqs.set('s1', { activityTag: 'TP', equipementsObligatoires: [], equipementsSouhaites: [] });
    const c = validatePlacement(makeSeance(), makeCandidat({ salle: 'r1' }), ctx);
    expect(c.some(x => x.regleCode === 'ROOM_TAG_INCOMPATIBLE')).toBe(true);
  });

  it('TEACHER_NOT_IN_SNAPSHOT', () => {
    const ctx = makeCtx();
    ctx.snapshot.set('g1', 'm1', 't1', { enseignantsAutorises: ['e2'], volumeAttendu: 180, dureeCreneaux: 90 });
    const c = validatePlacement(makeSeance(), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'TEACHER_NOT_IN_SNAPSHOT')).toBe(true);
  });

  it('SESSION_UNPLACED', () => {
    const ctx = makeCtx();
    const c = validatePlacement(makeSeance({ statut: 'NON_PLACEE' }), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'SESSION_UNPLACED')).toBe(true);
  });

  it('SESSION_OVERPLANNED quand volumePlace > volumeAttendu → BLOQUANT', () => {
    const ctx = makeCtx();
    ctx.snapshot.set('g1', 'm1', 't1', { enseignantsAutorises: ['e1'], volumeAttendu: 180, dureeCreneaux: 90 });
    const c = validatePlacement(makeSeance({ volumePlace: 210 }), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'SESSION_OVERPLANNED' && x.severite === 'BLOQUANT')).toBe(true);
  });

  it('COVERAGE_INCOMPLETE quand volumePlace < volumeAttendu → BLOQUANT', () => {
    const ctx = makeCtx();
    ctx.snapshot.set('g1', 'm1', 't1', { enseignantsAutorises: ['e1'], volumeAttendu: 180, dureeCreneaux: 90 });
    const c = validatePlacement(makeSeance({ volumePlace: 150 }), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'COVERAGE_INCOMPLETE' && x.severite === 'BLOQUANT')).toBe(true);
  });

  it('aucun conflit quand volumePlace === volumeAttendu', () => {
    const ctx = makeCtx();
    ctx.snapshot.set('g1', 'm1', 't1', { enseignantsAutorises: ['e1'], volumeAttendu: 180, dureeCreneaux: 90 });
    const c = validatePlacement(makeSeance({ volumePlace: 180 }), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'SESSION_OVERPLANNED')).toBe(false);
    expect(c.some(x => x.regleCode === 'COVERAGE_INCOMPLETE')).toBe(false);
  });

  it('aucun conflit pédagogique quand pas de snapshot', () => {
    const ctx = makeCtx();
    const c = validatePlacement(makeSeance({ volumePlace: 500 }), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'SESSION_OVERPLANNED')).toBe(false);
    expect(c.some(x => x.regleCode === 'COVERAGE_INCOMPLETE')).toBe(false);
  });

  it('SESSION_DURATION_MISMATCH quand durée ≠ snapshot.dureeCreneaux', () => {
    const ctx = makeCtx();
    ctx.snapshot.set('g1', 'm1', 't1', { enseignantsAutorises: ['e1'], volumeAttendu: 180, dureeCreneaux: 90 });
    const c = validatePlacement(makeSeance({ nbCreneaux: 2 }), makeCandidat(), ctx); // 2*30=60 ≠ 90
    expect(c.some(x => x.regleCode === 'SESSION_DURATION_MISMATCH' && x.severite === 'BLOQUANT')).toBe(true);
  });

  it('LOCK_VIOLATED sur verrou CRENEAU', () => {
    const ctx = makeCtx();
    ctx.verrous.add('s1', 'CRENEAU');
    const c = validatePlacement(makeSeance(), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'LOCK_VIOLATED')).toBe(true);
  });

  it('LOCK_OVERRIDABLE sur verrou overridable sans déplacement → AVERTISSEMENT', () => {
    const ctx = makeCtx();
    ctx.verrous.add('s1', 'CRENEAU', true);
    const c = validatePlacement(makeSeance(), makeCandidat(), ctx);
    const conflit = c.find(x => x.regleCode === 'LOCK_OVERRIDABLE');
    expect(conflit).toBeDefined();
    expect(conflit?.severite).toBe('AVERTISSEMENT');
    expect(c.some(x => x.regleCode === 'LOCK_OVERRIDDEN')).toBe(false);
    expect(c.some(x => x.regleCode === 'LOCK_VIOLATED')).toBe(false);
  });

  it('LOCK_OVERRIDDEN sur verrou overridable avec déplacement de salle → AVERTISSEMENT', () => {
    const ctx = makeCtx();
    ctx.verrous.add('s1', 'CRENEAU', true);
    const c = validatePlacement(
      makeSeance({ placeInitiale: { salleId: 'r2' } }),
      makeCandidat({ salle: 'r1' }),
      ctx,
    );
    const conflit = c.find(x => x.regleCode === 'LOCK_OVERRIDDEN');
    expect(conflit).toBeDefined();
    expect(conflit?.severite).toBe('AVERTISSEMENT');
    expect(c.some(x => x.regleCode === 'LOCK_OVERRIDABLE')).toBe(false);
    expect(c.some(x => x.regleCode === 'LOCK_VIOLATED')).toBe(false);
  });

  it('pas de LOCK_OVERRIDDEN si verrou overridable mais pas de déplacement', () => {
    const ctx = makeCtx();
    ctx.verrous.add('s1', 'CRENEAU', true);
    const c = validatePlacement(makeSeance(), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'LOCK_OVERRIDDEN')).toBe(false);
    expect(c.some(x => x.regleCode === 'LOCK_OVERRIDABLE')).toBe(true);
  });

  it('ROOM_MOVE_FORBIDDEN quand déplacement de salle sans précédent → BLOQUANT', () => {
    const ctx = makeCtx();
    const c = validatePlacement(
      makeSeance({ placeInitiale: { salleId: 'r2' } }),
      makeCandidat({ salle: 'r1' }),
      ctx,
    );
    const conflit = c.find(x => x.regleCode === 'ROOM_MOVE_FORBIDDEN');
    expect(conflit).toBeDefined();
    expect(conflit?.severite).toBe('BLOQUANT');
  });

  it('pas de ROOM_MOVE_FORBIDDEN quand déplacement de salle avec précédent', () => {
    const ctx = makeCtx();
    // Précédent : le groupe g1 occupe déjà la salle r1 au créneau c1 (par la séance s2)
    ctx.occ.build([
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'GROUPE', ressourceId: 'g1' },
      { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' },
    ]);
    const c = validatePlacement(
      makeSeance({ placeInitiale: { salleId: 'r2' } }),
      makeCandidat({ salle: 'r1' }),
      ctx,
    );
    expect(c.some(x => x.regleCode === 'ROOM_MOVE_FORBIDDEN')).toBe(false);
  });

  it('LOCK_VIOLATED toujours sur verrou non overridable (régression)', () => {
    const ctx = makeCtx();
    ctx.verrous.add('s1', 'CRENEAU'); // pas overridable
    const c = validatePlacement(makeSeance(), makeCandidat(), ctx);
    expect(c.some(x => x.regleCode === 'LOCK_VIOLATED')).toBe(true);
    expect(c.some(x => x.regleCode === 'LOCK_OVERRIDABLE')).toBe(false);
    expect(c.some(x => x.regleCode === 'LOCK_OVERRIDDEN')).toBe(false);
  });
});

// ============================================================================
// validatePlacementWithGroups — groupe double booking avec fermeture
// ============================================================================

describe('validatePlacementWithGroups', () => {
  it('GROUP_DOUBLE_BOOKING avec ancêtre', () => {
    const ctx = makeCtx();
    ctx.groupeClosure = new GroupeClosure([
      { id: 'gp', parentId: null, enfants: ['g1'] },
      { id: 'g1', parentId: 'gp', enfants: [] },
    ]);
    ctx.occ.build([{ seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'GROUPE', ressourceId: 'gp' }]);
    const c = validatePlacementWithGroups(makeSeance({ groupes: ['g1'] }), makeCandidat(), ctx as ValidatePlacementCtx);
    expect(c.some(x => x.regleCode === 'GROUP_DOUBLE_BOOKING')).toBe(true);
  });

  it('aucun conflit groupe si groupes distincts', () => {
    const ctx = makeCtx();
    ctx.groupeClosure = new GroupeClosure([
      { id: 'g1', parentId: null, enfants: [] },
      { id: 'g2', parentId: null, enfants: [] },
    ]);
    const c = validatePlacementWithGroups(makeSeance({ groupes: ['g1'] }), makeCandidat(), ctx as ValidatePlacementCtx);
    expect(c.some(x => x.regleCode === 'GROUP_DOUBLE_BOOKING')).toBe(false);
  });
});

// ============================================================================
// Tests par propriété (fast-check)
// ============================================================================

describe('propriétés (fast-check)', () => {
  it('aucun déplacement accepté ne crée de double réservation enseignant/salle', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })), { minLength: 0, maxLength: 5 }),
        fc.integer({ min: 1, max: 4 }),
        (occupations: [string, string][], nbCreneaux: number) => {
          const ctx = makeCtx();
          const occInputs = occupations.map(([seanceId, ressourceId]) => ({
            seanceId,
            jour: 'LUNDI',
            creneauId: 'c1',
            ressourceType: 'ENSEIGNANT' as const,
            ressourceId,
          }));
          ctx.occ.build(occInputs);

          const seance: SeanceInput = {
            id: 's-new', enseignantId: 'e-new', salleId: 'r-new', groupes: ['g-new'],
            nbCreneaux, tag: 'CM', moduleId: 'm1', typeEnseignementId: 't1',
            statut: 'PLACEE', versionId: 'v1',
          };

          const dejasOccupes = new Set(occupations.map(([, r]) => r));
          if (!dejasOccupes.has('e-new')) {
            const c = validatePlacement(seance, makeCandidat({ salle: 'r-new' }), ctx);
            expect(c.some(x => x.regleCode === 'TEACHER_DOUBLE_BOOKING')).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('aucun déplacement accepté ne crée de double réservation salle', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })), { minLength: 0, maxLength: 5 }),
        fc.integer({ min: 1, max: 4 }),
        (occupations: [string, string][], nbCreneaux: number) => {
          const ctx = makeCtx();
          const occInputs = occupations.map(([seanceId, ressourceId]) => ({
            seanceId,
            jour: 'LUNDI',
            creneauId: 'c1',
            ressourceType: 'SALLE' as const,
            ressourceId,
          }));
          ctx.occ.build(occInputs);

          const seance: SeanceInput = {
            id: 's-new', enseignantId: 'e-new', salleId: 'r-new', groupes: ['g-new'],
            nbCreneaux, tag: 'CM', moduleId: 'm1', typeEnseignementId: 't1',
            statut: 'PLACEE', versionId: 'v1',
          };

          const dejasOccupes = new Set(occupations.map(([, r]) => r));
          if (!dejasOccupes.has('r-new')) {
            const c = validatePlacement(seance, makeCandidat({ salle: 'r-new' }), ctx);
            expect(c.some(x => x.regleCode === 'ROOM_DOUBLE_BOOKING')).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('aucun déplacement accepté ne crée de ROOM_CAPACITY bloquant si effectif ≤ capMax', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 200 }),
        (effectif: number, capMax: number) => {
          const ctx = makeCtx({
            salles: new Map([['r-test', { id: 'r-test', capaciteMax: capMax, capaciteRecommandee: undefined }]]),
            groupeEffectifs: new Map([['g-test', effectif]]),
          });
          const seance: SeanceInput = {
            id: 's-new', enseignantId: 'e-new', salleId: 'r-test', groupes: ['g-test'],
            nbCreneaux: 1, tag: 'CM', moduleId: 'm1', typeEnseignementId: 't1',
            statut: 'PLACEE', versionId: 'v1',
          };
          const c = validatePlacement(seance, makeCandidat({ salle: 'r-test' }), ctx);
          if (effectif <= capMax) {
            expect(c.some(x => x.regleCode === 'ROOM_CAPACITY' && x.severite === 'BLOQUANT')).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });


  it('aucun déplacement accepté ne crée de SESSION_OVERPLANNED si volumePlace ≤ volumeAttendu', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        (volumePlace: number, volumeAttendu: number) => {
          const ctx = makeCtx();
          ctx.snapshot.set('g-test', 'm-test', 't-test', {
            enseignantsAutorises: ['e-test'],
            volumeAttendu,
            dureeCreneaux: 90,
          });
          const seance: SeanceInput = {
            id: 's-new', enseignantId: 'e-test', salleId: 'r-test', groupes: ['g-test'],
            nbCreneaux: 3, tag: 'CM', moduleId: 'm-test', typeEnseignementId: 't-test',
            statut: 'PLACEE', versionId: 'v1', volumePlace,
          };
          const c = validatePlacement(seance, makeCandidat({ salle: 'r-test' }), ctx);
          if (volumePlace <= volumeAttendu) {
            expect(c.some(x => x.regleCode === 'SESSION_OVERPLANNED')).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('signature stable : mêmes séances triées = même signature quel que soit l\'ordre d\'entrée', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (ids: string[], regleCode: string, objetId: string) => {
          const shuffled = [...ids].sort(() => Math.random() - 0.5);
          const s1 = computeSignature(regleCode, ids, 'seance', objetId, ['LUNDI|c1']);
          const s2 = computeSignature(regleCode, shuffled, 'seance', objetId, ['LUNDI|c1']);
          expect(s1).toBe(s2);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('déplacement de salle avec verrou overridable → LOCK_OVERRIDDEN toujours présent', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (overridable: boolean, deplace: boolean) => {
          const ctx = makeCtx();
          if (overridable) {
            ctx.verrous.add('s1', 'CRENEAU', true);
          }
          const seance = makeSeance({
            placeInitiale: deplace ? { salleId: 'r2' } : undefined,
          });
          const c = validatePlacement(seance, makeCandidat({ salle: 'r1' }), ctx);
          if (overridable && deplace) {
            expect(c.some(x => x.regleCode === 'LOCK_OVERRIDDEN')).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('pas de ROOM_MOVE_FORBIDDEN quand un précédent existe pour le groupe/salle/créneau', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (avecPrecedent: boolean) => {
          const ctx = makeCtx();
          if (avecPrecedent) {
            ctx.occ.build([
              { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'GROUPE', ressourceId: 'g1' },
              { seanceId: 's2', jour: 'LUNDI', creneauId: 'c1', ressourceType: 'SALLE', ressourceId: 'r1' },
            ]);
          }
          const c = validatePlacement(
            makeSeance({ placeInitiale: { salleId: 'r2' } }),
            makeCandidat({ salle: 'r1' }),
            ctx,
          );
          if (avecPrecedent) {
            expect(c.some(x => x.regleCode === 'ROOM_MOVE_FORBIDDEN')).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

