'use client';

import { useState } from 'react';
import { getCurrentUserRole } from '@/lib/auth';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { RulesetsTable } from '@/components/charge-ruleset/rulesets-table';
import { RulesetFormDialog } from '@/components/charge-ruleset/ruleset-form-dialog';

export default function ChargeRulesetsPage() {
  const role = getCurrentUserRole();
  const canWrite = role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE';

  if (role === undefined) {
    return <div className="p-4">{messages.loading}</div>;
  }

  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.rulesets}</h1>
          <p className="text-muted-foreground">{messages.rulesetsSubtitle}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setCreateOpen(true)}>
            {messages.btnCreerRuleset}
          </Button>
        )}
        {!canWrite && (
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {messages.errorForbidden}
          </span>
        )}
      </div>

      <RulesetsTable key={refreshKey} />

      <RulesetFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}