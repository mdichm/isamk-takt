/**
 * Header - Barre supérieure de l'application.
 *
 * Affiche : logo TAKT, nom et rôle de l'utilisateur connecté, bouton de déconnexion.
 * Les libellés sont externalisés via i18n.
 */

'use client';

import { useAuth } from './AuthProvider';
import { t } from '@/lib/i18n';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const LOGO = (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c2.332 0 3.832.477 4.5 1.253v13C18.832 18.477 17.246 18 15.5 18s-3.332.477-4.5 1.253m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13q0 .552.225 1.057a3 3 0 00.449 1.428C3.745 21.5 4.565 21 5.5 21s1.754.5 2.345 1.313a3 3 0 00.449-1.428A3 3 0 009.5 19c0-.552-.225-1.057-.225-1.057m0-13c-.895 0-1.62.562-1.916 1.02-.297.46-.394 1.008-.225 1.479.17.498.581.849 1.072 1.066a10.2 10.2 0 002.59 1.159c2.317.443 4.21-.575 5.31-2.318.602-.96.84-2.094.84-3.377 0-1.295-.244-2.44-.806-3.417-.46-.793-1.083-1.343-1.81-1.665-.646-.284-1.41-.393-2.058-.393zm0 13c-.895 0-1.62-.562-1.916-1.02-.297-.46-.394-1.008-.225-1.479.17-.498.581-.849 1.072-1.066a10.2 10.2 0 002.59-1.159c2.317-.443 4.21.575 5.31 2.318.602.96.84 2.094.84 3.377 0 1.295-.244 2.44-.806 3.417-.46.793-1.083 1.343-1.81 1.665-.646.284-1.41.393-2.058.393z" />
  </svg>
);

const USER_ICON = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LOGOUT_ICON = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
  </svg>
);

export default function Header() {
  const { user, role, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-solid border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-3">
          {LOGO}
          <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">TAKT</span>
        </div>

        <div className="flex items-center gap-4">
          {user && role && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs">
              {USER_ICON}
              <span className="font-medium">{user}</span>
              <span className="text-zinc-500">{role}</span>
            </div>
          )}
          <NotificationBell />
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            aria-label={t('logout')}
          >
            {LOGOUT_ICON}
            <span className="hidden md:inline">{t('logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}