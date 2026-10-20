/**
 * ShellLayout - Layout principal enveloppant toutes les pages de l'application web.
 *
 * Intègre :
 * - QueryClientProvider (React Query) pour la gestion du cache serveur
 * - AuthProvider (contexte d'authentification : token, rôle, login, logout, refresh)
 * - Toast (notifications déjà existantes)
 *
 * Le layout racine (app/layout.tsx) rend ce composant autour de {children}.
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect } from 'react';
import { Toast } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from './AuthProvider';
import { registerUnauthorizedHandler } from '@/lib/api/client';

// Instance partagée du QueryClient (créée une fois, hors du composant pour éviter les recréations).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

type ShellLayoutProps = {
  children: ReactNode;
};

/**
 * Enregistre le gestionnaire de refresh transparent au sein d'AuthProvider.
 * Ce composant doit être un descendant d'AuthProvider pour pouvoir utiliser useAuth.
 */
function AuthInitializer() {
  const { refreshToken } = useAuth();

  useEffect(() => {
    registerUnauthorizedHandler(refreshToken);
  }, [refreshToken]);

  return null;
}

/**
 * Coque de l'application : auth + React Query + toast.
 */
export function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthInitializer />
        {children}
        <Toast />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default ShellLayout;
export { queryClient };