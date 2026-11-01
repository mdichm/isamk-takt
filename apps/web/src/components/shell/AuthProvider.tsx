/**
 * AuthProvider - Contexte d'authentification côté client.
 *
 * Fournit : user, role, departments, isAuthenticated, isLoading, login(), logout(), refreshToken().
 * Le token d'accès est stocké dans un cookie httpOnly `token` (géré par le backend).
 * Le payload du JWT contient le champ `role` (signé par le backend).
 *
 * Gère le refresh transparent du jeton : en cas de 401 sur une requête API,
 * le provider tente un refresh ; si le refresh échoue, il déconnecte l'utilisateur.
 * L'état de saisie des formulaires est préservé (pas de rechargement de page).
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  clearAccessToken,
  decodeJwtPayload,
  getTokenFromCookie,
  persistAccessToken,
  type UserRole,
} from '@/lib/auth';
import { apiFetch } from '@/lib/api/client';

type AuthContextType = {
  user: string | undefined;
  role: UserRole | undefined;
  departments: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Profil utilisateur renvoyé par GET /api/auth/me.
 * Le backend retourne l'objet `request.user` du JwtStrategy, à plat :
 * { id, email, firstName, lastName, role, roles, departments }.
 * Il n'y a ni champ `username` ni objet `user` imbriqué.
 */
type AuthProfile = {
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  roles?: { role: string; departementCode?: string | null }[];
  departments?: string[];
};

/**
 * Hook d'utilisation du contexte d'authentification.
 * Lance une erreur si utilisé en dehors d'un AuthProvider.
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  }
  return ctx;
}

type AuthProviderProps = {
  children: React.ReactNode;
};

/**
 * Tente de rafraîchir le token d'accès en appelant l'endpoint de refresh du backend.
 * Le nouveau jeton est persisté (cookie `token` + localStorage) car l'endpoint
 * ne le renvoie que dans le corps de la réponse JSON.
 * Retourne true si le refresh a réussi, false sinon.
 */
async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await apiFetch('/api/auth/refresh', { method: 'POST' });
    const body = (await res.json().catch(() => ({}))) as { accessToken?: string };
    if (body.accessToken) {
      persistAccessToken(body.accessToken);
    }
    return true;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [departments, setDepartments] = useState<string[]>([]);
  const [user, setUser] = useState<string | undefined>(undefined);
  // Évite un double chargement du profil en mode StrictMode (développement).
  const initialized = useRef<boolean>(false);

  /** Applique le profil renvoyé par GET /api/auth/me. */
  const applyProfile = useCallback((profile: AuthProfile): void => {
    // Le backend renvoie l'utilisateur à plat : { id, email, firstName, lastName, role, departments }.
    const fullName = [profile.firstName, profile.lastName]
      .filter((part): part is string => Boolean(part))
      .join(' ')
      .trim();
    setUser(fullName || profile.email || undefined);
    if (profile.role) {
      setRole(profile.role as UserRole);
    }
    if (profile.departments) {
      setDepartments(profile.departments);
    }
  }, []);

  // Lecture du token après hydratation uniquement (évite le mismatch SSR/client)
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    const stored = getTokenFromCookie();
    // Les mises à jour d'état sont différées d'un tick : un setState synchrone
    // dans un effet provoquerait un rendu en cascade (règle react-hooks).
    setTimeout(() => {
      if (!stored) {
        setIsLoading(false);
        return;
      }

      setToken(stored);
      const payload = decodeJwtPayload<{ role?: string; email?: string; departments?: string[] }>(stored);
      setRole((payload?.role ?? undefined) as UserRole | undefined);
      setDepartments(payload?.departments ?? []);
      setUser(payload?.email);
      setIsLoading(false);

      // Récupère le vrai profil depuis /api/auth/me (nom d'affichage, rôle, départements)
      apiFetch('/api/auth/me')
        .then(async (res) => {
          applyProfile((await res.json()) as AuthProfile);
        })
        .catch(() => {
          // On garde les valeurs déduites du JWT en cas d'échec
        });
    }, 0);

    // Pas de cleanup : en mode StrictMode l'effet est rejoué immédiatement,
    // le garde `initialized` empêche alors un second chargement du profil.
    return undefined;
  }, [applyProfile]);

  // Connexion : persiste le token, décode le JWT pour un affichage immédiat,
  // puis récupère le profil complet depuis /api/auth/me (vrai nom, rôle, départements).
  const login = useCallback(async (newToken: string) => {
    persistAccessToken(newToken);
    setToken(newToken);
    const payload = decodeJwtPayload<{ role?: string; email?: string; departments?: string[] }>(newToken);
    setRole((payload?.role ?? undefined) as UserRole | undefined);
    setDepartments(payload?.departments ?? []);
    setUser(payload?.email);

    try {
      const res = await apiFetch('/api/auth/me');
      applyProfile((await res.json()) as AuthProfile);
    } catch {
      // En cas d'échec, on garde les valeurs déduites du JWT.
    }
  }, [applyProfile]);

  // Vide l'état local et supprime le jeton d'accès (cookie + localStorage).
  const clearSession = useCallback((): void => {
    clearAccessToken();
    setToken(undefined);
    setRole(undefined);
    setUser(undefined);
    setDepartments([]);
  }, []);

  // Déconnexion : appelle l'API de logout pour révoquer la session, puis vide l'état.
  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignorer les erreurs réseau, on vide quand même l'état local
    }
    clearSession();
  }, [clearSession]);

  // Refresh transparent du jeton.
  const refreshToken = useCallback(async () => {
    const ok = await attemptRefresh();
    if (!ok) {
      clearSession();
    }
    return ok;
  }, [clearSession]);

  const value: AuthContextType = {
    user,
    role,
    departments,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;