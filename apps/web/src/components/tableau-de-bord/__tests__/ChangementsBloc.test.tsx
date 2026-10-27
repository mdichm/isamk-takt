// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du composant ChangementsBloc (L5-27)

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ChangementsBloc } from '../ChangementsBloc';

afterEach(() => cleanup());

describe('ChangementsBloc', () => {
  it('affiche les départements impactés', () => {
    render(
      <ChangementsBloc changements={{
        departements: [
          { code: 'INFO', libelle: 'Informatique', impactes: 15 },
          { code: 'MATH', libelle: 'Mathématiques', impactes: 8 },
        ],
        totalImpactes: 23,
      }} />,
    );

    expect(screen.getByText('Informatique')).toBeInTheDocument();
    expect(screen.getByText('Mathématiques')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
  });

  it('affiche un état vide quand aucun changement', () => {
    render(<ChangementsBloc changements={null} />);

    expect(screen.getByText('Aucun changement détecté.')).toBeInTheDocument();
  });
});
