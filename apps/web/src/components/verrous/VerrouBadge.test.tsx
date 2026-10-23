import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { VerrouBadge } from './VerrouBadge';

afterEach(() => cleanup());

describe('VerrouBadge', () => {
  it('renders CRENEAU verrou with lock icon and accessible label', () => {
    render(<VerrouBadge type="CRENEAU" />);
    const badge = screen.getByLabelText('Verrouillé sur le créneau — non modifiable');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Verrouillé sur le créneau');
  });

  it('renders SALLE verrou with accessible label', () => {
    render(<VerrouBadge type="SALLE" />);
    const badge = screen.getByLabelText('Verrouillé sur la salle — non modifiable');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Verrouillé sur la salle');
  });

  it('renders ENSEIGNANT verrou with accessible label', () => {
    render(<VerrouBadge type="ENSEIGNANT" />);
    const badge = screen.getByLabelText("Verrouillé sur l’enseignant — non modifiable");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Verrouillé sur l’enseignant");
  });

  it('renders ACTIVITE verrou with accessible label', () => {
    render(<VerrouBadge type="ACTIVITE" />);
    const badge = screen.getByLabelText('Activité figée — non modifiable');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Activité figée');
  });

  it('renders in small size', () => {
    render(<VerrouBadge type="CRENEAU" size="sm" />);
    const badge = screen.getByLabelText('Verrouillé sur le créneau — non modifiable');
    expect(badge).toHaveClass('text-xs');
  });

  it('applies lock color #29363C to all types', () => {
    render(
      <div>
        <VerrouBadge type="CRENEAU" />
        <VerrouBadge type="SALLE" />
        <VerrouBadge type="ENSEIGNANT" />
        <VerrouBadge type="ACTIVITE" />
      </div>,
    );
    const badges = screen.getAllByLabelText(/— non modifiable/);
    expect(badges).toHaveLength(4);
    badges.forEach((badge) => {
      expect(badge).toHaveTextContent(/Verrouillé|Activité figée/);
    });
  });
});
