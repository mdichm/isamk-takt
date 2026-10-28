'use client';

// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page d'export des charges et plannings (L6-09)
// Route : /exports — accessible à ADMINISTRATEUR, GESTIONNAIRE, RESPONSABLE_DEPARTEMENT, DIRECTION

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/components/shell/AuthProvider';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  createExportJob,
  fetchExportViews,
  fetchExportStyles,
  fetchExportJobs,
  fetchExportJobById,
  fetchExportDownloadUrl,
  type ExportJob,
  type ExportView,
  type ExportStyle,
  type CreateExportJobInput,
} from '@/lib/api/exports';

type Role =
  | 'ADMINISTRATEUR'
  | 'GESTIONNAIRE'
  | 'RESPONSABLE_DEPARTEMENT'
  | 'DIRECTION'
  | 'ENSEIGNANT'
  | 'ETUDIANT';

type Version = {
  id: string;
  numero: string;
  statut: string;
};

const FORMATS: { value: 'PDF' | 'XLSX' | 'CSV'; label: string }[] = [
  { value: 'PDF', label: t('exportFormatPDF') },
  { value: 'XLSX', label: t('exportFormatXLSX') },
  { value: 'CSV', label: t('exportFormatCSV') },
];

const MODES: { value: 'BROUILLON' | 'OFFICIEL'; label: string }[] = [
  { value: 'BROUILLON', label: t('exportModeBrouillon') },
  { value: 'OFFICIEL', label: t('exportModeOfficiel') },
];

const GRILLES: { value: 'NORMALE' | 'RAMADAN'; label: string }[] = [
  { value: 'NORMALE', label: t('exportGrilleNormale') },
  { value: 'RAMADAN', label: t('exportGrilleRamadan') },
];

const STATUT_BADGE: Record<string, string> = {
  QUEUED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  RUNNING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const STATUT_LABEL: Record<string, string> = {
  QUEUED: t('statutQUEUED'),
  RUNNING: t('statutRUNNING'),
  DONE: t('statutDONE'),
  FAILED: t('statutFAILED'),
};

const createExportSchema = z.object({
  versionId: z.string().min(1, { message: t('error') }),
  styleId: z.string().optional(),
  viewId: z.string().optional(),
  format: z.enum(['PDF', 'XLSX', 'CSV']),
  mode: z.enum(['BROUILLON', 'OFFICIEL']),
  grille: z.enum(['NORMALE', 'RAMADAN']).optional(),
  departementId: z.string().optional(),
});

type FormData = z.infer<typeof createExportSchema>;

export default function ExportsPage() {
  const { role, departments } = useAuth();

  const [versions, setVersions] = useState<Version[]>([]);
  const [views, setViews] = useState<ExportView[]>([]);
  const [styles, setStyles] = useState<ExportStyle[]>([]);
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(createExportSchema),
    defaultValues: {
      versionId: '',
      styleId: '',
      viewId: '',
      format: 'CSV',
      mode: 'BROUILLON',
      grille: 'NORMALE',
      departementId: '',
    },
  });

  // ---- Vérification du rôle ----
  const isResponsable = role === 'RESPONSABLE_DEPARTEMENT';
  const isDirection = role === 'DIRECTION';
  const isAdminOrManager =
    role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE';

  const peutCreerExport =
    role === 'ADMINISTRATEUR' ||
    role === 'GESTIONNAIRE' ||
    role === 'RESPONSABLE_DEPARTEMENT' ||
    role === 'DIRECTION';

  if (!peutCreerExport) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('accessDeniedExport')}</CardTitle>
            <CardDescription>
              {t('accessDeniedExportDescription')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ---- Chargement des données de référence ----
  useEffect(() => {
    let mounted = true;
    async function loadReferenceData() {
      try {
        const [vRes, viewsRes, stylesRes] = await Promise.all([
          fetch('/versions').then(async (r) => {
            if (!r.ok) return [];
            return (await r.json()) as Version[];
          }),
          fetchExportViews({ actif: true }),
          fetchExportStyles({ actif: true }),
        ]);
        if (mounted) {
          setVersions(vRes);
          setViews(viewsRes);
          setStyles(stylesRes);
        }
      } catch {
        // Ignoré
      }
    }
    loadReferenceData();
    return () => { mounted = false; };
  }, []);
  // ---- Chargement de la liste des jobs ----
  useEffect(() => {
    let mounted = true;
    async function loadJobs() {
      try {
        const result = await fetchExportJobs({ limit: 50 });
        if (mounted) setJobs(result.data);
      } catch {
        setError(t('error'));
      }
    }
    loadJobs();
    return () => { mounted = false; };
  }, []);

  // ---- Polling du statut des jobs en cours ----
  useEffect(() => {
    const jobIds = jobs
      .filter((j) => j.statut === 'QUEUED' || j.statut === 'RUNNING')
      .map((j) => j.id);
    if (jobIds.length === 0) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }
    if (!pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        for (const id of jobIds) {
          try {
            const job = await fetchExportJobById(id);
            setJobs((prev) =>
              prev.map((j) => (j.id === id ? job : j)),
            );
          } catch {
            /* ignore polling errors */
          }
        }
      }, 3000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [jobs]);
  // ---- Soumission du formulaire ----
  const onSubmit = async (data: FormData) => {
    setError(null);
    setSuccess(null);
    setCreating(true);

    try {
      const dto: CreateExportJobInput = {
        versionId: data.versionId,
        format: data.format,
        mode: data.mode,
        grille: data.grille,
        parametres: {
          departementIds: data.departementId ? [data.departementId] : [],
        },
      };
      if (data.styleId) dto.styleId = data.styleId;
      if (data.viewId) dto.viewId = data.viewId;

      const job = await createExportJob(dto);
      setSuccess(t('exportSuccess'));
      setJobs((prev) => [job, ...prev]);
      form.reset({
        versionId: '',
        styleId: '',
        viewId: '',
        format: 'CSV',
        mode: 'BROUILLON',
        grille: 'NORMALE',
        departementId: '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('exportError');
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  // ---- Téléchargement ----
  const handleDownload = async (id: string) => {
    try {
      const { downloadUrl } = await fetchExportDownloadUrl(id);
      setDownloadUrl(downloadUrl);
      window.location.href = downloadUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : t('exportError');
      setError(message);
    }
  };

  // ---- Départements disponibles pour le responsable ----
  const responsableDepartements = isResponsable ? departments : [];

  const filteredModes = isDirection
    ? MODES.filter((m) => m.value === 'OFFICIEL')
    : MODES;

  const statutColor = (statut: string) => {
    return STATUT_BADGE[statut] ?? 'bg-zinc-100 text-zinc-600';
  };

  const statutLabel = (statut: string) => {
    return STATUT_LABEL[statut] ?? statut;
  };
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-solid border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {t('exportsTitle')}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t('exportsDescription')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulaire de création */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('exportCreate')}</CardTitle>
                <CardDescription>
                  Configurez et lancez un nouvel export.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('exportVersion')}</Label>
                    <Select
                      onValueChange={(val) => form.setValue('versionId', val as string)}
                      value={form.watch('versionId') ?? undefined}
                      disabled={creating}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une version" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.numero} ({v.statut})
                          </SelectItem>
                        ))}
                        {versions.length === 0 && (
                          <SelectItem disabled value="">
                            Aucune version disponible
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {isAdminOrManager && (
                    <div className="space-y-2">
                      <Label>{t('exportStyle')}</Label>
                      <Select
                        onValueChange={(val) => form.setValue('styleId', val ?? undefined)}
                        value={form.watch('styleId') ?? undefined}
                        disabled={creating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Modèle visuel (optionnel)" />
                        </SelectTrigger>
                        <SelectContent>
                          {styles.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.libelle}
                            </SelectItem>
                          ))}
                          {styles.length === 0 && (
                            <SelectItem disabled value="">
                              Aucun modèle disponible
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isAdminOrManager && (
                    <div className="space-y-2">
                      <Label>{t('exportView')}</Label>
                      <Select
                        onValueChange={(val) => form.setValue('viewId', val ?? undefined)}
                        value={form.watch('viewId') ?? undefined}
                        disabled={creating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Configuration de vue (optionnel)" />
                        </SelectTrigger>
                        <SelectContent>
                          {views.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.libelle}
                            </SelectItem>
                          ))}
                          {views.length === 0 && (
                            <SelectItem disabled value="">
                              Aucune configuration disponible
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>{t('exportFormat')}</Label>
                    <Select
                      onValueChange={(val) => form.setValue('format', val as 'PDF' | 'XLSX' | 'CSV')}
                      value={form.watch('format') ?? undefined}
                      disabled={creating}
                    >
                      <SelectTrigger>
                        <SelectValue>{(form.watch('format') as 'PDF' | 'XLSX' | 'CSV' | undefined) ?? 'CSV'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {FORMATS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('exportMode')}</Label>
                    <Select
                      onValueChange={(val) => form.setValue('mode', val as 'BROUILLON' | 'OFFICIEL')}
                      value={form.watch('mode') ?? undefined}
                      disabled={creating}
                    >
                      <SelectTrigger>
                        <SelectValue>{(form.watch('mode') as 'BROUILLON' | 'OFFICIEL' | undefined) ?? 'BROUILLON'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredModes.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('exportGrille')}</Label>
                    <Select
                      onValueChange={(val) => form.setValue('grille', val as 'NORMALE' | 'RAMADAN' | undefined)}
                      value={form.watch('grille') ?? undefined}
                      disabled={creating}
                    >
                      <SelectTrigger>
                        <SelectValue>{(form.watch('grille') as 'NORMALE' | 'RAMADAN' | undefined) ?? 'NORMALE'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {GRILLES.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!isResponsable && (
                    <div className="space-y-2">
                      <Label>{t('exportDepartements')}</Label>
                      <Select
                        onValueChange={(val) => form.setValue('departementId', val ?? undefined)}
                        value={form.watch('departementId') ?? undefined}
                        disabled={creating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Départements (optionnel)" />
                        </SelectTrigger>
                        <SelectContent>
                          {responsableDepartements.length > 0 ? (
                            <>
                              {responsableDepartements.map((d) => (
                                <SelectItem key={d} value={d}>
                                  {d}
                                </SelectItem>
                              ))}
                            </>
                          ) : (
                            <SelectItem disabled value="">
                              Aucun département configuré
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Laisser vide pour exporter tous les départements.
                      </p>
                    </div>
                  )}

                  {isResponsable && (
                    <div className="space-y-2">
                      <Label>{t('exportDepartementResponsable')}</Label>
                      <Select
                        onValueChange={() => {}}
                        value={responsableDepartements[0]}
                        disabled
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {responsableDepartements[0] ?? t('exportDepartementResponsable')}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {responsableDepartements.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Votre département est pré-sélectionné et verrouillé.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={creating || !form.watch('versionId')}
                  >
                    {creating ? 'Chargement…' : t('exportLaunch')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          {/* Liste des jobs */}
          <div className="lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('exportJobList')}</CardTitle>
                <CardDescription>
                  Historique et statut de vos exports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    {t('exportNoJobs')}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">{t('exportJobId')}</TableHead>
                          <TableHead>{t('exportJobVersion')}</TableHead>
                          <TableHead>{t('exportJobFormat')}</TableHead>
                          <TableHead>{t('exportJobMode')}</TableHead>
                          <TableHead>{t('exportJobStatut')}</TableHead>
                          <TableHead className="text-right">{t('exportJobDate')}</TableHead>
                          <TableHead className="w-24" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell className="font-mono text-xs">
                              {job.id.slice(0, 8)}…
                            </TableCell>
                            <TableCell className="text-xs">
                              {job.versionId.slice(0, 8)}…
                            </TableCell>
                            <TableCell className="text-xs">
                              {job.format}
                            </TableCell>
                            <TableCell className="text-xs">
                              {job.mode}
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="secondary" className={statutColor(job.statut)}>
                                {statutLabel(job.statut)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                              {new Date(job.createdAt).toLocaleString('fr-FR')}
                            </TableCell>
                            <TableCell className="text-right">
                              {job.statut === 'DONE' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleDownload(job.id)}
                                  disabled={!!downloadUrl}
                                >
                                  {t('exportDownload')}
                                </Button>
                              )}
                              {job.statut === 'FAILED' && (
                                <span className="text-xs text-red-600 dark:text-red-400">
                                  {job.erreur ?? t('exportError')}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}