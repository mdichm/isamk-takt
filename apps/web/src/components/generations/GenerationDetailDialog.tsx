'use client';

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
import { GenerationEngineFile } from './GenerationEngineFile';
import { useGenerationDetail } from '@/hooks/use-generations';
import { useRelancerGeneration } from '@/hooks/use-generations';
import { t } from '@/lib/i18n';
import { type GenerationStatut } from '@/lib/api/generations';

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

  const canRelancer =
    detail &&
    (detail.statut === 'FAILED' || detail.statut === 'TIMED_OUT') &&
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

        {detail && !isPending && (
          <div className="space-y-6">
            {/* Statut & infos générales */}
            <Card>
              <CardHeader>
                <CardTitle>{t('parametresGeneration')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">{t('statut')}</label>
                  <GenerationStatusBadge statut={detail.statut as GenerationStatut} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('mode')}</label>
                  <Badge variant={detail.mode === 'MANUELLE' ? 'secondary' : 'default'}>
                    {detail.mode === 'MANUELLE' ? t('modeManuelle') : t('modeAutomatique')}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('dateCreation')}</label>
                  <p>{new Date(detail.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t('dateFileAttente')}</label>
                  <p>{new Date(detail.queuedAt).toLocaleString('fr-FR')}</p>
                </div>
                {detail.startedAt && (
                  <div>
                    <label className="text-xs text-muted-foreground">{t('duree')}</label>
                    <p>
                      {detail.durationSeconds != null
                        ? `${Math.round(detail.durationSeconds / 60)} min`
                        : detail.finishedAt
                        ? `${Math.round((new Date(detail.finishedAt).getTime() - new Date(detail.startedAt).getTime()) / 60000)} min`
                        : '—'}
                    </p>
                  </div>
                )}
                {detail.profilGenerationId && (
                  <div>
                    <label className="text-xs text-muted-foreground">{t('profil')}</label>
                    <p>{detail.profilGenerationId}</p>
                  </div>
                )}
                {detail.perimetreHash && (
                  <div>
                    <label className="text-xs text-muted-foreground">{t('empreintePerimetre')}</label>
                    <p className="font-mono text-xs break-all">{detail.perimetreHash}</p>
                  </div>
                )}
                {detail.metrics && 'graines' in detail.metrics && Array.isArray(detail.metrics.graines) && (
                  <div>
                    <label className="text-xs text-muted-foreground">{t('graines')}</label>
                    <p className="font-mono text-xs">
                      {detail.metrics.graines.join(', ')}
                    </p>
                  </div>
                )}
                {detail.engineVersion && (
                  <div>
                    <label className="text-xs text-muted-foreground">{t('versionFET')}</label>
                    <p>{detail.engineVersion}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fichier moteur */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fichierMoteur')}</CardTitle>
              </CardHeader>
              <CardContent>
                <GenerationEngineFile generationId={detail.id} />
              </CardContent>
            </Card>

            {detail.erreur && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">{t('messageErreur')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-3 bg-destructive/5 rounded text-sm text-destructive whitespace-pre-wrap">
                    {detail.erreur}
                  </pre>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>{t('journalGeneration')}</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.metrics ? (
                  <pre className="p-3 bg-muted rounded text-sm text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(detail.metrics as unknown, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('sansLogs')}</p>
                )}
              </CardContent>
            </Card>

            {(detail.metrics || detail.score != null) && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('resultatsGeneration')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {detail.classee !== undefined && (
                    <div>
                      <label className="text-xs text-muted-foreground">{t('scoreGlobal')}</label>
                      <p>
                        {detail.classee && typeof detail.score === 'number'
                          ? `${detail.score.toFixed(1)} / 100`
                          : detail.classee
                          ? '— / 100'
                          : t('nonClassee')}
                      </p>
                    </div>
                  )}
                  {detail.classement !== undefined && detail.classee && (
                    <div>
                      <label className="text-xs text-muted-foreground">{t('classement')}</label>
                      <p>#{detail.classement}</p>
                    </div>
                  )}
                  {detail.metrics && (
                    <div>
                      <label className="text-xs text-muted-foreground">{t('metriques')}</label>
                      <pre className="p-3 bg-muted rounded text-xs text-muted-foreground whitespace-pre-wrap">
                        {JSON.stringify(detail.metrics as unknown, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Conflits (si présents dans metrics) */}
            {detail.metrics && 'conflits' in detail.metrics && detail.metrics.conflits && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('conflitsGeneration')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-3 bg-muted rounded text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(detail.metrics.conflits, null, 2)}
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