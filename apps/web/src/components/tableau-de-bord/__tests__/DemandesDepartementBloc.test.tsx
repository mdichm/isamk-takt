// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du composant DemandesDepartementBloc (L5-28)

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DemandesDepartementBloc } from '../DemandesDepartementBloc';

afterEach(() => cleanup());

describe('DemandesDepartementBloc', () => {
  it('affiche les demandes du département', () => {
    render(
      <DemandesDepartementBloc demandes={[
        'Demande de salle supplémentaire',
        'Demande de modification de créneau',
      ]} />,
    );

    expect(screen.getByText('Demande de salle supplémentaire')).toBeInTheDocument();
    expect(screen.getByText('Demande de modification de créneau')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('affiche un état vide quand aucune demande', () => {
    render(<DemandesDepartementBloc demandes={[]} />);

    expect(screen.getByText('Aucune demande ouverte.')).toBeInTheDocument();
  });
});
