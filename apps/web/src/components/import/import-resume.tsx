// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Résumé et impacts d'import avec bouton de confirmation (L1-27)
'use client';

import { ImportPreviewDto } from '@/lib/api/import-fichier';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';

export type ImportResumeProps = {
  preview: ImportPreviewDto;
  onConfirm: () => void;
  onNewPreview: () => void;
  confirmLoading: boolean;
  canConfirm: boolean;
};

export function ImportResume({
  preview,
  onConfirm,
  onNewPreview,
  confirmLoading,
  canConfirm,
}: ImportResumeProps) {
  const { resume, impacts } = preview;
  const hasBloquants = resume.conflit > 0 || resume.erreur > 0;

  return (
    <section className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">{messages.importResumeTitre}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs">{messages.importResumeAjout}</span>
            <span className="font-mono font-semibold text-green-700">{resume.ajout}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">{messages.importResumeModification}</span>
            <span className="font-mono font-semibold text-blue-700">{resume.modification}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">{messages.importResumeDoublon}</span>
            <span className="font-mono font-semibold text-gray-700">{resume.doublon}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">{messages.importResumeConflit}</span>
            <span className={`font-mono font-semibold ${resume.conflit > 0 ? 'text-red-700' : 'text-gray-700'}`}>
              {resume.conflit}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">{messages.importResumeErreur}</span>
            <span className={`font-mono font-semibold ${resume.erreur > 0 ? 'text-red-700' : 'text-gray-700'}`}>
              {resume.erreur}
            </span>
          </div>
        </div>
      </div>

      {impacts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{messages.importImpactsTitre}</h3>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2 font-medium">{messages.importImpactEntite}</th>
                <th className="pb-2 font-medium">{messages.importImpactCode}</th>
                <th className="pb-2 font-medium">{messages.importImpactUtiliseDans}</th>
              </tr>
            </thead>
            <tbody>
              {impacts.map((impact, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{impact.entite}</td>
                  <td className="py-2 font-mono">{impact.code}</td>
                  <td className="py-2">
                    {impact.utiliseDans.length > 0 ? (
                      impact.utiliseDans.join(', ')
                    ) : (
                      <span className="text-muted-foreground">{messages.importAucuneValeur}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-amber-700">{messages.importImpactsAvertissement}</p>
        </div>
      )}

      {hasBloquants && (
        <div className="bg-red-50 p-3 rounded border border-red-100">
          <p className="text-sm text-red-700">{messages.importConflitsBloquants}</p>
        </div>
      )}

      {!hasBloquants && (
        <p className="text-sm text-green-700">{messages.importAucuneErreur}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button onClick={onNewPreview} variant="outline">
          {messages.btnNouveauApercu}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!canConfirm || confirmLoading}
        >
          {confirmLoading ? messages.btnApplicationEnCours : messages.btnConfirmer}
        </Button>
      </div>
    </section>
  );
}
