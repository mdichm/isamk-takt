/**
 * Sidebar - Navigation latérale conditionnée par rôle.
 *
 * Le menu affiche uniquement les entrées autorisées au rôle de l'utilisateur
 * connecté (règle L0-29). Les libellés sont externalisés via i18n (fonction t()).
 * Les entrées sont regroupées par sections, conformément à la charte TAKT
 * V2.3.6 (« Structure courte, hiérarchie claire »).
 *
 * Les écrans liés à une version (profils, générations, validation, impact,
 * prévisualisation) et les volumes par module ne figurent pas dans le menu
 * global : ce sont des accès contextuels, depuis la version et depuis la
 * répartition (voir VersionNav et le tableau des affectations).
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { t } from '@/lib/i18n';
import type { UserRole } from '@/lib/auth';

/** Sections de navigation, dans l'ordre d'affichage de la charte. */
type NavSectionKey =
  | 'vueEnsemble'
  | 'donnees'
  | 'planning'
  | 'ressources'
  | 'rapports'
  | 'administration'
  | 'direction';

type NavEntry = {
  label: string;
  href: string;
  roles: UserRole[];
  icon: React.ReactNode;
  section: NavSectionKey;
};

/** Ordre d'affichage des sections. */
const SECTION_ORDER: NavSectionKey[] = [
  'vueEnsemble',
  'donnees',
  'planning',
  'ressources',
  'rapports',
  'administration',
  'direction',
];

/** Clé i18n du libellé de chaque section. */
const SECTION_LABEL_KEYS: Record<NavSectionKey, string> = {
  vueEnsemble: 'navSectionVueEnsemble',
  donnees: 'navSectionDonnees',
  planning: 'navSectionPlanning',
  ressources: 'navSectionRessources',
  rapports: 'navSectionRapports',
  administration: 'navSectionAdministration',
  direction: 'navSectionDirection',
};

/** Tous les rôles de l'application (ST_TAKT §0.3, règle RC-11). */
const ALL_ROLES: UserRole[] = [
  'ADMINISTRATEUR',
  'GESTIONNAIRE',
  'RESPONSABLE_DEPARTEMENT',
  'DIRECTION',
  'ENSEIGNANT',
  'ETUDIANT',
];

/** Rôles de pilotage : Administrateur, Gestionnaire, Responsable, Direction. */
const PILOTAGE_ROLES: UserRole[] = [
  'ADMINISTRATEUR',
  'GESTIONNAIRE',
  'RESPONSABLE_DEPARTEMENT',
  'DIRECTION',
];

const icon = (d: string) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const DASHBOARD = icon('M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM4 12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z');
const USERS = icon('M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z');
const CIRCUIT = icon('M6 4v6m0 0a3 3 0 103 3m-3-3H4m2 3v3a3 3 0 103 3m-3-3h2m11-8V5m0 0a3 3 0 10-3 3m3-3h2m-2 3v9a3 3 0 103 3m-3-3h2');
const STRUCTURE = icon('M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10');
const SLOTS = icon('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z');
const RAMADAN = icon('M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.29l-.707-.707M12 19l.707-.707M5 19l.707.707M21 19l-.707.707');
const IMPORT = icon('M11.586 15.692a1 1 0 00-1.172 0L8.5 14.692V3h5a1 1 0 011 1v9.692l2.293 2.293a1 1 0 001.172 0l3.293-3.293a1 1 0 011.172 0l3.293 3.293a1 1 0 001.172 0l3.293-3.293a1 1 0 011.172 0l3.293 3.293z');
const SECURITY = icon('M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.047A7 7 0 003 11c0 1.611.55 3.093 1.456 4.233A10.077 10.077 0 015 20c-5.623 0-10-4.477-10-10a9.876 9.876 0 011.565-3.047c-.466-2.259.446-4.536 1.93-6.246A11.955 11.955 0 0112 2.944z');
const RULES = icon('M12 9v3.936c-.584.312-1 .995-1 1.564s.416 1.252 1 1.564V21h6v-3.5c0-.567-.224-1.067-.595-1.436M4.929 9.737c.577-.577 1.448-.577 2.025 0l.082.082a7 7 0 000 9.9l.082.082c.577.577 1.448.577 2.025 0l.082-.082a7 7 0 000-9.9l-.082-.082c-.577-.577-1.448-.577-2.025 0l-.082.082z');
const REPARTITIONS = icon("M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z");
const DEMANDES = icon("M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10");
const CHARGES = icon('M13 10V3L4 14h7v7l9-11h-7z');
const EXPORT = icon('M7 16a4 4 0 01-8 8-4 4 0 018-8m12-6h-4m4 4v-4a1 1 0 00-1-1H5a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1zm-1-4h-2v14h2V4z');
const COVOITURAGE = icon('M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z');
const NOTIF = icon('M18.364 5.636l-.707-.707a3 3 0 00-4.242 4.242l.707.707q.112.112.217.204c.099.083.194.175.277.267q.14.155.257.327c.07.103.131.212.186.325q.078.16.136.325c.036.102.065.206.087.312q.028.134.044.27.019.156.025.314c.006.182.007.365.005.548a1 1 0 01-1.993.117zm-6.8 4.466q.145.304.252.615c.075.217.137.436.181.657q.057.276.088.554c.018.162.028.325.032.488q.006.227-.003.454c-.004.13-.019.253-.034.374q-.022.18-.056.354c-.021.108-.05.21-.08.315a2 2 0 01-.22.447q-.115.15-.247.285c-.093.093-.189.177-.287.257q-.164.13-.339.243c-.107.07-.217.132-.329.188q-.178.088-.363.157c-.115.043-.233.076-.353.105-.138.035-.279.06-.42.077q-.21.025-.422.027a1 1 0 01-.707-.707l.707-.707q.112-.112.217-.204c.099-.083.194-.175.277-.267q.14-.155.257-.327c.07-.103.131-.212.186-.325q.078-.16.136-.325c.036-.102.065-.206.087-.312q.028-.134.044-.27.019-.156.025-.314c.006-.182.007-.365.005-.548a1 1 0 001.993-.117zm-4.357 4.357c-.48.482-.72.735-.915 1.015q-.15.217-.277.445c-.075.137-.141.278-.197.421q-.078.196-.136.395c-.037.126-.065.254-.087.384q-.027.154-.044.31-.019.183-.025.366c-.006.217-.007.434-.005.651a1 1 0 011.993-.117m6.8-4.466q-.145-.304-.252-.615c-.075-.217-.137-.436-.181-.657q-.057-.276-.088-.554c-.018-.162-.028-.325-.032-.488q-.006-.227.003-.454c.004-.13.019-.253.034-.374q.022-.18.056-.354c.021-.108.05-.21.08-.315a2 2 0 00.22-.447q.115-.15.247-.285c.093-.093.189-.177.287-.257q.164-.13.339-.243c.107-.07.217-.132.329-.188q.178-.088.363-.157c.115-.043.233-.076.353-.105.138-.035.279-.06.42-.077q.21-.025.422-.027a1 1 0 00-.707.707l-.707.707q-.112.112-.217.204c-.099.083-.194.175-.277.267q-.14.155-.257.327c-.07.103-.131.212-.186.325q-.078.16-.136.325c-.036.102-.065.206-.087.312q-.028.134-.044.27-.019.156-.025.314c-.006.182-.007.365-.005.548a1 1 0 001.993.117z');

const DIRECTION = icon('M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2-2z');

const NAV_ENTRIES: NavEntry[] = [
  // Vue d'ensemble
  { label: t('home'), href: '/', roles: ALL_ROLES, icon: DASHBOARD, section: 'vueEnsemble' },
  { label: t('tableauDeBord'), href: '/tableau-de-bord', roles: PILOTAGE_ROLES, icon: DASHBOARD, section: 'vueEnsemble' },
  { label: t('notifications'), href: '/notifications', roles: ALL_ROLES, icon: NOTIF, section: 'vueEnsemble' },

  // Données
  { label: t('structure'), href: '/structure', roles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'RESPONSABLE_DEPARTEMENT', 'DIRECTION', 'ENSEIGNANT'], icon: STRUCTURE, section: 'donnees' },
  { label: t('repartitions'), href: '/repartitions', roles: PILOTAGE_ROLES, icon: REPARTITIONS, section: 'donnees' },
  { label: t('demandes'), href: '/demandes', roles: PILOTAGE_ROLES, icon: DEMANDES, section: 'donnees' },
  { label: t('enseignants'), href: '/enseignants', roles: PILOTAGE_ROLES, icon: USERS, section: 'donnees' },
  { label: t('salles'), href: '/salles', roles: PILOTAGE_ROLES, icon: STRUCTURE, section: 'donnees' },
  { label: t('import'), href: '/import', roles: ['ADMINISTRATEUR', 'GESTIONNAIRE'], icon: IMPORT, section: 'donnees' },
  { label: t('charges'), href: '/charges', roles: PILOTAGE_ROLES, icon: CHARGES, section: 'donnees' },
  { label: t('chargesAnnueles'), href: '/charges/annuelles', roles: PILOTAGE_ROLES, icon: CHARGES, section: 'donnees' },
  { label: t('contraintes'), href: '/contraintes', roles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'DIRECTION'], icon: RULES, section: 'donnees' },
  { label: t('parametrageCharge'), href: '/charge/rulesets', roles: ['ADMINISTRATEUR', 'GESTIONNAIRE'], icon: RULES, section: 'donnees' },

  // Planning
  { label: t('creneaux'), href: '/creneaux', roles: PILOTAGE_ROLES, icon: SLOTS, section: 'planning' },
  { label: t('ramadan'), href: '/ramadan', roles: PILOTAGE_ROLES, icon: RAMADAN, section: 'planning' },

  // Ressources
  { label: t('covoiturage'), href: '/covoiturage', roles: ['ADMINISTRATEUR', 'GESTIONNAIRE'], icon: COVOITURAGE, section: 'ressources' },

  // Rapports
  { label: t('exportsTitle'), href: '/exports', roles: PILOTAGE_ROLES, icon: EXPORT, section: 'rapports' },
  { label: t('exportConfigTitle'), href: '/export-config', roles: ['ADMINISTRATEUR', 'GESTIONNAIRE'], icon: EXPORT, section: 'rapports' },

  // Administration
  { label: t('adminUsers'), href: '/admin/users', roles: ['ADMINISTRATEUR'], icon: USERS, section: 'administration' },
  { label: t('adminCircuit'), href: '/admin/circuit', roles: ['ADMINISTRATEUR'], icon: CIRCUIT, section: 'administration' },
  { label: t('adminSecurity'), href: '/admin/security', roles: ['ADMINISTRATEUR'], icon: SECURITY, section: 'administration' },
  { label: t('adminSecurityEvents'), href: '/admin/security-events', roles: ['ADMINISTRATEUR'], icon: SECURITY, section: 'administration' },

  // Direction
  { label: t('espaceDirection'), href: '/direction', roles: ['DIRECTION'], icon: DIRECTION, section: 'direction' },
  { label: t('planningPublieArchivé'), href: '/direction/planning', roles: ['DIRECTION'], icon: DASHBOARD, section: 'direction' },
  { label: t('audit'), href: '/direction/audit', roles: ['DIRECTION'], icon: SECURITY, section: 'direction' },
  { label: t('exportsDirection'), href: '/direction/exports', roles: ['DIRECTION'], icon: IMPORT, section: 'direction' },
];

/**
 * Détermine l'entrée active pour la route courante.
 * Le lien le plus spécifique l'emporte (par exemple « Charges annuelles »
 * plutôt que « Charges »).
 */
function findActiveHref(pathname: string, entries: NavEntry[]): string | null {
  const exact = entries.find((entry) => entry.href === pathname);
  if (exact) {
    return exact.href;
  }
  const candidates = entries.filter(
    (entry) => entry.href !== '/' && pathname.startsWith(`${entry.href}/`),
  );
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce((longest, entry) =>
    entry.href.length > longest.href.length ? entry : longest,
  ).href;
}

export default function Sidebar() {
  const { role, isAuthenticated } = useAuth();
  const pathname = usePathname() ?? '/';

  // Aucun menu pour les visiteurs non authentifiés (pages /login, /mfa, /password-reset).
  if (!isAuthenticated || !role) {
    return null;
  }

  const entries = NAV_ENTRIES.filter((entry) => entry.roles.includes(role));
  const activeHref = findActiveHref(pathname, entries);

  return (
    <aside
      aria-label={t('nav')}
      className="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-[var(--semantic-color-border-subtle)] bg-[var(--semantic-color-surface-navigation)] text-[var(--color-navigation_on_deep-text_primary)]"
    >
      <div className="flex items-center px-5 py-5">
        <span className="font-brand text-lg font-bold tracking-[0.3em]">
          {t('appTitle')}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {SECTION_ORDER.map((sectionKey) => {
          const sectionEntries = entries.filter(
            (entry) => entry.section === sectionKey,
          );
          if (sectionEntries.length === 0) {
            return null;
          }
          return (
            <div key={sectionKey} className="mb-5">
              <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-navigation_on_deep-text_secondary)]">
                {t(SECTION_LABEL_KEYS[sectionKey])}
              </h2>
              <ul className="space-y-0.5">
                {sectionEntries.map((entry) => {
                  const isActive = entry.href === activeHref;
                  return (
                    <li key={entry.href}>
                      <Link
                        href={entry.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-white/10 text-[var(--color-navigation_on_deep-text_primary)]'
                            : 'text-[var(--color-navigation_on_deep-text_secondary)] hover:bg-white/5 hover:text-[var(--color-navigation_on_deep-text_primary)]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-4 w-0.5 rounded-full ${
                            isActive
                              ? 'bg-[var(--color-navigation_on_deep-active_indicator)]'
                              : 'bg-transparent'
                          }`}
                        />
                        {entry.icon}
                        <span>{entry.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
