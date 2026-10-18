'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSalle } from '@/hooks/use-salles';
import { SalleFormDialog } from '@/components/salles/salle-form-dialog';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/api/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const queryClient = new QueryClient();

function SalleDetailContent({ id }: { id: string }) {
  const { data: salle, isPending, error } = useSalle(id);
  const [editOpen, setEditOpen] = useState(false);

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">{getErrorMessage(error) || messages.errorSalleNotFound}</p>
      </div>
    );
  }

  if (isPending || !salle) {
    return <div className="p-4 flex items-center justify-center">{messages.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{salle.libelle}</h1>
          <p className="text-muted-foreground">{salle.code} · {salle.siteId ?? '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setEditOpen(true)}>
            <Edit2 size={18} className="mr-2" />
            {messages.editSalle}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{messages.informations}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.columnCode}</Badge>
              <span className="font-medium">{salle.code}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.columnLibelle}</Badge>
              <span>{salle.libelle}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.columnSite}</Badge>
              <span>{salle.siteId ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.columnTypeSalle}</Badge>
              <span>{salle.typeSalleId ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.columnCapacite}</Badge>
              <span>{salle.capaciteMax}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.labelCapaciteRecommandee}</Badge>
              <span>{salle.capaciteRecommandee ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.labelAccesPMR}</Badge>
              <span>{salle.accesPMR ? messages.active : messages.inactive}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.labelCommentaire}</Badge>
              <span>{salle.commentaire ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{messages.labelDepartement}</Badge>
              <span>{salle.departementId ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={salle.estActive ? 'default' : 'secondary'}>
                {salle.estActive ? messages.active : messages.inactive}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{messages.etat}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{salle.estActive ? messages.active : messages.inactive}</p>
          </CardContent>
        </Card>
      </div>

      <SalleFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        salleToEdit={salle}
      />
    </div>
  );
}

export default function SalleDetailPage({ params }: { params: { id: string } }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SalleDetailContent id={params.id} />
    </QueryClientProvider>
  );
}
