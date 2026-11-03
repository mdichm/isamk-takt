// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests de la barre latérale (navigation par rôle, L0-29)

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Sidebar from './Sidebar';

const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseAuth = vi.fn();
vi.mock('./AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

afterEach(() => cleanup());

type SidebarOptions = {
  role?: string | undefined;
  isAuthenticated?: boolean;
  pathname?: string;
};

function renderSidebar(options: SidebarOptions = {}) {
  mockUseAuth.mockReturnValue({
    role: 'role' in options ? options.role : 'ADMINISTRATEUR',
    isAuthenticated: options.isAuthenticated ?? true,
  });
  mockUsePathname.mockReturnValue(options.pathname ?? '/tableau-de-bord');
  return render(<Sidebar />);
}

/** Liste des cibles (href) des liens du menu. */
function menuHrefs(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('a')).map(
    (link) => link.getAttribute('href') ?? '',
  );
}

describe('Sidebar', () => {
  it('ne rend aucun menu pour un visiteur non authentifié', () => {
    const { container } = renderSidebar({ isAuthenticated: false });
    expect(container.querySelector('aside')).toBeNull();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('ne rend aucun menu tant que le rôle est inconnu', () => {
    const { container } = renderSidebar({ role: undefined });
    expect(container.querySelector('aside')).toBeNull();
  });

  it('affiche les entrées autorisées pour le rôle Administrateur', () => {
    const { container } = renderSidebar({ role: 'ADMINISTRATEUR' });
    const hrefs = menuHrefs(container);
    expect(hrefs).toContain('/tableau-de-bord');
    expect(hrefs).toContain('/structure');
    expect(hrefs).toContain('/admin/users');
    expect(hrefs).toContain('/export-config');
    // Les entrées de direction sont réservées à la Direction.
    expect(hrefs).not.toContain('/direction');
  });

  it('filtre les entrées selon le rôle', () => {
    const { container } = renderSidebar({ role: 'DIRECTION' });
    const hrefs = menuHrefs(container);
    expect(hrefs).toContain('/direction');
    expect(hrefs).toContain('/direction/audit');
    expect(hrefs).not.toContain('/admin/users');
    expect(hrefs).not.toContain('/import');
    expect(hrefs).not.toContain('/export-config');
  });

  it('restreint le menu de l’enseignant aux entrées autorisées', () => {
    const { container } = renderSidebar({ role: 'ENSEIGNANT' });
    expect(menuHrefs(container)).toEqual(['/', '/notifications', '/structure']);
  });

  it('n’expose que des routes résolues', () => {
    const { container } = renderSidebar({ role: 'ADMINISTRATEUR' });
    const hrefs = menuHrefs(container);
    // Aucune route littérale « [id] » et aucune route inexistante.
    expect(hrefs.some((href) => href.includes('[id]'))).toBe(false);
    expect(hrefs).not.toContain('/modules');
    expect(hrefs).not.toContain('/versions/[id]/profils');
  });

  it('chaque entrée du menu pointe vers une page existante', async () => {
    const { container } = renderSidebar({ role: 'ADMINISTRATEUR' });
    const hrefs = menuHrefs(container);

    // Les cibles sont vérifiées par le système de fichiers : une route
    // inexistante produirait un 404 à la navigation. Vitest fixe `root` sur le
    // dossier de l'application web, `process.cwd()` y est donc stable.
    const { stat } = await import('node:fs/promises');
    const { join, resolve } = await import('node:path');
    const appDir = resolve(process.cwd(), 'src/app');

    for (const href of hrefs) {
      if (href === '/') {
        continue;
      }
      const pageFile = join(appDir, href.slice(1), 'page.tsx');
      const exists = await stat(pageFile).then(
        () => true,
        () => false,
      );
      expect(exists, `la route ${href} doit exister`).toBe(true);
    }
  });

  it('propose une page de liste des répartitions', () => {
    const { container } = renderSidebar({ role: 'ADMINISTRATEUR' });
    // La cible /repartitions doit exister (la page de détail seule ne suffit pas).
    expect(menuHrefs(container)).toContain('/repartitions');
  });

  it('marque une seule entrée comme active (la plus spécifique)', () => {
    renderSidebar({ role: 'ADMINISTRATEUR', pathname: '/charges/annuelles' });
    const active = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute('href', '/charges/annuelles');
  });

  it('regroupe les entrées par sections', () => {
    renderSidebar({ role: 'ADMINISTRATEUR' });
    expect(screen.getByText("Vue d'ensemble")).toBeInTheDocument();
    expect(screen.getByText('Données')).toBeInTheDocument();
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Ressources')).toBeInTheDocument();
    expect(screen.getByText('Rapports')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
  });
});