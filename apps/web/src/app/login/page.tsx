/**
 * Page de connexion.
 * Formulaire login/mot de passe. Le token est géré par le backend (cookie httpOnly).
 * Les identifiants peuvent être un login (username) OU une adresse e-mail.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/shell/AuthProvider';
import { t } from '@/lib/i18n';
import { apiFetch } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';

const schema = z.object({
  login: z.string().min(1, 'Identifiant requis.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '' },
  });

  // La redirection vers /tableau-de-bord (et depuis /tableau-de-bord vers /login)
  // est gérée par RouteGuard : c'est la seule autorité de redirection.

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      // Utiliser l'API via le proxy Next.js (/api -> backend localhost:3001)
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: data.login, password: data.password }),
      });

      const body = (await res.json()) as { accessToken?: string };
      if (!body.accessToken) {
        setError(t('invalidCredentials'));
        return;
      }

      await login(body.accessToken);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.status === 401 ? t('invalidCredentials') : e.message);
      } else {
        setError(t('error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-xl border border-solid border-zinc-200 dark:border-zinc-800 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t('signInTitle')}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Bienvenue sur TAKT. Connectez-vous pour accéder à votre espace.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="login">{t('loginLabel')}</Label>
            <Input
              id="login"
              type="text"
              placeholder="Identifiant ou e-mail"
              autoComplete="username"
              {...form.register('login')}
              disabled={loading}
            />
            {form.formState.errors.login && (
              <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.login.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...form.register('password')}
              disabled={loading}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('signingIn') : t('signInButton')}
          </Button>
        </form>
      </div>
    </div>
  );
}