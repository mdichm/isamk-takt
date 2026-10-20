/**
 * Page de connexion.
 * Formulaire email/mot de passe. Le token est géré par le backend (cookie httpOnly).
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/shell/AuthProvider';
import { t } from '@/lib/i18n';

const schema = z.object({
  email: z.string().email('E-mail invalide.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (!res.ok) {
        setError(t('invalidCredentials'));
        setLoading(false);
        return;
      }

      const body = await res.json();
      const token = body.token as string | undefined;
      if (token) {
        login(token);
        router.push('/');
      } else {
        setError(t('invalidCredentials'));
      }
    } catch {
      setError(t('error'));
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
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="nom@exemple.com"
              {...form.register('email')}
              disabled={loading}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
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