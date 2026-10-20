// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Hook React Query pour l'import de fichier CSV/XLSX (L1-27)
'use client';

import { useMutation } from '@tanstack/react-query';
import {
  importFichierConfirm,
  importFichierPreview,
  ImportEntity,
  ImportPreviewDto,
  ImportResultDto,
} from '@/lib/api/import-fichier';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

const IMPORT_FICHIER_KEY = ['import-fichier'];

export function useImportFichierPreview() {
  return useMutation<ImportPreviewDto, Error, { entite: ImportEntity; file: File; importId?: string }>({
    mutationKey: [...IMPORT_FICHIER_KEY, 'preview'],
    mutationFn: ({ entite, file, importId }) =>
      importFichierPreview(entite, file, { importId }),
    onError: () => {
      toast.error(messages.errorImportFichierPreview);
    },
  });
}

export function useImportFichierConfirm() {
  return useMutation<ImportResultDto, Error, { entite: ImportEntity; file: File; importId: string }>({
    mutationKey: [...IMPORT_FICHIER_KEY, 'confirm'],
    mutationFn: ({ entite, file, importId }) =>
      importFichierConfirm(entite, file, importId),
    onSuccess: () => {
      toast.success(messages.successImportFichierApplied);
    },
    onError: () => {
      toast.error(messages.errorImportFichierApply);
    },
  });
}
