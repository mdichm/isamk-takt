/**
 * VersionNav - Navigation contextuelle entre les écrans d'une même version.
 *
 * Les écrans « profils », « générations », « validation », « impact » et
 * « prévisualisation » dépendent tous d'un identifiant de version : ils sont
 * donc accessibles depuis la version elle-même (accès contextuel, L5-27) et
 * non depuis le menu global, dont les cibles `/versions/[id]/*` n'existent pas.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/shell/AuthProvider';
import type { UserRole } from '@/lib/auth';
import { t } from '@/lib/i18n';

type VersionNavEntry = {
  /** Clé i18n du libellé. */
  labelKey: string;
  /** Chemin relatif à la version (la version elle-même est représentée par ''). */
  path: string;
  /** Rôles autorisés à consulter cet écran. */
  roles: UserRole[];
};

const VERSION_NAV_ENTRIES: VersionNavEntry[] = [
  {
    labelKey: 'versionLabel',
    path: '',
    roles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'RESPONSABLE_DEPARTEMENT', 'DIRECTION'],
  },
  {
    labelKey: 'profils',
    path: '/profils',
    roles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'DIRECTION'],
  },
  {
    labelKey: 'generations',
    path: '/generations',
    roles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'DIRECTION'],
  },
  {
    labelKey: 'validation',
    path: '/validation',
    roles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'RESPONSABLE_DEPARTEMENT'],
  },
  {
    labelKey: 'impact',
    path: '/impact',
    roles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'RESPONSABLE_DEPARTEMENT'],
  },
  {
    labelKey: 'previsualisation',
    path: '/previsualisation',
    roles: ['ADMINISTRATEUR', 'GESTIONNAIRE'],
  },
];

type VersionNavProps = {
  versionId: string;
};

/**
 * Affiche les liens vers les écrans d'une version, filtrés par rôle.
 * Rien n'est rendu si l'utilisateur n'a accès à aucun écran.
 */
export function VersionNav({ versionId }: VersionNavProps) {
  const { role } = useAuth();
  const pathname = usePathname() ?? '';

  if (!role) {
    return null;
  }

  const entries = VERSION_NAV_ENTRIES.filter((entry) => entry.roles.includes(role));
  if (entries.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label={t('nav')}
      className="mb-4 flex flex-wrap items-center gap-1 border-b border-border pb-2"
    >
      {entries.map((entry) => {
        const href = `/versions/${versionId}${entry.path}`;
        const isActive = pathname === href;
        return (
          <Link
            key={entry.path}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {t(entry.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

export default VersionNav;