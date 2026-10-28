'use client';

// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page de configuration des modèles visuels et vues d'export (L6-10)
// Route : /export-config — onglet styles réservé à ADMINISTRATEUR,
// onglet vues accessible à ADMINISTRATEUR et GESTIONNAIRE.

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/shell/AuthProvider';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  fetchExportStyles,
  createExportStyle,
  updateExportStyle,
  deleteExportStyle,
  fetchExportViews,
  createExportView,
  updateExportView,
  deleteExportView,
  type ExportStyle,
  type ExportView,
  type CreateExportStyleInput,
  type UpdateExportStyleInput,
  type CreateExportViewInput,
  type UpdateExportViewInput,
} from '@/lib/api/export-config';

const LIMIT = 10;

type TabId = 'styles' | 'views';

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function parseJsonOrFallback(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function statusBadge(actif: boolean): React.ReactNode {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${
      actif
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
    }`}>
      {actif ? t('actif') : t('inactif')}
    </span>
  );
}

interface StyleFormData {
  code: string;
  libelle: string;
  config: string;
  actif: boolean;
}

interface ViewFormData {
  code: string;
  libelle: string;
  vue: string;
  format: 'PDF' | 'XLSX';
  config: string;
  actif: boolean;
}

export default function ExportConfigPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<TabId>('styles');

  // ---------- Styles state ----------
  const [styles, setStyles] = useState<ExportStyle[]>([]);
  const [stylesTotal, setStylesTotal] = useState(0);
  const [stylesPage, setStylesPage] = useState(1);
  const [stylesSearch, setStylesSearch] = useState('');
  const [stylesLoading, setStylesLoading] = useState(false);

  // ---------- Views state ----------
  const [views, setViews] = useState<ExportView[]>([]);
  const [viewsTotal, setViewsTotal] = useState(0);
  const [viewsPage, setViewsPage] = useState(1);
  const [viewsSearch, setViewsSearch] = useState('');
  const [viewsLoading, setViewsLoading] = useState(false);

  // ---------- Dialog state ----------
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [dialogTab, setDialogTab] = useState<TabId>('styles');
  const [editingItem, setEditingItem] = useState<ExportStyle | ExportView | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: TabId } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ---------- Fetch ----------
  const loadStyles = useCallback(async () => {
    setStylesLoading(true);
    setError(null);
    try {
      const data = await fetchExportStyles({
        page: stylesPage,
        limit: LIMIT,
        code: stylesSearch || undefined,
        libelle: stylesSearch || undefined,
      });
      setStyles(data.data);
      setStylesTotal(data.total);
    } catch {
      setError(t('exportConfigLoadError'));
    } finally {
      setStylesLoading(false);
    }
  }, [stylesPage, stylesSearch]);

  const loadViews = useCallback(async () => {
    setViewsLoading(true);
    setError(null);
    try {
      const data = await fetchExportViews({
        page: viewsPage,
        limit: LIMIT,
        code: viewsSearch || undefined,
        libelle: viewsSearch || undefined,
      });
      setViews(data.data);
      setViewsTotal(data.total);
    } catch {
      setError(t('exportConfigLoadError'));
    } finally {
      setViewsLoading(false);
    }
  }, [viewsPage, viewsSearch]);

  // Chargement initial des styles au premier rendu
  useEffect(() => {
    setStylesLoading(true);
    setError(null);
    fetchExportStyles({ page: stylesPage, limit: LIMIT, code: stylesSearch || undefined, libelle: stylesSearch || undefined })
      .then((data) => {
        setStyles(data.data);
        setStylesTotal(data.total);
      })
      .catch(() => {
        setError(t('exportConfigLoadError'));
      })
      .finally(() => {
        setStylesLoading(false);
      });
  }, [stylesPage, stylesSearch]);

  // ---------- Handlers ----------
  const handleCreate = async (data: StyleFormData | ViewFormData) => {
    setSaving(true);
    setError(null);
    try {
      if (dialogTab === 'styles') {
        const dto: CreateExportStyleInput = {
          code: data.code,
          libelle: data.libelle,
          config: parseJsonOrFallback(data.config as string),
          actif: data.actif,
        };
        await createExportStyle(dto);
      } else {
        const dto: CreateExportViewInput = {
          code: data.code,
          libelle: data.libelle,
          vue: (data as ViewFormData).vue,
          format: (data as ViewFormData).format,
          config: parseJsonOrFallback(data.config as string),
          actif: data.actif,
        };
        await createExportView(dto);
      }
      setSuccess(t('exportConfigSaveSuccess'));
      setDialogOpen(false);
      if (tab === 'styles') loadStyles();
      else loadViews();
    } catch {
      setError(t('exportConfigSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<StyleFormData> & Partial<ViewFormData>) => {
    setSaving(true);
    setError(null);
    try {
      if (dialogTab === 'styles') {
        const dto: UpdateExportStyleInput = {};
        if (data.libelle !== undefined) dto.libelle = data.libelle;
        if (data.config !== undefined) dto.config = parseJsonOrFallback(data.config as string);
        if (data.actif !== undefined) dto.actif = data.actif;
        await updateExportStyle(id, dto);
      } else {
        const dto: UpdateExportViewInput = {};
        if (data.libelle !== undefined) dto.libelle = data.libelle;
        if (data.vue !== undefined) dto.vue = data.vue;
        if (data.format !== undefined) dto.format = data.format;
        if (data.config !== undefined) dto.config = parseJsonOrFallback(data.config as string);
        if (data.actif !== undefined) dto.actif = data.actif;
        await updateExportView(id, dto);
      }
      setSuccess(t('exportConfigSaveSuccess'));
      setDialogOpen(false);
      setEditingItem(null);
      if (tab === 'styles') loadStyles();
      else loadViews();
    } catch {
      setError(t('exportConfigSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      if (deleteTarget.type === 'styles') {
        await deleteExportStyle(deleteTarget.id);
      } else {
        await deleteExportView(deleteTarget.id);
      }
      setSuccess(t('exportConfigDeleteSuccess'));
      setDeleteTarget(null);
      if (tab === 'styles') loadStyles();
      else loadViews();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('CONFIG_IN_USE') || message.includes('400')) {
        setError(t('exportConfigUsedByJob'));
      } else {
        setError(t('exportConfigDeleteError'));
      }
    } finally {
      setDeleting(false);
    }
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setDialogTab(tab);
    setEditingItem(null);
    setError(null);
    setSuccess(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: ExportStyle | ExportView) => {
    setDialogMode('edit');
    setDialogTab(tab);
    setEditingItem(item);
    setError(null);
    setSuccess(null);
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string, type: TabId) => {
    setDeleteTarget({ id, type });
    setError(null);
    setSuccess(null);
    setDialogOpen(true);
  };

  // ---------- Render tables ----------
  const renderStylesTable = () => {
    if (stylesLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-zinc-500 dark:text-zinc-400">
          Chargement…
        </div>
      );
    }
    if (styles.length === 0) {
      return (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          {t('exportConfigNoStyles') ?? 'Aucun modèle visuel.'}
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">{t('exportConfigCode')}</TableHead>
              <TableHead>{t('exportConfigLibelle')}</TableHead>
              <TableHead className="w-20">{t('exportConfigVersion')}</TableHead>
              <TableHead className="w-24">{t('exportConfigActif')}</TableHead>
              <TableHead className="w-40">{t('exportConfigUtiliseLe')}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {styles.map((style) => (
              <TableRow key={style.id}>
                <TableCell className="font-mono text-xs">{style.code}</TableCell>
                <TableCell className="text-sm">{style.libelle}</TableCell>
                <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                  v{style.styleVersion}
                </TableCell>
                <TableCell>{statusBadge(style.actif)}</TableCell>
                <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                  {style.utiliseLe ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(style)}>
                    {t('exportConfigEdit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openDeleteDialog(style.id, 'styles')}
                  >
                    {t('exportConfigDelete')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderViewsTable = () => {
    if (viewsLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-zinc-500 dark:text-zinc-400">
          Chargement…
        </div>
      );
    }
    if (views.length === 0) {
      return (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          {t('exportConfigNoViews') ?? 'Aucune configuration de vue.'}
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">{t('exportConfigCode')}</TableHead>
              <TableHead>{t('exportConfigLibelle')}</TableHead>
              <TableHead className="w-20">{t('exportConfigVersion')}</TableHead>
              <TableHead className="w-24">{t('exportConfigActif')}</TableHead>
              <TableHead className="w-24">{t('exportConfigFormat')}</TableHead>
              <TableHead className="w-40">{t('exportConfigUtiliseLe')}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {views.map((view) => (
              <TableRow key={view.id}>
                <TableCell className="font-mono text-xs">{view.code}</TableCell>
                <TableCell className="text-sm">{view.libelle}</TableCell>
                <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                  v{view.viewVersion}
                </TableCell>
                <TableCell>{statusBadge(view.actif)}</TableCell>
                <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                  {view.format}
                </TableCell>
                <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                  {view.utiliseLe ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(view)}>
                    {t('exportConfigEdit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openDeleteDialog(view.id, 'views')}
                  >
                    {t('exportConfigDelete')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const canManageStyles = role === 'ADMINISTRATEUR';
  const canManageViews = role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE';

  const isEdit = dialogMode === 'edit' && editingItem !== null;
  const item = isEdit ? editingItem : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('exportConfigTitle')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Gestion des modèles visuels (styles) et configurations de vue d&rsquo;export.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/30 dark:text-green-300">
          {success}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v: string) => {
        const value = v as TabId;
        setTab(value);
        router.push(`/export-config?tab=${value}`);
        if (value === 'styles') void loadStyles();
        else void loadViews();
      }}>
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="styles" disabled={!canManageStyles}>
            {t('exportConfigStylesTab')}
          </TabsTrigger>
          <TabsTrigger value="views" disabled={!canManageViews}>
            {t('exportConfigViewsTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="styles" className="mt-6">
          {!canManageStyles && (
            <div className="rounded-lg bg-amber-50 p-4 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {t('exportConfigStyleAdminOnly')}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('exportConfigSearch')}
                value={stylesSearch}
                onChange={(e) => { setStylesSearch(e.target.value); setStylesPage(1); }}
                className="w-64"
              />
              <Button onClick={openCreateDialog} disabled={!canManageStyles || saving}>
                {t('exportConfigNew')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {stylesPage} / {Math.ceil(stylesTotal / LIMIT) || 1} &nbsp;•&nbsp; {stylesTotal} {t('exportConfigTotal')}
              </span>
              <button
                onClick={() => setStylesPage((p) => Math.max(1, p - 1))}
                disabled={stylesPage <= 1}
                className="px-2 py-1 text-sm border rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                ‹
              </button>
              <button
                onClick={() => setStylesPage((p) => Math.min(Math.ceil(stylesTotal / LIMIT) || 1, p + 1))}
                disabled={stylesPage >= Math.ceil(stylesTotal / LIMIT) || stylesTotal === 0}
                className="px-2 py-1 text-sm border rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                ›
              </button>
            </div>
          </div>
          <div className="mt-4">{renderStylesTable()}</div>
        </TabsContent>

        <TabsContent value="views" className="mt-6">
          {!canManageViews && (
            <div className="rounded-lg bg-amber-50 p-4 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {t('exportConfigViewAdminGestionnaireOnly')}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('exportConfigSearch')}
                value={viewsSearch}
                onChange={(e) => { setViewsSearch(e.target.value); setViewsPage(1); }}
                className="w-64"
              />
              <Button onClick={openCreateDialog} disabled={!canManageViews || saving}>
                {t('exportConfigNew')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {viewsPage} / {Math.ceil(viewsTotal / LIMIT) || 1} &nbsp;•&nbsp; {viewsTotal} {t('exportConfigTotal')}
              </span>
              <button
                onClick={() => setViewsPage((p) => Math.max(1, p - 1))}
                disabled={viewsPage <= 1}
                className="px-2 py-1 text-sm border rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                ‹
              </button>
              <button
                onClick={() => setViewsPage((p) => Math.min(Math.ceil(viewsTotal / LIMIT) || 1, p + 1))}
                disabled={viewsPage >= Math.ceil(viewsTotal / LIMIT) || viewsTotal === 0}
                className="px-2 py-1 text-sm border rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                ›
              </button>
            </div>
          </div>
          <div className="mt-4">{renderViewsTable()}</div>
        </TabsContent>
      </Tabs>

      {/* Dialog create / edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger>
          <button className="hidden" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create'
                ? t('exportConfigNew')
                : t('exportConfigEdit')}
            </DialogTitle>
            <DialogDescription>
              {dialogTab === 'styles'
                ? t('exportConfigStyleDesc')
                : t('exportConfigViewDesc')}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const code = formData.get('code') as string;
              const libelle = formData.get('libelle') as string;
              const actif = formData.get('actif') === 'on';
              const configEl = e.currentTarget.elements.namedItem(
                'config',
              ) as HTMLTextAreaElement | null;
              const configText = configEl?.value || '{}';

              if (dialogTab === 'styles') {
                if (dialogMode === 'edit' && editingItem) {
                  handleUpdate(editingItem.id, {
                    libelle,
                    config: configText,
                    actif,
                  });
                } else {
                  handleCreate({ code, libelle, config: configText, actif });
                }
              } else {
                const vue = formData.get('vue') as string;
                const format = formData.get('format') as 'PDF' | 'XLSX';
                if (dialogMode === 'edit' && editingItem) {
                  handleUpdate(editingItem.id, {
                    libelle,
                    vue,
                    format,
                    config: configText,
                    actif,
                  });
                } else {
                  handleCreate({ code, libelle, vue, format, config: configText, actif });
                }
              }
            }}
          >
            <div className="grid gap-4 p-4">
              {dialogTab === 'styles' ? (
                <>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>{t('exportConfigCode')}</Label>
                      <Input
                        required
                        name="code"
                        value={isEdit ? (item as ExportStyle).code : ''}
                        disabled={isEdit}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('exportConfigLibelle')}</Label>
                      <Input
                        required
                        name="libelle"
                        defaultValue={isEdit ? (item as ExportStyle).libelle : ''}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('exportConfigConfig')}</Label>
                    <Textarea
                      required
                      name="config"
                      defaultValue={isEdit
                        ? formatJson((item as ExportStyle).config)
                        : formatJson({})}
                      className="font-mono text-xs h-48"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t('exportConfigApercu')}
                    </p>
                    <div className="rounded bg-zinc-900/50 p-3 text-xs font-mono overflow-x-auto text-zinc-200 dark:text-zinc-100">
                      {isEdit ? formatJson((item as ExportStyle).config) : formatJson({})}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="hidden"
                      name="actif"
                      defaultValue={isEdit
                        ? (item as ExportStyle).actif
                          ? 'on'
                          : 'off'
                        : 'on'}
                    />
                    <Switch
                      checked={isEdit ? (item as ExportStyle).actif : true}
                    />
                    <Label className="text-sm">{t('exportConfigActif')}</Label>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>{t('exportConfigCode')}</Label>
                      <Input
                        required
                        name="code"
                        value={isEdit ? (item as ExportView).code : ''}
                        disabled={isEdit}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('exportConfigLibelle')}</Label>
                      <Input
                        required
                        name="libelle"
                        defaultValue={isEdit ? (item as ExportView).libelle : ''}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Vue</Label>
                      <Input
                        required
                        name="vue"
                        defaultValue={isEdit ? (item as ExportView).vue : ''}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('exportConfigFormat')}</Label>
                      <Input
                        required
                        name="format"
                        defaultValue={isEdit ? (item as ExportView).format : ''}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('exportConfigConfig')}</Label>
                    <Textarea
                      required
                      name="config"
                      defaultValue={isEdit
                        ? formatJson((item as ExportView).config)
                        : formatJson({})}
                      className="font-mono text-xs h-48"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t('exportConfigApercu')}
                    </p>
                    <div className="rounded bg-zinc-900/50 p-3 text-xs font-mono overflow-x-auto text-zinc-200 dark:text-zinc-100">
                      {isEdit ? formatJson((item as ExportView).config) : formatJson({})}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="hidden"
                      name="actif"
                      defaultValue={isEdit
                        ? (item as ExportView).actif
                          ? 'on'
                          : 'off'
                        : 'on'}
                    />
                    <Switch
                      checked={isEdit ? (item as ExportView).actif : true}
                    />
                    <Label className="text-sm">{t('exportConfigActif')}</Label>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('exportConfigAnnuler')}
              </Button>
              <Button type="submit" disabled={saving}>
                {t('exportConfigEnregistrer')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogTrigger>
          <button className="hidden" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('exportConfigConfirmDelete')}</DialogTitle>
            <DialogDescription>
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('exportConfigAnnuler')}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {t('exportConfigDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}