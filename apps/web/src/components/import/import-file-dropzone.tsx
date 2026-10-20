// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Zone de dépôt de fichier d'import (L1-27)
'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { messages } from '@/lib/messages/fr';

export type ImportFileDropzoneProps = {
  onFileChange: (file: File | null) => void;
  file: File | null;
  disabled?: boolean;
};

const ACCEPT = '.csv,.xlsx,.xls';

export function ImportFileDropzone({
  onFileChange,
  file,
  disabled = false,
}: ImportFileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      preventDefaults(e);
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) onFileChange(f);
    },
    [onFileChange],
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFileChange(e.target.files?.[0] ?? null);
    },
    [onFileChange],
  );

  const removeFile = useCallback(() => onFileChange(null), [onFileChange]);

  const isValidType = (f: File) =>
    f.name.toLowerCase().endsWith('.csv') ||
    f.name.toLowerCase().endsWith('.xlsx') ||
    f.name.toLowerCase().endsWith('.xls');

  const onChooseFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <section className="space-y-3">
      <Label className="text-sm font-medium">{messages.labelImportFichierFichier}</Label>
      <div
        onDragEnter={(e) => { preventDefaults(e); setDragActive(true); }}
        onDragLeave={(e) => { preventDefaults(e); setDragActive(false); }}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragActive ? 'bg-primary/5 border-primary' : 'bg-muted/50 border-border hover:border-primary/50'}
          ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <p className="mb-2">
          {file ? (
            <>
              <FileText className="mx-auto h-6 w-6 text-muted-foreground" />{' '}
              {file.name} ({(file.size / 1024).toFixed(1)} Ko)
              <Button
                variant="destructive"
                size="xs"
                onClick={removeFile}
                className="ml-2 shrink-0"
                aria-label={messages.btnAnnuler}
              />
            </>
          ) : (
            <>
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />{' '}
              {messages.importFichierDepot}
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {messages.labelImportFichierTailleMax}
        </p>
        <p className="text-xs text-muted-foreground">
          {messages.labelImportFichierFormats} ({ACCEPT}).
        </p>
        <input
          ref={fileInputRef}
          id="import-file-input"
          type="file"
          accept={ACCEPT}
          disabled={disabled || !!file}
          onChange={onFileInput}
          className="sr-only"
        />
        {!file && !disabled && (
          <Button variant="outline" size="sm" onClick={onChooseFile}>
            {messages.btnImportFichierParcourir}
          </Button>
        )}
      </div>
      {!file && !disabled && !dragActive && (
        <p className="text-xs text-muted-foreground">
          {messages.importFichierDepotHint}
        </p>
      )}
    </section>
  );
}
