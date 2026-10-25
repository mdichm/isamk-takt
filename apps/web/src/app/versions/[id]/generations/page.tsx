'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  GenerationLaunchForm,
  GenerationSseTracker,
  GenerationEngineFile,
  ManualGenerationImportDialog,
  GenerationHistoryList,
  GenerationComparison,
} from '@/components/generations';
import { messages } from '@/lib/messages/fr';
import { t } from '@/lib/i18n';
import {
  findVersionById,
  type Version,
} from '@/lib/api/versions';
import {
  getPerimetre,
  findFetMappingReport,
  type PerimetreResponse,
  type FetMappingReport,
  type GenerationMode,
} from '@/lib/api/generations';
import { useGenerationsByVersion } from '@/hooks/use-generations';

export default function GenerationsPage() {
  const params = useParams();
  const versionId = params?.id as string | undefined;

  const [version, setVersion] = useState<Version | null>(null);
  const [versionLoading, setVersionLoading] = useState(true);
  const [versionError, setVersionError] = useState<string | null>(null);

  const [perimetre, setPerimetre] = useState<PerimetreResponse | null>(null);
  const [perimetreLoading, setPerimetreLoading] = useState(true);
  const [perimetreError, setPerimetreError] = useState<string | null>(null);

  const [fetMapping, setFetMapping] = useState<FetMappingReport | null>(null);
  const [fetMappingLoading, setFetMappingLoading] = useState(true);
  const [fetMappingError, setFetMappingError] = useState<string | null>(null);

  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(
    null,
  );
  const [generationComplete, setGenerationComplete] = useState(false);

  // Import manuel state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [engineSha256, setEngineSha256] = useState<string | null>(null);
  const [engineVersion, setEngineVersion] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode | null>(null);

  // Historique et comparaison (L4-21)
  const { data: generations, isPending: generationsLoading } =
    useGenerationsByVersion(versionId);

  // Charger la version pour récupérer le semestreId
  useEffect(() => {
    let cancelled = false;
    const loadVersion = async () => {
      if (!versionId) {
        setVersionLoading(false);
        return;
      }
      setVersionLoading(true);
      try {
        const v = await findVersionById(versionId);
        if (!cancelled) {
          setVersion(v);
          setVersionLoading(false);
        }
      } catch {
        if (!cancelled) {
          setVersionError('Impossible de charger la version.');
          setVersionLoading(false);
        }
      }
    };
    loadVersion();
    return () => {
      cancelled = true;
    };
  }, [versionId]);

  const semestreId = version?.semestreId;

  // Charger le périmètre figé et le rapport de traduction FET
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (!versionId) {
        setPerimetreLoading(false);
        setFetMappingLoading(false);
        return;
      }
      setPerimetreLoading(true);
      setFetMappingLoading(true);
      try {
        const [p, f] = await Promise.all([
          getPerimetre(versionId),
          semestreId ? findFetMappingReport(semestreId) : null,
        ]);
        if (!cancelled) {
          setPerimetre(p);
          setPerimetreLoading(false);
          setFetMapping(f ?? null);
          setFetMappingLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPerimetreError('Impossible de charger le périmètre.');
          setPerimetreLoading(false);
          setFetMappingError('Impossible de charger le rapport de traduction.');
          setFetMappingLoading(false);
        }
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [versionId, semestreId]);

  const handleEngineFileReady = (sha256: string, engVersion: string) => {
    setEngineSha256(sha256);
    setEngineVersion(engVersion);
  };

  const handleImportSuccess = (generationId: string) => {
    setCurrentGenerationId(generationId);
    setGenerationMode('MANUELLE');
    setGenerationComplete(false);
  };

  if (versionError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{t('error')}</h1>
        <p className="mt-2 text-muted-foreground">{versionError}</p>
      </div>
    );
  }

  if (versionLoading || !semestreId || !versionId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{t('generation')}</h1>
        <p className="text-muted-foreground">{messages.loading}</p>
      </div>
    );
  }

  if (perimetreError || fetMappingError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{t('error')}</h1>
        <p className="mt-2 text-muted-foreground">
          {perimetreError || fetMappingError}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('generation')}</h1>
          <p className="text-muted-foreground">
            {t('perimetreFige')} — {perimetre?.annee} S{perimetre?.semestreNumero}
          </p>
        </div>
        {currentGenerationId === null && (
          <Button
            onClick={() => setGenerationComplete(false)}
            disabled={perimetreLoading || fetMappingLoading}
          >
            {t('genererUneNouvelle')}
          </Button>
        )}
      </div>

      {/* Formulaire de lancement */}
      {currentGenerationId === null && perimetre && fetMapping !== null && (
        <GenerationLaunchForm
          versionId={versionId}
          perimetre={perimetre}
          fetMapping={fetMapping}
          onGenerationLaunched={(generation) => {
            setCurrentGenerationId(generation.id);
            setGenerationMode(generation.mode);
            setGenerationComplete(false);
          }}
        />
      )}

      {/* Suivi SSE + résultat */}
      {currentGenerationId !== null && (
        <div className="mt-6">
          <GenerationSseTracker
            generationId={currentGenerationId}
            onGenerationComplete={() => {
              setGenerationComplete(true);
            }}
          />
          {generationComplete && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <GenerationEngineFile
                  generationId={currentGenerationId}
                  mode={generationMode ?? undefined}
                  onReady={handleEngineFileReady}
                />
                {generationMode && (
                  <Badge variant={generationMode === 'MANUELLE' ? 'secondary' : 'default'}>
                    {generationMode === 'MANUELLE' ? t('modeManuel') : t('modeAutomatique')}
                  </Badge>
                )}
              </div>
              {engineSha256 && engineVersion && generationMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportDialog(true)}
                  className="mt-2"
                >
                  {t('importerResultatManuel')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {/* Dialog import manuel */}
      <ManualGenerationImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        versionId={versionId}
        expectedSha256={engineSha256!}
        engineVersion={engineVersion!}
        onSuccess={handleImportSuccess}
      />

      {/* Historique et comparaison des générations */}
      {generations && (
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>{t('historiqueGenerations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <GenerationHistoryList generations={generations} />
            </CardContent>
          </Card>
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>{t('comparaison')}</CardTitle>
            </CardHeader>
            <CardContent>
              <GenerationComparison generations={generations} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
