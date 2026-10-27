// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du composant PreparationBloc (L5-27)

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PreparationBloc } from '../PreparationBloc';

afterEach(() => cleanup());

describe('PreparationBloc', () => {
  it('affiche les indicateurs de préparation quand tout est bon', () => {
    render(
      <PreparationBloc preparation={{
        peutGenerer: true,
        nbBloquants: 0,
        nbAvertissements: 0,
        nbInfos: 2,
        controles: [],
      }} />,
    );

    expect(screen.getByText('Prêt à générer')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('affiche un badge destructif quand il y a des blocages', () => {
    render(
      <PreparationBloc preparation={{
        peutGenerer: false,
        nbBloquants: 3,
        nbAvertissements: 1,
        nbInfos: 0,
        controles: [],
      }} />,
    );

    expect(screen.getByText('Blocages')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
