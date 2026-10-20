// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page d'import depuis une année clôturée (L1-24)
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useImportPreview, useImportConfirm } from '@/hooks/use-imports';
import { findAnneeById, findAllAnnees, Annee } from '@/lib/api/annees';
import { ImportType, ImportPreviewDto } from '@/lib/api/imports';
import { messages } from '@/lib/messages/fr';

const IMPORT_TYPES: { value: ImportType; label: string }[] = [
  { value: 'departements', label: messages.labelImportTypeDepartements },
  { value: 'formations', label: messages.labelImportTypeFormations },
  { value: 'niveaux', label: messages.labelImportTypeNiveaux },
  { value: 'groupes', label: messages.labelImportTypeGroupes },
  { value: 'modules', label: messages.labelImportTypeModules },
  { value: 'salles', label: messages.labelImportTypeSalles },
  { value: 'enseignants', label: messages.labelImportTypeEnseignants },
  { value: 'creneaux', label: messages.labelImportTypeCreneaux },
  { value: 'grilleRamadan', label: messages.labelImportTypeGrilleRamadan },
];

export default function ImportPage() {
  const params = useParams();
  const router = useRouter();
  const sourceAnneeId = params.id as string;

  const [sourceAnnee, setSourceAnnee] = useState<Annee | null>(null);
  const [targetAnnees, setTargetAnnees] = useState<Annee[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ImportType[]>([
    'departements',
    'formations',
    'niveaux',
    'groupes',
  ]);
  const [cibleAnneeId, setCibleAnneeId] = useState<string>('');
  const [reinitialiserEffectifs, setReinitialiserEffectifs] = useState(false);
  const [preview, setPreview] = useState<{ data: ImportPreviewDto } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const previewMutation = useImportPreview();
  const confirmMutation = useImportConfirm();

  const isLoadingSource = !sourceAnnee;
  const hasPreview = preview?.data !== undefined;
  const hasConflits = hasPreview && preview.data.conflits.length > 0;

  const generatePreview = async () => {
    if (!cibleAnneeId || selectedTypes.length === 0) return;
    try {
      const result = await previewMutation.mutateAsync({
        sourceAnneeId,
        input: {
          cibleAnneeId,
          types: selectedTypes,
          dryRun: true,
          reinitialiserEffectifs,
        },
      });
      setPreview({ data: result });
    } catch {
      // error handled by hook toast
    }
  };

  const applyImport = async () => {
    if (!preview?.data) return;
    setConfirmLoading(true);
    try {
      await confirmMutation.mutateAsync({
        sourceAnneeId,
        input: {
          cibleAnneeId,
          types: selectedTypes,
          confirmation: true,
          importId: preview.data.importId,
          reinitialiserEffectifs,
        },
      });
      router.push(`/annees/${sourceAnneeId}`);
    } catch {
      // error handled by hook toast
    } finally {
      setConfirmLoading(false);
    }
  };

  // Charger l'année source et la liste des années cibles
  if (!sourceAnnee) {
    (async () => {
      try {
        const [source, all] = await Promise.all([
          findAnneeById(sourceAnneeId),
          findAllAnnees({ limit: 100 }),
        ]);
        setSourceAnnee(source);
        setTargetAnnees(all.data.filter((a) => a.id !== sourceAnneeId));
      } catch {
        // handle error
      }
    })();
  }

  if (isLoadingSource) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
              d="M4 4h5.011M11 4v5.011M4 12h5.011M11 12v5.011"
            />
          </svg>
          {messages.loading}
        </div>
      </div>
    );
  }

  if (!sourceAnnee) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">{messages.error}</h1>
        <p>Année source introuvable.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <nav className="flex items-center gap-2 mb-6">
        <a
          href={`/annees/${sourceAnneeId}`}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Retour &agrave; l&rsquo;ann&eacute;e
        </a>
      </nav>

      <h1 className="text-2xl font-bold mb-2">{messages.labelImportTitre}</h1>
      <p className="text-muted-foreground mb-6">
        Source: <strong>{sourceAnnee.code}</strong> ({sourceAnnee.statut})
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          generatePreview();
        }}
        className="space-y-4 bg-card p-4 rounded-lg border border-border"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{messages.labelImportCible}</label>
            <select
              value={cibleAnneeId}
              onChange={(e) => setCibleAnneeId(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-background"
              disabled={confirmLoading}
            >
              <option value="">Sélectionner une année cible</option>
              {targetAnnees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} ({a.statut})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{messages.labelImportTypes}</label>
            <div className="flex flex-wrap gap-2">
              {IMPORT_TYPES.map((t) => (
                <label key={t.value} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(t.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTypes([...selectedTypes, t.value]);
                      } else {
                        setSelectedTypes(selectedTypes.filter((x) => x !== t.value));
                      }
                    }}
                    className="rounded border bg-background"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            checked={reinitialiserEffectifs}
            onChange={(e) => setReinitialiserEffectifs(e.target.checked)}
            className="rounded border bg-background"
          />
          <label className="text-sm">{messages.labelImportReinitialiserEffectifs}</label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => router.push(`/annees/${sourceAnneeId}`)}
            disabled={confirmLoading}
            className="px-4 py-2 border rounded hover:bg-muted"
          >
            {messages.btnAnnuler}
          </button>
          <button
            type="submit"
            disabled={!cibleAnneeId || selectedTypes.length === 0 || confirmLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {previewMutation.isPending ? 'Génération…' : messages.btnImportApercu}
          </button>
        </div>
      </form>

      {hasPreview && (
        <section className="mt-6 bg-card p-4 rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-4">{messages.importApercuTitre}</h2>

          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              {preview.data.sourceAnneeCode} → {preview.data.cibleAnneeCode}
            </div>
            <div className="flex gap-2 text-sm">
              <span className="badge bg-blue-100 text-blue-800">
                {messages.importResumeAjout}: {preview.data.resume.ajout}
              </span>
              <span className="badge bg-gray-100 text-gray-800">
                {messages.importResumeDoublon}: {preview.data.resume.doublon}
              </span>
              {preview.data.resume.conflit > 0 && (
                <span className="badge bg-red-100 text-red-800">
                  {messages.importResumeConflit}: {preview.data.resume.conflit}
                </span>
              )}
              {preview.data.resume.erreur > 0 && (
                <span className="badge bg-orange-100 text-orange-800">
                  {messages.importResumeErreur}: {preview.data.resume.erreur}
                </span>
              )}
            </div>
          </div>

          {hasConflits && (
            <div className="bg-red-50 p-3 rounded mb-4 border border-red-100">
              <p className="text-sm text-red-800 font-medium">
                {messages.importConflitsDetectes}
              </p>
            </div>
          )}

          {!hasConflits && preview.data.conflits.length === 0 && (
            <p className="text-sm text-green-700 mb-4">
              {messages.importAucunConflit}
            </p>
          )}

          <table className="w-full text-left border-collapse mb-4">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th className="pb-2 font-medium">{messages.importColType}</th>
                <th className="pb-2 font-medium">{messages.importColCode}</th>
                <th className="pb-2 font-medium">{messages.importColAction}</th>
                <th className="pb-2 font-medium w-1/3">{messages.importColMessage}</th>
              </tr>
            </thead>
            <tbody>
              {preview.data.items.map((item, idx) => (
                <tr key={idx} className="border-b text-sm">
                  <td className="py-2">{item.type}</td>
                  <td className="py-2 font-mono">{item.sourceCode}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        item.action === 'ajout'
                          ? 'bg-green-100 text-green-700'
                          : item.action === 'doublon'
                            ? 'bg-gray-100 text-gray-700'
                            : item.action === 'conflit'
                              ? 'bg-red-100 text-red-700'
                              : item.action === 'erreur'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {item.action === 'ajout'
                        ? messages.importActionAjout
                        : item.action === 'modification'
                          ? messages.importActionModification
                          : item.action === 'doublon'
                            ? messages.importActionDoublon
                            : item.action === 'conflit'
                              ? messages.importActionConflit
                              : messages.importActionErreur}
                    </span>
                  </td>
                  <td className="py-2">{item.message}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {preview.data.avertissements.length > 0 && (
            <div className="bg-amber-50 p-3 rounded mb-4 border border-amber-100">
              {preview.data.avertissements.map((a: string, i: number) => (
                <p key={i} className="text-sm text-amber-700">
                  • {a}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 border rounded hover:bg-muted"
            >
              {messages.btnNouveauApercu}
            </button>
            {!hasConflits && (
              <button
                onClick={applyImport}
                disabled={confirmLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
              >
                {confirmLoading ? messages.btnApplicationEnCours : messages.btnConfirmer}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
