'use client';

import { useState, useEffect, useCallback } from 'react';
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

export default function SecurityPage() {
  const role = getCurrentUserRole();

  // Tous les hooks doivent être appelés inconditionnellement avant tout early return
  const [config, setConfig] = useState<SecurityConfigDto | null>(null);
  const [form, setForm] = useState<SecurityConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const data = await getSecurityConfig();
      setConfig(data);
      setForm({ ...data });
    } catch {
      setMessage({ type: 'error', text: messages.errorLoadSecurityConfig });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const onSubmit = async () => {
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateSecurityConfig({
        longueurMin: form.longueurMin,
        maxEchecs: form.maxEchecs,
        verrouillageMinutes: form.verrouillageMinutes,
        inactiviteMinutes: form.inactiviteMinutes,
        conservationAuditJours: form.conservationAuditJours,
        conservationSecuriteJours: form.conservationSecuriteJours,
      });
      setMessage({ type: 'success', text: messages.saveSuccess });
      setConfig({ ...form });
    } catch {
      setMessage({ type: 'error', text: messages.saveError });
    } finally {
      setSaving(false);
    }
  };

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
          message.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'
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
                value={form?.longueurMin ?? config.longueurMin}
                onChange={(e) => setForm((f) => f ? { ...f, longueurMin: Number(e.target.value) } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelMaxFailures}</label>
              <Input
                type="number"
                value={form?.maxEchecs ?? config.maxEchecs}
                onChange={(e) => setForm((f) => f ? { ...f, maxEchecs: Number(e.target.value) } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelLockoutMinutes}</label>
              <Input
                type="number"
                value={form?.verrouillageMinutes ?? config.verrouillageMinutes}
                onChange={(e) => setForm((f) => f ? { ...f, verrouillageMinutes: Number(e.target.value) } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelInactivityMinutes}</label>
              <Input
                type="number"
                value={form?.inactiviteMinutes ?? config.inactiviteMinutes}
                onChange={(e) => setForm((f) => f ? { ...f, inactiviteMinutes: Number(e.target.value) } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelAuditRetentionDays}</label>
              <Input
                type="number"
                value={form?.conservationAuditJours ?? config.conservationAuditJours ?? ''}
                onChange={(e) => setForm((f) => f ? { ...f, conservationAuditJours: e.target.value ? Number(e.target.value) : null } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">{messages.labelSecurityRetentionDays}</label>
              <Input
                type="number"
                value={form?.conservationSecuriteJours ?? config.conservationSecuriteJours}
                onChange={(e) => setForm((f) => f ? { ...f, conservationSecuriteJours: Number(e.target.value) } : null)}
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
