'use client';

import { useMemo } from 'react';
import { useSeancesByVersion } from './use-seances';
import { type Seance } from '@/hooks/use-seances';

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

type ModeGrille = 'NORMALE' | 'RAMADAN';

type EtatSeance = 'IVORY' | 'WARM' | 'INSET';

export interface GrilleState {
  seances: Seance[];
  total: number;
  isLoading: boolean;
  error: unknown;
  jours: string[];
  etatSeance: (s: Seance) => EtatSeance;
  seancesParCreneau: Map<string, Seance[]>;
}

export function useGrilleState(
  versionId: string,
  modeInitial: ModeGrille = 'NORMALE',
  editable: boolean = true,
) {
  const { data, isLoading, error } = useSeancesByVersion(versionId, {
    page: 1,
    limit: 1000,
  });
  const seances: Seance[] = useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;

  const seancesParCreneau = useMemo(() => {
    const map = new Map<string, Seance[]>();
    for (const s of seances) {
      if (!s.jour || !s.creneauDebutId) continue;
      const key = `${s.jour}|${s.creneauDebutId}`;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [seances]);

  const etatSeance = (s: Seance): EtatSeance => {
    if (!s.salleId || s.statut === 'NON_PLACEE') return 'WARM';
    if (s.statut === 'ARCHIVE' || !editable) return 'INSET';
    return 'IVORY';
  };

  return {
    seances,
    total,
    isLoading,
    error,
    jours: JOURS,
    etatSeance,
    seancesParCreneau,
    modeGrille: modeInitial,
    editable,
  };
}
