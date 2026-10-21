'use client';

import { useState } from 'react';
import { getCurrentUserRole } from '@/lib/auth';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChargeRuleSet } from '@/hooks/use-charge-ruleset';
import { RulesetFormDialog } from '@/components/charge-ruleset/ruleset-form-dialog';

export default function ChargeRulesetEditPage({
  params,
}: { params: { id: string } }) {
  const role = getCurrentUserRole();
  const canWrite = role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE';

  const { data: ruleset, isPending, error } = useChargeRuleSet(params.id);
  const [editOpen, setEditOpen] = useState(false);

  if (role === undefined) {
    return <div className="p-4">{messages.loading}</div>;
  }

  if (isPending) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chargement du jeu de règles de charge…
      </div>
    );
  }

  if (error || !ruleset) {
    return (
      <div className="p-4 text-destructive">
        {messages.errorRulesetNotFound}
      </div>
    );
  }

  const isPublished = ruleset.publieLe !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {messages.rulesets} #{ruleset.numero}
          </h1>
          <p className="text-muted-foreground">
            {ruleset.createdAt} — {ruleset.updatedAt}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPublished ? 'secondary' : 'outline'}>
            {isPublished ? messages.etatPublie : messages.etatBrouillon}
          </Badge>
          {canWrite && !isPublished && (
            <Button onClick={() => setEditOpen(true)}>
              {messages.btnEditer}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase">{messages.labelNumero}</p>
          <p className="font-mono font-medium">{ruleset.numero}</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase">{messages.labelPeriode}</p>
          <p className="font-medium">{ruleset.periode}</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase">{messages.labelSeuil}</p>
          <p className="font-mono">{ruleset.seuil ?? '—'} min</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase">{messages.labelPlafond}</p>
          <p className="font-mono">{ruleset.plafond ?? '—'} min</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase">{messages.labelArrondi}</p>
          <p className="font-mono">{ruleset.arrondi ?? '—'} min</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase">{messages.labelAnnee}</p>
          <p className="font-mono">{ruleset.anneeId ?? '—'}</p>
        </div>
      </div>

      {ruleset.referenceGrades.length > 0 || ruleset.coefficients.length > 0 ? (
        <div className="border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Coefficients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Grades</h4>
              <ul className="space-y-2">
                {ruleset.referenceGrades.map((rg) => (
                  <li key={rg.id} className="flex justify-between text-sm">
                    <span>{rg.gradeId ?? 'Défaut'}</span>
                    <span className="font-mono">{rg.coefficient}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Types d’enseignement</h4>
              <ul className="space-y-2">
                {ruleset.coefficients.map((c) => (
                  <li key={c.id} className="flex justify-between text-sm">
                    <span>{c.typeId}</span>
                    <span className="font-mono">{c.coefficient}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Aucun coefficient configuré.
        </div>
      )}

      <RulesetFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        ruleset={ruleset}
      />
    </div>
  );
}