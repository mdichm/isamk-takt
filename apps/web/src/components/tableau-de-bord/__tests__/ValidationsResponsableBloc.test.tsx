// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests du composant ValidationsResponsableBloc (L5-28)

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ValidationsResponsableBloc } from '../ValidationsResponsableBloc';

afterEach(() => cleanup());

describe('ValidationsResponsableBloc', () => {
  it('affiche les validations à donner', () => {
    render(
      <ValidationsResponsableBloc validations={[
        'Validation du département INFO (version 3.0)',
        'Validation du département MATH (version 3.0)',
      ]} />,
    );

    expect(screen.getByText('Validation du département INFO (version 3.0)')).toBeInTheDocument();
    expect(screen.getByText('Validation du département MATH (version 3.0)')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('affiche un état vide quand aucune validation', () => {
    render(<ValidationsResponsableBloc validations={[]} />);

    expect(screen.getByText('Aucune validation en attente pour votre département.')).toBeInTheDocument();
  });
});
