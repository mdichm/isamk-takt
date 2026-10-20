/**
 * Page de changement de mot de passe.
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
import { t } from '@/lib/i18n';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis.'),
    newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
    confirmPassword: z.string().min(1, 'Veuillez confirmer le nouveau mot de passe.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function PasswordResetPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!res.ok) {
        setError('Mot de passe actuel incorrect ou erreur lors du changement.');
        setLoading(false);
        return;
      }

      setSuccess(t('passwordChanged'));
      form.reset();
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-xl border border-solid border-zinc-200 dark:border-zinc-800 shadow-md text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t('changePasswordTitle')}</h1>
          <p className="text-green-600 dark:text-green-400 font-medium">{success}</p>
          <Button onClick={() => router.push('/login')} className="mt-6 w-full">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-xl border border-solid border-zinc-200 dark:border-zinc-800 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t('changePasswordTitle')}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Saisissez votre mot de passe actuel et définissez un nouveau mot de passe.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('currentPasswordLabel')}</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="••••••••"
              {...form.register('currentPassword')}
              disabled={loading}
            />
            {form.formState.errors.currentPassword && (
              <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPasswordLabel')}</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              {...form.register('newPassword')}
              disabled={loading}
            />
            {form.formState.errors.newPassword && (
              <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...form.register('confirmPassword')}
              disabled={loading}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('changingPassword') : t('changePasswordButton')}
          </Button>
        </form>
      </div>
    </div>
  );
}