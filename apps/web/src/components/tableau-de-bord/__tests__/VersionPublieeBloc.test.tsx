// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du composant VersionPublieeBloc (L5-27)

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { VersionPublieeBloc } from '../VersionPublieeBloc';

afterEach(() => cleanup());

describe('VersionPublieeBloc', () => {
  it('affiche la version publiée avec sa provenance', () => {
    render(
      <VersionPublieeBloc versionPubliee={{
        id: 'pub-1',
        numero: '3.0',
        statut: 'PUBLIE',
        provenance: {
          generationId: 'gen-42',
          adaptateur: 'FET',
          versionFET: '7.12.0',
          seancesOrigine: 1250,
          at: '2026-10-26T10:00:00Z',
        },
      }} />,
    );

    expect(screen.getByText('3.0')).toBeInTheDocument();
    expect(screen.getByText('PUBLIE')).toBeInTheDocument();
    expect(screen.getByText('7.12.0')).toBeInTheDocument();
    expect(screen.getByText('gen-42')).toBeInTheDocument();
  });

  it('affiche un état vide quand aucune version publiée', () => {
    render(<VersionPublieeBloc versionPubliee={null} />);

    expect(screen.getByText('Aucune version publiée pour ce semestre.')).toBeInTheDocument();
  });
});
