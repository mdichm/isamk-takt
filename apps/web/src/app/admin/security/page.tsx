'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  getSecurityConfig,
  updateSecurityConfig,
  type SecurityConfigDto,
} from '@/lib/api/security';
import { messages } from '@/lib/messages/fr';
import { getCurrentUserRole, isAdmin } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const queryClient = new QueryClient();

function SecurityContent() {
  const { data: config, isLoading: loading } = useQuery({
    queryKey: ['securityConfig'],
    queryFn: getSecurityConfig,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const onChange = (key: keyof SecurityConfigDto, value: string) => {
    const numValue = Number(value);
    queryClient.setQueryData(['securityConfig'], (old: SecurityConfigDto | undefined) =>
      old ? { ...old, [key]: numValue } : old,
    );
  };

  const onSubmit = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateSecurityConfig({
        longueurMin: config.longueurMin,
        maxEchecs: config.maxEchecs,
        verrouillageMinutes: config.verrouillageMinutes,
        inactiviteMinutes: config.inactiviteMinutes,
        conservationAuditJours: config.conservationAuditJours,
        conservationSecuriteJours: config.conservationSecuriteJours,
      });
      setMessage({ type: 'success', text: messages.saveSuccess });
    } catch {
      setMessage({ type: 'error', text: messages.saveError });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <div className="p-4"><p>{messages.loading}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{messages.securitySettings}</h1>
          <p className="text-muted-foreground">{messages.settingsSubtitle}</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success'
            ? 'bg-green-50 text-green-900 border border-green-200'
            : 'bg-red-50 text-red-900 border border-red-200'
        }`}>{message.text}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{messages.securityConfig}</CardTitle>
          <CardDescription>
            Règles de mot de passe, verrouillage, inactivité et conservation des journaux.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelMinPasswordLength}</label>
              <Input
                type="number"
                value={config.longueurMin}
                onChange={(e) => onChange('longueurMin', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelMaxFailures}</label>
              <Input
                type="number"
                value={config.maxEchecs}
                onChange={(e) => onChange('maxEchecs', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelLockoutMinutes}</label>
              <Input
                type="number"
                value={config.verrouillageMinutes}
                onChange={(e) => onChange('verrouillageMinutes', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelInactivityMinutes}</label>
              <Input
                type="number"
                value={config.inactiviteMinutes}
                onChange={(e) => onChange('inactiviteMinutes', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelAuditRetentionDays}</label>
              <Input
                type="number"
                value={config.conservationAuditJours ?? 0}
                onChange={(e) => onChange('conservationAuditJours', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelSecurityRetentionDays}</label>
              <Input
                type="number"
                value={config.conservationSecuriteJours}
                onChange={(e) => onChange('conservationSecuriteJours', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="button" onClick={onSubmit} disabled={saving}>
            {saving ? 'Enregistrement...' : messages.btnSave}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SecurityPage() {
  const role = getCurrentUserRole();

  if (role === undefined) {
    return <div className="p-4"><p>{messages.loading}</p></div>;
  }

  if (!isAdmin(role)) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-semibold">{messages.error}</h1>
        <p className="text-muted-foreground">{messages.errorForbidden}</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SecurityContent />
    </QueryClientProvider>
  );
}
