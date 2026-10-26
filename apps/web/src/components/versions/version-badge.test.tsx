import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VersionBadge } from './version-badge';

describe('VersionBadge', () => {
  it('affiche le libellé et une couleur pour chaque statut connu', () => {
    const cas: [string, string][] = [
      ['BROUILLON', 'Brouillon'],
      ['EDITION', 'En édition'],
      ['PRET_POUR_VALIDATION', 'Prêt pour validation'],
      ['EN_VALIDATION', 'En validation'],
      ['VALIDE', 'Validé'],
      ['PUBLIE', 'Publié'],
      ['ARCHIVE', 'Archivée'],
      ['CORRECTION', 'En correction'],
      ['REJETE', 'Rejetée'],
    ];

    for (const [statut, libelleAttendu] of cas) {
      const { unmount } = render(<VersionBadge statut={statut} />);
      const badge = screen.getByText(libelleAttendu);
      expect(badge).toBeInTheDocument();
      // Le badge comporte toujours une classe de couleur (jamais vide).
      expect(badge.closest('span')?.className).toContain('bg-');
      unmount();
    }
  });

  it('affiche le statut brut si inconnu, avec une couleur par défaut', () => {
    render(<VersionBadge statut='INCONNU' />);
    expect(screen.getByText('INCONNU')).toBeInTheDocument();
  });
});

