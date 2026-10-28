/**
 * AuthProvider - Contexte d'authentification côté client.
 *
 * Fournit : user, role, isAuthenticated, login(), logout(), refreshToken().
 * Le token d'accès est stocké dans un cookie httpOnly `token` (géré par le backend).
 * Le payload du JWT contient le champ `role` (signé par le backend).
 *
 * Gère le refresh transparent du jeton : en cas de 401 sur une requête API,
 * le provider tente un refresh ; si le refresh échoue, il déconnecte l'utilisateur.
 * L'état de saisie des formulaires est préservé (pas de rechargement de page).
 */

'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import {
  getTokenFromCookie,
  decodeJwtPayload,
  type UserRole,
} from '@/lib/auth';
import { apiFetch } from '@/lib/api/client';

type AuthContextType = {
  user: string | undefined;
  role: UserRole | undefined;
  departments: string[];
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
 * Retourne true si le refresh a réussi, false sinon.
 */
async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await apiFetch('/auth/refresh', { method: 'POST' });
    if (res.ok) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialToken = getTokenFromCookie();
  const [token, setToken] = useState<string | undefined>(initialToken);
  const [role, setRole] = useState<UserRole | undefined>(() => {
    if (!initialToken) return undefined;
    const payload = decodeJwtPayload<{ role?: string }>(initialToken);
    return (payload?.role ?? undefined) as UserRole | undefined;
  });
  const [departments, setDepartments] = useState<string[]>(() => {
    if (!initialToken) return [];
    const payload = decodeJwtPayload<{ departments?: string[] }>(initialToken);
    return payload?.departments ?? [];
  });
  const [user, setUser] = useState<string | undefined>(() => {
    if (!initialToken) return undefined;
    const payload = decodeJwtPayload<{ sub?: string }>(initialToken);
    return payload?.sub;
  });

  // Connexion : stocke le token et déduit le rôle depuis le JWT.
  const login = useCallback((newToken: string) => {
    setToken(newToken);
    const payload = decodeJwtPayload<{ role?: string; sub?: string; departments?: string[] }>(newToken);
    setRole((payload?.role ?? undefined) as UserRole | undefined);
    setDepartments(payload?.departments ?? []);
    setUser(payload?.sub);
  }, []);

  // Déconnexion : efface l'état d'authentification.
  const logout = useCallback(() => {
    setToken(undefined);
    setRole(undefined);
    setUser(undefined);
  }, []);

  // Refresh transparent du jeton.
  const refreshToken = useCallback(async () => {
    const ok = await attemptRefresh();
    if (!ok) {
      logout();
    }
    return ok;
  }, [logout]);

  const value: AuthContextType = {
    user,
    role,
    departments,
    isAuthenticated: !!token,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;