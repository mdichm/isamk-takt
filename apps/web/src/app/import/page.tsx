// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page d'import de fichier CSV/XLSX (L1-27)
// Dépôt de fichier, rapport de simulation ligne par ligne, impacts, confirmation.
'use client';

import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import {
  useImportFichierConfirm,
  useImportFichierPreview,
} from '@/hooks/use-import-fichier';
import { IMPORT_ENTITIES, ImportEntity, ImportPreviewDto } from '@/lib/api/import-fichier';
import { ImportFileDropzone } from '@/components/import/import-file-dropzone';
import { ImportReportTable } from '@/components/import/import-report-table';
import { ImportResume } from '@/components/import/import-resume';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { messages } from '@/lib/messages/fr';

export default function ImportPage() {
  const [entite, setEntite] = useState<ImportEntity>('enseignants');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewDto | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const previewMutation = useImportFichierPreview();
  const confirmMutation = useImportFichierConfirm();

  const hasPreview = preview !== null;
  const hasBloquants =
    hasPreview && (preview.resume.conflit > 0 || preview.resume.erreur > 0);
  const canConfirm = hasPreview && !hasBloquants;

  const entiteConfig = IMPORT_ENTITIES.find((e) => e.value === entite);
  const entiteLabel = entiteConfig ? messages[entiteConfig.labelKey] : '';

  const generatePreview = useCallback(async () => {
    if (!file) return;
    setPreview(null);
    try {
      const result = await previewMutation.mutateAsync({
        entite,
        file,
        importId: undefined,
      });
      setPreview(result);
    } catch {
      // Toast géré par le hook.
    }
  }, [entite, file, previewMutation]);

  const applyImport = useCallback(async () => {
    if (!preview || !file) return;
    setConfirmLoading(true);
    try {
      await confirmMutation.mutateAsync({
        entite,
        file,
        importId: preview.importId,
      });
      setFile(null);
      setPreview(null);
    } catch {
      // Toast géré par le hook.
    } finally {
      setConfirmLoading(false);
    }
  }, [preview, file, entite, confirmMutation]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Upload className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">{messages.labelImportFichierTitre}</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{messages.labelImportFichierTitre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.labelImportFichierEntite}</Label>
              <Select value={entite} onValueChange={(value) => setEntite(value as ImportEntity)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPORT_ENTITIES.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {messages[e.labelKey]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ImportFileDropzone file={file} onFileChange={setFile} />
          </div>
          <Button
            onClick={generatePreview}
            disabled={!file || previewMutation.isPending}
          >
            {messages.btnImportFichierApercu}
          </Button>
        </CardContent>
      </Card>

      {hasPreview && (
        <Card>
          <CardHeader>
            <CardTitle>{messages.importApercuTitre}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">
                  {messages.labelImportFichierEntite}
                </span>
                <span className="font-medium">{entiteLabel}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">
                  {messages.importTotalLignes}
                </span>
                <span className="font-mono font-semibold">{preview.totalLignes}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">
                  {messages.importResumeTitre}
                </span>
                <span className="font-mono font-semibold">{preview.resume.ajout + preview.resume.modification + preview.resume.doublon + preview.resume.conflit + preview.resume.erreur}</span>
              </div>
            </div>
            <ImportReportTable items={preview.items} />
            <ImportResume
              preview={preview}
              onConfirm={applyImport}
              onNewPreview={() => setPreview(null)}
              confirmLoading={confirmLoading}
              canConfirm={canConfirm}
            />
          </CardContent>
        </Card>
      )}
      <Separator />
      <p className="text-xs text-muted-foreground mt-4">
        {messages.importAidePiedDePage}
      </p>
    </div>
  );
}
