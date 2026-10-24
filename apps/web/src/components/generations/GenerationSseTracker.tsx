'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCancelGeneration } from '@/hooks/use-generations';
import { GenerationStatusBadge } from './GenerationStatusBadge';
import { t } from '@/lib/i18n';
import { API_BASE } from '@/lib/api/client';
import { type GenerationStatut } from '@/lib/api/generations';

interface GenerationSseTrackerProps {
  generationId: string;
  onGenerationComplete: () => void;
}

const PROGRESS_BY_STATUT: Record<GenerationStatut, number> = {
  QUEUED: 10,
  RUNNING: 50,
  SUCCEEDED: 100,
  SUCCEEDED_WITH_WARNINGS: 100,
  FAILED: 0,
  CANCELLED: 0,
  TIMED_OUT: 0,
};

const TERMINAL_STATUTS: GenerationStatut[] = [
  'SUCCEEDED',
  'SUCCEEDED_WITH_WARNINGS',
  'FAILED',
  'CANCELLED',
  'TIMED_OUT',
];

const termine = (statutVal: GenerationStatut): boolean =>
  TERMINAL_STATUTS.includes(statutVal);

const CANCELABLE_STATUTS: GenerationStatut[] = ['QUEUED', 'RUNNING'];

export function GenerationSseTracker({
  generationId,

  onGenerationComplete,
}: GenerationSseTrackerProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [statut, setStatut] = useState<GenerationStatut>('QUEUED');
  const [progression, setProgression] = useState(10);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cancelRequested, setCancelRequested] = useState(false);
  const { mutateAsync: cancelGeneration, isPending: isCancelling } =
    useCancelGeneration();

  const estAnnulable = (): boolean =>
    CANCELABLE_STATUTS.includes(statut) && !cancelRequested;

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/generations/${generationId}/events`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.statut && TERMINAL_STATUTS.concat(['QUEUED', 'RUNNING']).includes(data.statut as GenerationStatut)) {
          const nextStatut = data.statut as GenerationStatut;
          setStatut(nextStatut);
          setProgression(PROGRESS_BY_STATUT[nextStatut]);
        }
        if (data.erreur) {
          setErreur(String(data.erreur));
        }
        if (data.cancelRequested) {
          setCancelRequested(true);
        }
        if (termine(statut)) {
          es.close();
          onGenerationComplete();
        }
      } catch {
        // Ignorer les messages mal formés
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [generationId, onGenerationComplete]);

  const handleCancel = async () => {
    try {
      await cancelGeneration(generationId);
      setCancelRequested(true);
    } catch {
      // Erreur gérée par le hook (toast)
    }
  };

  if (!termine(statut)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('generation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('statut')} :</span>
            <GenerationStatusBadge statut={statut} />
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${progression}%` }}
            />
          </div>
          {erreur && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {erreur}
            </div>
          )}
          {estAnnulable() && (
            <Button
              onClick={handleCancel}
              disabled={isCancelling}
              variant="destructive"
              size="sm"
            >
              {isCancelling ? 'Annulation…' : t('annulerGeneration')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('generation')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('statut')} :</span>
          <GenerationStatusBadge statut={statut} />
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }} />
        </div>
        {erreur && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {erreur}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
