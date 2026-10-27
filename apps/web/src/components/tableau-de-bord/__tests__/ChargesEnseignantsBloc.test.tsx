// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du composant ChargesEnseignantsBloc (L5-28)

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ChargesEnseignantsBloc } from '../ChargesEnseignantsBloc';

afterEach(() => cleanup());

describe('ChargesEnseignantsBloc', () => {
  const charges = [
    {
      enseignantId: 'ens-1',
      nom: 'Dupont',
      charge: '180',
      seuil: '192',
      depassement: 'false',
    },
    {
      enseignantId: 'ens-2',
      nom: 'Martin',
      charge: '200',
      seuil: '192',
      depassement: 'true',
    },
  ];

  it('affiche le tableau des charges enseignants', () => {
    render(<ChargesEnseignantsBloc charges={charges} />);

    expect(screen.getByText('Dupont')).toBeInTheDocument();
    expect(screen.getByText('Martin')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getAllByText('192')).toHaveLength(2);
  });

  it('affiche une alerte quand un enseignant dépasse son seuil', () => {
    render(<ChargesEnseignantsBloc charges={charges} />);

    expect(screen.getByText('Dépasse le seuil')).toBeInTheDocument();
  });

  it('affiche un état vide quand aucune charge', () => {
    render(<ChargesEnseignantsBloc charges={[]} />);

    expect(screen.getByText('Aucune charge d\'enseignant pour ce département.')).toBeInTheDocument();
  });
});
