// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du composant RepartitionsBloc (L5-27)

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RepartitionsBloc } from '../RepartitionsBloc';

afterEach(() => cleanup());

describe('RepartitionsBloc', () => {
  it('affiche le tableau des répartitions par département', () => {
    const repartitions = [
      { departementCode: 'INFO', statut: 'VALIDEE', avancement: '12/12' },
      { departementCode: 'MATH', statut: 'BROUILLON', avancement: '5/12' },
      { departementCode: 'PHYS', statut: 'ROUVERTE', avancement: '3/12' },
    ];

    render(<RepartitionsBloc repartitions={repartitions} />);

    expect(screen.getByText('INFO')).toBeInTheDocument();
    expect(screen.getByText('MATH')).toBeInTheDocument();
    expect(screen.getByText('PHYS')).toBeInTheDocument();
    expect(screen.getByText('VALIDEE')).toBeInTheDocument();
    expect(screen.getByText('BROUILLON')).toBeInTheDocument();
    expect(screen.getByText('ROUVERTE')).toBeInTheDocument();
    expect(screen.getByText('12/12')).toBeInTheDocument();
    expect(screen.getByText('5/12')).toBeInTheDocument();
  });

  it('affiche un état vide quand aucune répartition', () => {
    render(<RepartitionsBloc repartitions={[]} />);

    expect(screen.getByText('Aucune répartition trouvée pour ce semestre.')).toBeInTheDocument();
  });
});
