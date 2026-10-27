// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du composant ActionsPrioritairesBloc (L5-27)

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ActionsPrioritairesBloc } from '../ActionsPrioritairesBloc';

afterEach(() => cleanup());

describe('ActionsPrioritairesBloc', () => {
  it('affiche les actions prioritaires avec code, pourquoi et lien direct', () => {
    const actions = [
      {
        code: 'CONFLITS_BLOQUANTS',
        pourquoi: '3 conflit(s) bloquant(s) dans la version de travail',
        lien: '/versions/ver-1/conflits',
      },
      {
        code: 'SEANCES_NON_PLACEES',
        pourquoi: '5 séance(s) non placée(s)',
        lien: '/versions/ver-1/seances',
      },
    ];

    render(<ActionsPrioritairesBloc actions={actions} />);

    expect(screen.getByText('CONFLITS_BLOQUANTS')).toBeInTheDocument();
    expect(screen.getByText('3 conflit(s) bloquant(s) dans la version de travail')).toBeInTheDocument();
    expect(screen.getByText('SEANCES_NON_PLACEES')).toBeInTheDocument();
    expect(screen.getByText('5 séance(s) non placée(s)')).toBeInTheDocument();

    // Les liens directs doivent être présents
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/versions/ver-1/conflits');
    expect(links[1]).toHaveAttribute('href', '/versions/ver-1/seances');
  });

  it('affiche un état vide quand aucune action', () => {
    render(<ActionsPrioritairesBloc actions={[]} />);

    expect(screen.getByText('Aucune action prioritaire.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('affiche toutes les actions avec leurs liens directs', () => {
    const actions = [
      { code: 'GENERATION_ECHEC', pourquoi: 'Échec', lien: '/g/1' },
      { code: 'PLANNING_REJETE', pourquoi: 'Rejeté', lien: '/g/2' },
      { code: 'CONFLITS_BLOQUANTS', pourquoi: 'Conflits', lien: '/g/3' },
    ];

    render(<ActionsPrioritairesBloc actions={actions} />);

    // Tous les codes sont affichés
    expect(screen.getByText('GENERATION_ECHEC')).toBeInTheDocument();
    expect(screen.getByText('PLANNING_REJETE')).toBeInTheDocument();
    expect(screen.getByText('CONFLITS_BLOQUANTS')).toBeInTheDocument();

    // Tous les pourquoi sont affichés
    expect(screen.getByText('Échec')).toBeInTheDocument();
    expect(screen.getByText('Rejeté')).toBeInTheDocument();
    expect(screen.getByText('Conflits')).toBeInTheDocument();

    // Tous les liens directs sont présents
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '/g/1');
    expect(links[1]).toHaveAttribute('href', '/g/2');
    expect(links[2]).toHaveAttribute('href', '/g/3');
  });
});
