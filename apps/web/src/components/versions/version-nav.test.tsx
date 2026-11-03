// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests de la navigation contextuelle des écrans d'une version

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { VersionNav } from './version-nav';

const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseAuth = vi.fn();
vi.mock('@/components/shell/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

afterEach(() => cleanup());

function renderNav(role: string | undefined, pathname = '/versions/ver-1') {
  mockUseAuth.mockReturnValue({ role });
  mockUsePathname.mockReturnValue(pathname);
  return render(<VersionNav versionId="ver-1" />);
}

function navHrefs(): string[] {
  return screen
    .getAllByRole('link')
    .map((link) => link.getAttribute('href') ?? '');
}

describe('VersionNav', () => {
  it('affiche les écrans de la version autorisés pour l’administrateur', () => {
    renderNav('ADMINISTRATEUR');
    expect(navHrefs()).toEqual([
      '/versions/ver-1',
      '/versions/ver-1/profils',
      '/versions/ver-1/generations',
      '/versions/ver-1/validation',
      '/versions/ver-1/impact',
      '/versions/ver-1/previsualisation',
    ]);
  });

  it('respecte les rôles : la Direction n’accède ni à la validation ni à l’impact', () => {
    renderNav('DIRECTION');
    const hrefs = navHrefs();
    expect(hrefs).toContain('/versions/ver-1/profils');
    expect(hrefs).toContain('/versions/ver-1/generations');
    expect(hrefs).not.toContain('/versions/ver-1/validation');
    expect(hrefs).not.toContain('/versions/ver-1/impact');
    expect(hrefs).not.toContain('/versions/ver-1/previsualisation');
  });

  it('marque l’écran courant', () => {
    renderNav('ADMINISTRATEUR', '/versions/ver-1/impact');
    const active = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute('href', '/versions/ver-1/impact');
  });

  it('ne rend rien pour un utilisateur sans rôle', () => {
    renderNav(undefined);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});