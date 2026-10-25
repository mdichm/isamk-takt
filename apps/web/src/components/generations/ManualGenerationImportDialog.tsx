'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { importManualGeneration } from '@/lib/api/generations';
import { useToast } from '@/components/ui/use-toast';

interface ManualGenerationImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionId: string;
  expectedSha256: string;
  engineVersion: string;
  onSuccess: (generationId: string) => void;
}

export function ManualGenerationImportDialog({
  open,
  onOpenChange,
  versionId,
  expectedSha256,
  engineVersion,
  onSuccess,
}: ManualGenerationImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [calculatedSha256, setCalculatedSha256] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateSha256 = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  const handleFileChange = async (file: File) => {
    if (!file.name.endsWith('.fet')) {
      setError(t('erreurFichierRequis'));
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
    setIsCalculating(true);
    try {
      const sha256 = await calculateSha256(file);
      setCalculatedSha256(sha256);
    } catch {
      setError(t('erreurGeneration'));
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError(t('erreurFichierRequis'));
      return;
    }
    if (calculatedSha256 !== expectedSha256) {
      setError(t('erreurEmpreinteInvalide'));
      return;
    }
    setIsImporting(true);
    setError(null);
    try {
      const result = await importManualGeneration(versionId, selectedFile, expectedSha256);
      toast({ description: t('importReussi') });
      onSuccess(result.generationId);
      onOpenChange(false);
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { code?: string; message?: string } } };
      if (errorData.response?.data?.code === 'ENGINE_FILE_MISMATCH') {
        setError(t('erreurEmpreinteInvalide'));
      } else if (errorData.response?.data?.message) {
        setError(errorData.response.data.message);
      } else {
        setError(t('importEchec'));
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setCalculatedSha256(null);
    setError(null);
    onOpenChange(false);
  };

  const shaMatches = calculatedSha256 === expectedSha256 && calculatedSha256 !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('importerResultatManuel')}</DialogTitle>
          <DialogDescription>
            Importez le fichier r&eacute;sultat d&rsquo;une ex&eacute;cution manuelle de FET (.fet).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Empreinte attendue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('fichierMoteurSha256')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm break-all bg-muted p-2 rounded">{expectedSha256}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('versionMoteur')}: {engineVersion}</div>
            </CardContent>
          </Card>

          {/* Dropzone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              selectedFile ? 'border-primary' : 'border-border'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Input
              type="file"
              accept=".fet"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="sr-only"
              id="fet-file-input"
              disabled={isImporting}
            />
            <label htmlFor="fet-file-input" className="cursor-pointer">
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="font-medium">{selectedFile.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(selectedFile.size / 1024)} KB
                  </div>
                  {isCalculating ? (
                    <div className="text-sm text-blue-600">Calcul de l&rsquo;empreinte&hellip;</div>
                  ) : calculatedSha256 ? (
                    <div className={`text-sm ${shaMatches ? 'text-green-600' : 'text-red-600'}`}>
                      {shaMatches ? t('empreinteCorrespond') : t('empreinteNonCorrespond')}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div>
                  <div className="text-muted-foreground">{t('dropzoneText')}</div>
                  <Button type="button" variant="outline" className="mt-2">
                    {t('selectionnerFichierResultat')}
                  </Button>
                </div>
              )}
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {selectedFile && calculatedSha256 && !shaMatches && (
            <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
              {t('empreinteNonCorrespond')} — {t('fichierMoteurSha256')} attendue: <code className="font-mono ml-1">{expectedSha256}</code>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isImporting}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={isImporting || !selectedFile || !shaMatches}
          >
            {isImporting ? t('importEnCours') : t('importer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}