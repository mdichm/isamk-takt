'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEnseignant } from '@/hooks/use-enseignants';
import { EnseignantFormDialog } from '@/components/enseignants/enseignant-form-dialog';
import { ModulesPanel } from '@/components/enseignants/modules-panel';
import { DechargesPanel } from '@/components/enseignants/decharges-panel';
import { messages } from '@/lib/messages/fr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { findAllModules, type ModuleRef } from '@/lib/api/enseignants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit2, BarChart2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/api/errors';

const queryClient = new QueryClient();

function EnseignantDetailContent({ id }: { id: string }) {
  const { data: enseignant, isPending, error, refetch } = useEnseignant(id);
  const [editOpen, setEditOpen] = useState(false);

  const [allModules, setAllModules] = useState<ModuleRef[]>([]);

  useEffect(() => {
    let cancelled = false;
    findAllModules().then((r) => { if (!cancelled) setAllModules(r); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">{getErrorMessage(error) || messages.errorLoadEnseignants}</p>
      </div>
    );
  }

  if (isPending || !enseignant) {
    return <div className="p-4 flex items-center justify-center">{messages.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{enseignant.prenom} {enseignant.nom}</h1>
          <p className="text-muted-foreground">{enseignant.matricule} · {enseignant.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setEditOpen(true)}>
            <Edit2 size={18} className="mr-2" />
            {messages.editEnseignant}
          </Button>
          <Link href={`/enseignants/${enseignant.id}/charge-globale`}>
            <Button variant="outline">
              <BarChart2 size={18} className="mr-2" />
              {messages.btnVoirChargeGlobale}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{messages.informations}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.columnMatricule}</Badge>
              <span className="font-medium">{enseignant.matricule}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.email}</Badge>
              <span>{enseignant.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.columnTelephone}</Badge>
              <span>{enseignant.telephone ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.labelDepartement}</Badge>
              <span>{enseignant.departementId}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.labelGrade}</Badge>
              <span>{enseignant.gradeId ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={enseignant.isActive ? 'default' : 'secondary'}>
                {enseignant.isActive ? messages.active : messages.inactive}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{messages.statut}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{enseignant.isActive ? messages.active : messages.inactive}</p>
          </CardContent>
        </Card>
      </div>

      <ModulesPanel
        enseignantId={enseignant.id}
        modules={allModules}
        assignedModuleIds={enseignant.moduleIds}
      />

      <DechargesPanel
        enseignantId={enseignant.id}
        anneeId={enseignant.anneeId}
        onRefresh={refetch}
      />

      <EnseignantFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          refetch();
        }}
        enseignantToEdit={enseignant}
      />
    </div>
  );
}

export default function EnseignantDetailPage({ params }: { params: { id: string } }) {
  return (
    <QueryClientProvider client={queryClient}>
      <EnseignantDetailContent id={params.id} />
    </QueryClientProvider>
  );
}

