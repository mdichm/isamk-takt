// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du composant ValidationsEnAttenteBloc (L5-27)

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ValidationsEnAttenteBloc } from '../ValidationsEnAttenteBloc';

afterEach(() => cleanup());

describe('ValidationsEnAttenteBloc', () => {
  it('affiche les validations en attente', () => {
    render(
      <ValidationsEnAttenteBloc validations={[
        'Validation du département INFO (version 3.0)',
        'Validation du département MATH (version 3.0)',
      ]} />,
    );

    expect(screen.getByText('Validation du département INFO (version 3.0)')).toBeInTheDocument();
    expect(screen.getByText('Validation du département MATH (version 3.0)')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('affiche un état vide quand aucune validation', () => {
    render(<ValidationsEnAttenteBloc validations={[]} />);

    expect(screen.getByText('Aucune validation en attente.')).toBeInTheDocument();
  });
});
