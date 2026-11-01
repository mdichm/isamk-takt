/** Navbar - Barre de navigation principale avec lien de déconnexion. */

'use client';

import Link from 'next/link';
import { useAuth } from '@/components/shell/AuthProvider';
import { t } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { role, logout, user, isAuthenticated } = useAuth();

  // La navbar n'est rendue que pour les utilisateurs authentifiés.
  // La redirection vers /login après déconnexion est gérée par RouteGuard.
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  const displayUser = user ?? t('userLabel');
  const displayRole = role ?? '';

  return (
    <nav className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{t('appTitle')}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/tableau-de-bord"
            className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
          >
            {t('tableauDeBord')}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <span className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-foreground hover:bg-accent rounded-md cursor-default transition-colors">
                <span className="text-sm">{displayUser}</span>
                <span className="text-xs opacity-60">{displayRole}</span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleLogout}>{t('logout')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}