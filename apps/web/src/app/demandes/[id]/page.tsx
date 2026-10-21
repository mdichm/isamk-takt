'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useDemande } from '@/hooks/use-demandes';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/shell/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { messages } from '@/lib/messages/fr';
import { DemandeTraiterDialog } from '@/components/demandes/demande-traiter-dialog';

const STATUT_BADGE: Record<string, string> = {
  OUVERTE: 'bg-blue-50 text-blue-700 border-blue-200',
  TRAITEE: 'bg-green-50 text-green-700 border-green-200',
  REFUSEE: 'bg-red-50 text-red-700 border-red-200',
};

export default function DemandeDetailPage({ params }: { params: { id: string } }) {
  const [queryClient] = useState(() => new QueryClient());
  const { role } = useAuth();
  const router = useRouter();
  const [traiterOpen, setTraiterOpen] = useState(false);

  const { data: demande, isError, refetch } = useDemande(params.id);

  const canTraiter =
    role === 'ADMINISTRATEUR' ||
    role === 'DIRECTION' ||
    role === 'RESPONSABLE_DEPARTEMENT';

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-destructive">{messages.errorLoadDemandes}</div>
        <Button onClick={() => router.push('/demandes')}>{messages.btnRetour}</Button>
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">{messages.loading}</div>
      </div>
    );
  }

  const peutTraiterOuverte = canTraiter && demande.statut === 'OUVERTE';

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{messages.demandeDetail}</h1>
            <p className="text-muted-foreground">{messages.demandeId} {demande.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push('/demandes')}>{messages.btnRetour}</Button>
            {peutTraiterOuverte && (
              <Button onClick={() => setTraiterOpen(true)}>
                {messages.btnTraiter}
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className={STATUT_BADGE[demande.statut]}>
                {demande.statut === 'OUVERTE' ? messages.statutOuverte : demande.statut === 'TRAITEE' ? messages.statutTraitee : messages.statutRefusee}
              </Badge>
              {demande.type === 'ANOMALIE' ? messages.typeAnomalie : messages.typeModification}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{messages.labelSemestre}</span>
              <span className="text-sm font-medium">{demande.semestreId}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{messages.departement}</span>
              <span className="text-sm font-medium">{demande.departementCode}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{messages.labelAuteur}</span>
              <span className="text-sm font-medium">{demande.auteurId}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{messages.columnDate}</span>
              <span className="text-sm font-medium">
                {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {demande.versionId && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">{messages.labelVersion}</span>
                <span className="text-sm font-medium">{demande.versionId}</span>
              </div>
            )}
            {demande.traiteePar && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">{messages.labelTraiteePar}</span>
                <span className="text-sm font-medium">{demande.traiteePar}</span>
              </div>
            )}
            {demande.traiteeLe && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">{messages.labelTraiteeLe}</span>
                <span className="text-sm font-medium">
                  {new Date(demande.traiteeLe).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </CardContent>
          <CardContent className="col-span-2 mt-4">
            <span className="text-xs text-muted-foreground block mb-1">{messages.labelMotif}</span>
            <p className="text-sm">{demande.motif}</p>
          </CardContent>
          <CardContent className="col-span-2">
            <span className="text-xs text-muted-foreground block mb-1">{messages.labelCible}</span>
            <p className="text-sm font-mono text-muted-foreground break-all">
              {JSON.stringify(demande.cible)}
            </p>
          </CardContent>
          {demande.reponse && (
            <CardContent className="col-span-2">
              <span className="text-xs text-muted-foreground block mb-1">{messages.labelReponse}</span>
              <p className="text-sm">{demande.reponse}</p>
            </CardContent>
          )}
        </Card>

        <DemandeTraiterDialog
          open={traiterOpen}
          onOpenChange={setTraiterOpen}
          demandeId={demande.id}
          onSuccess={() => {
            setTraiterOpen(false);
            refetch();
          }}
        />
      </div>
    </QueryClientProvider>
  );
}