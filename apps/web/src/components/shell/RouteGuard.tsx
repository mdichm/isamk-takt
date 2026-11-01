/**
 * RouteGuard - Autorité unique de redirection de l'application web.
 *
 * Toutes les redirections passent par ce composant :
 * - `/`           → /tableau-de-bord (authentifié) ou /login
 * - route privée  → /login si non authentifié
 * - `/login`      → /tableau-de-bord si déjà authentifié
 *
 * Aucune autre page ne doit déclencher de redirection : plusieurs
 * `router.push` concurrents se neutralisent et laissent le shell vide.
 */

'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

/** Routes accessibles sans authentification. */
const PUBLIC_ROUTES = ['/login', '/mfa', '/password-reset'];

/** Page d'accueil de l'application une fois authentifié. */
const HOME = '/tableau-de-bord';

/** Indique si une route est accessible sans être authentifié. */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

/**
 * Détermine la destination à imposer, ou null si l'utilisateur peut rester
 * sur la page courante.
 */
function resolveRedirect(pathname: string, isAuthenticated: boolean): string | null {
  if (pathname === '/') {
    return isAuthenticated ? HOME : '/login';
  }
  if (isPublicRoute(pathname)) {
    return pathname === '/login' && isAuthenticated ? HOME : null;
  }
  return isAuthenticated ? null : '/login';
}

type RouteGuardProps = {
  children: ReactNode;
};

export function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname() ?? '/';
  const router = useRouter();

  const target = isLoading ? null : resolveRedirect(pathname, isAuthenticated);

  useEffect(() => {
    if (target && target !== pathname) {
      router.replace(target);
    }
  }, [target, pathname, router]);

  // Tant que l'authentification est résolue ou qu'une redirection est en cours,
  // on n'affiche pas le contenu : évite le flash d'un shell vide.
  if (isLoading || target) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export default RouteGuard;