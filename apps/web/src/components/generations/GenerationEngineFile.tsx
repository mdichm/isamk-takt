'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getEngineFileUrl,
  type EngineFileResponse,
  type GenerationMode,
} from '@/lib/api/generations';
import { t } from '@/lib/i18n';

interface GenerationEngineFileProps {
  generationId: string;
  mode?: GenerationMode;
  onReady?: (sha256: string, engineVersion: string) => void;
}

export function GenerationEngineFile({ generationId, mode, onReady }: GenerationEngineFileProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [engineInfo, setEngineInfo] = useState<EngineFileResponse | null>(null);

  const handleDownload = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const data: EngineFileResponse = await getEngineFileUrl(generationId);
      setDownloadUrl(data.downloadUrl);
      setEngineInfo(data);
      if (onReady) {
        onReady(data.sha256, data.engineVersion);
      }
    } catch {
      setError(t('erreurGeneration'));
    } finally {
      setIsFetching(false);
    }
  };

  // Call onReady when engine info is available
  useEffect(() => {
    if (engineInfo && onReady) {
      onReady(engineInfo.sha256, engineInfo.engineVersion);
    }
  }, [engineInfo, onReady]);

  if (!downloadUrl && !error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('fichierMoteur')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownload} disabled={isFetching}>
            {isFetching ? 'Préparation…' : t('telechargerFichierMoteur')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('fichierMoteur')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
          <Button onClick={handleDownload} disabled={isFetching}>
            {t('recharger')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('fichierMoteur')}</CardTitle>
      </CardHeader>
      <CardContent>
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            {t('telechargerFichierMoteur')}
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
