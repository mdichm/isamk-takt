// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du composant DirectionBloc (L5-28)

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DirectionBloc } from '../DirectionBloc';

afterEach(() => cleanup());

describe('DirectionBloc', () => {
  it('affiche la version publiée et les exports actifs', () => {
    render(
      <DirectionBloc direction={{ versionPubliee: '2.0', exports: 'true' }} />,
    );

    expect(screen.getByText('2.0')).toBeInTheDocument();
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it('affiche les exports inactifs quand la valeur est "false"', () => {
    render(
      <DirectionBloc direction={{ versionPubliee: '1.5', exports: 'false' }} />,
    );

    expect(screen.getByText('Inactif')).toBeInTheDocument();
  });

  it('affiche "Non renseigné" quand aucune version publiée', () => {
    render(
      <DirectionBloc direction={{ versionPubliee: '', exports: 'true' }} />,
    );

    expect(screen.getByText('Non renseigné')).toBeInTheDocument();
  });
});
