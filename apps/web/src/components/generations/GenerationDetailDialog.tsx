'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GenerationStatusBadge } from './GenerationStatusBadge';
import { useGenerationDetail } from '@/hooks/use-generations';
import { useRelancerGeneration } from '@/hooks/use-generations';
import { t } from '@/lib/i18n';
import { type GenerationStatut } from '@/lib/api/generations';

function FichierMoteurSection({
  generationId,
  metrics,
}: {
  generationId: string;
  metrics: Record<string, unknown>;
}) {
  return (
    <section>
      <CardHeader>
        <CardTitle>{t('fichierMoteur')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p>{generationId}</p>
        </div>
        <div>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('journalGeneration')}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-muted rounded text-sm text-muted-foreground whitespace-pre-wrap">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </CardContent>
        </div>
      </CardContent>
    </section>
  );
}

interface GenerationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generationId: string;
}

export function GenerationDetailDialog({
  open,
  onOpenChange,
  generationId,
}: GenerationDetailDialogProps) {
const { data: detail, isPending, error } = useGenerationDetail(generationId);
  const relancerMutation = useRelancerGeneration();

  const handleRelancer = () => {
    if (window.confirm(t('relancerConfirmation'))) {
      relancerMutation.mutate(generationId);
    }
  };

  if (!open) return null;

  const g = detail!;
  const canRelancer =
    (g.statut === 'FAILED' || g.statut === 'TIMED_OUT') &&
    !relancerMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t('detailsGeneration')}</DialogTitle>
          <DialogDescription>
            {t('historiqueGenerations')} — {detail?.id ?? generationId}
          </DialogDescription>
        </DialogHeader>

        {isPending && (
          <div className="p-4 text-center text-muted-foreground">
            {t('chargement')}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
            {t('erreurLoadGeneration')}
          </div>
        )}

        {g && !isPending && (
          <div className="space-y-6">
            {/* Statut & infos générales */}
            <Card>
              <CardHeader>
                <CardTitle>{t('parametresGeneration')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">{t('statut')}</label>
                  <GenerationStatusBadge statut={g.statut as GenerationStatut} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('mode')}</label>
                  <Badge variant={g.mode === 'MANUELLE' ? 'secondary' : 'default'}>
                    {g.mode === 'MANUELLE' ? t('modeManuelle') : t('modeAutomatique')}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('dateCreation')}</label>
                  <p>{new Date(g.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('dateFileAttente')}</label>
                  <p>{new Date(g.queuedAt).toLocaleString('fr-FR')}</p>
                </div>
                {g.startedAt && (
                  <div>
                    <label className="text-xs text-muted-foreground">{t('duree')}</label>
                    <p>
                      {g.durationSeconds != null
                        ? `${Math.round(g.durationSeconds / 60)} min`
                        : g.finishedAt
                        ? `${Math.round((new Date(g.finishedAt).getTime() - new Date(g.startedAt).getTime()) / 60000)} min`
                        : '—'}
                    </p>
                  </div>
                )}
                {g.profilGenerationId && (
                  <div>
                    <label className="text-xs text-muted-foreground">{t('profil')}</label>
                    <p>{g.profilGenerationId}</p>
                  </div>
                )}
                {g.perimetreHash && (
                  <div>
                    <label className="text-xs text-muted-foreground">{t('empreintePerimetre')}</label>
                    <p className="font-mono text-xs break-all">{g.perimetreHash}</p>
                  </div>
                )}
                {g.metrics && 'graines' in g.metrics && Array.isArray(g.metrics.graines) && (
                  <div>
                    <label className="text-xs text-muted-foreground">{t('graines')}</label>
                    <p className="font-mono text-xs">
                      {g.metrics.graines.join(', ')}
                    </p>
                  </div>
                )}
                {g.engineVersion && (
                  <div>
                    <label className="text-xs text-muted-foreground">{t('versionFET')}</label>
                    <p>{g.engineVersion}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            
            {/* Fichier moteur */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(<FichierMoteurSection generationId={g.id} metrics={g.metrics ?? {}} />) as any}

            {(Boolean(g.metrics) || Boolean(g.score)) ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t('resultatsGeneration')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {g.classee !== undefined && (
                    <div>
                      <label className="text-xs text-muted-foreground">{t('scoreGlobal')}</label>
                      <p>
                        {g.classee && typeof g.score === 'number'
                          ? `${g.score.toFixed(1)} / 100`
                          : g.classee
                          ? '— / 100'
                          : t('nonClassee')}
                      </p>
                    </div>
                  )}
                  {g.classement !== undefined && g.classee && (
                    <div>
                      <label className="text-xs text-muted-foreground">{t('classement')}</label>
                      <p>#{g.classement}</p>
                    </div>
                  )}
                  {g.metrics ? (
                    <div>
                      <label className="text-xs text-muted-foreground">{t('metriques')}</label>
                      <pre className="p-3 bg-muted rounded text-xs text-muted-foreground whitespace-pre-wrap">
                        {JSON.stringify(g.metrics, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {/* Conflits (si présents dans metrics) */}
            {g.metrics != null && 'conflits' in g.metrics && g.metrics.conflits && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('conflitsGeneration')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-3 bg-muted rounded text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(g.metrics.conflits, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('annuler')}
              </Button>
              {canRelancer && (
                <Button
                  onClick={handleRelancer}
                  disabled={relancerMutation.isPending}
                >
                  {relancerMutation.isPending ? 'Relance…' : t('btnRelancer')}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}