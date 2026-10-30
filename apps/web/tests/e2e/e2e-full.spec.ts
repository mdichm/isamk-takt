// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests E2E complet : répartition → génération → export (ticket L7-15)
// Parcours : création de version, lancement génération FET, attente, export PDF + XLSX, téléchargement.
// Utilise Playwright + appels API directs (même pattern que workflow-e2e.spec.ts, ticket L5-16).

import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const API_BASE = process.env.API_BASE ?? 'http://localhost:3000';

// ============================================================================
// Utilisateurs de test (doivent exister en base de recette)
// ============================================================================

const USERS = {
  GESTIONNAIRE: { email: 'gestionnaire@takt.test', password: 'TaktTest2026!' },
  RESPONSABLE: { email: 'responsable@takt.test', password: 'TaktTest2026!' },
  ADMINISTRATEUR: { email: 'administrateur@takt.test', password: 'TaktTest2026!' },
} as const;

type Role = keyof typeof USERS;

// ============================================================================
// Helpers API
// ============================================================================

async function setAuthCookie(
  request: APIRequestContext,
  page: Page,
  role: Role,
): Promise<void> {
  const loginRes = await request.post(`${API_BASE}/auth/login`, {
    data: USERS[role],
  });
  expect(loginRes.ok()).toBeTruthy();

  const cookies = loginRes.headers()['set-cookie'];
  const cookieList = Array.isArray(cookies) ? cookies : [cookies].filter(Boolean);
  const tokenCookie = cookieList.find((c) => c.startsWith('token='));
  if (tokenCookie) {
    const tokenValue = tokenCookie.split(';')[0].split('=')[1];
    await page.context().addCookies([
      { name: 'token', value: tokenValue, domain: 'localhost', path: '/' },
    ]);
  } else {
    const body = await loginRes.json();
    const token = (body as { token?: string }).token;
    if (token) {
      await page.context().addCookies([
        { name: 'token', value: token, domain: 'localhost', path: '/' },
      ]);
    }
  }
}

async function apiPost(request: APIRequestContext, path: string, body?: unknown) {
  return request.post(`${API_BASE}${path}`, body ? { data: body } : {});
}

async function apiGet(request: APIRequestContext, path: string) {
  return request.get(`${API_BASE}${path}`);
}

// ============================================================================
// Attente de fin de génération (polling)
// ============================================================================

async function waitForGeneration(
  request: APIRequestContext,
  generationId: string,
  maxSeconds = 120,
): Promise<{ statut: string; id: string }> {
  const deadline = Date.now() + maxSeconds * 1000;
  while (Date.now() < deadline) {
    const res = await apiGet(request, `/generations/${generationId}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const statut = body.statut as string;
    if (statut !== 'QUEUED' && statut !== 'RUNNING') {
      return { statut, id: body.id };
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`Génération ${generationId} non terminée après ${maxSeconds}s`);
}

// ============================================================================
// Attente de fin d'export (polling)
// ============================================================================

async function waitForExport(
  request: APIRequestContext,
  exportId: string,
  maxSeconds = 60,
): Promise<{ statut: string; storageKey?: string }> {
  const deadline = Date.now() + maxSeconds * 1000;
  while (Date.now() < deadline) {
    const res = await apiGet(request, `/exports/${exportId}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const statut = body.statut as string;
    if (statut === 'DONE' || statut === 'FAILED') {
      return { statut, storageKey: body.storageKey as string | undefined };
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Export ${exportId} non terminé après ${maxSeconds}s`);
}

// ============================================================================
// Test 1 : Parcours complet — version → génération → export PDF + XLSX (Gestionnaire)
// ============================================================================

test('parcours complet répartition → génération → export PDF et XLSX (Gestionnaire)', async ({
  request,
  page,
}) => {
  await setAuthCookie(request, page, 'GESTIONNAIRE');
  await page.goto('/');
  await expect(page.locator('text=TAKT')).toBeVisible();

  // --- Étape 1 : lister les semestres et en choisir un ---
  const semestresRes = await apiGet(request, '/semestres');
  expect(semestresRes.ok()).toBeTruthy();
  const semestres = await semestresRes.json();
  const semesterList = Array.isArray(semestres) ? semestres : semestres.items ?? [];
  const semester = semesterList.find(
    (s: { statut?: string }) => s.statut === 'ACTIF',
  );
  if (!semester) {
    test.skip();
    return;
  }
  const semestreId = semester.id;

  // --- Étape 2 : créer une version de travail ---
  const createVersionRes = await apiPost(request, '/versions', {
    semestreId,
    motif: 'E2E L7-15 parcours complet',
  });
  expect(createVersionRes.status()).toBe(201);
  const version = await createVersionRes.json();
  const versionId = version.id as string;

  // --- Étape 3 : récupérer le périmètre (pour le perimetreHash et le profil) ---
  const perimetreRes = await apiGet(request, `/versions/${versionId}/perimetre`);
  expect(perimetreRes.ok()).toBeTruthy();
  const perimetre = await perimetreRes.json();
  const perimetreHash = perimetre.perimetreHash as string;
  const profil = perimetre.profil as { id?: string } | null | undefined;
  if (!profil?.id) {
    test.skip();
    return;
  }

  // --- Étape 4 : lancer une génération FET ---
  const launchRes = await apiPost(request, `/versions/${versionId}/generations`, {
    profilId: profil.id,
    perimetreHash,
    acknowledgeUntranslatedConstraints: false,
  });
  expect(launchRes.status()).toBe(202);
  const generation = await launchRes.json();
  const generationId = generation.id as string;

  // --- Étape 5 : attendre la fin de la génération ---
  const generationResult = await waitForGeneration(request, generationId);
  expect(generationResult.statut).toMatch(/^(SUCCEEDED|SUCCEEDED_WITH_WARNINGS)$/);

  // --- Étape 6 : exporter en PDF (mode brouillon) ---
  const pdfExportRes = await apiPost(request, '/exports', {
    versionId,
    format: 'PDF',
    mode: 'BROUILLON',
    grille: 'NORMALE',
    parametres: { departementIds: [], groupeIds: [] },
  });
  expect(pdfExportRes.status()).toBe(201);
  const pdfExport = await pdfExportRes.json();
  const pdfExportId = pdfExport.id as string;

  // --- Étape 7 : exporter en XLSX (mode brouillon) ---
  const xlsxExportRes = await apiPost(request, '/exports', {
    versionId,
    format: 'XLSX',
    mode: 'BROUILLON',
    grille: 'NORMALE',
    parametres: { departementIds: [], groupeIds: [] },
  });
  expect(xlsxExportRes.status()).toBe(201);
  const xlsxExport = await xlsxExportRes.json();
  const xlsxExportId = xlsxExport.id as string;

  // --- Étape 8 : attendre la fin des deux exports ---
  const pdfResult = await waitForExport(request, pdfExportId);
  expect(pdfResult.statut).toBe('DONE');
  expect(pdfResult.storageKey).toBeDefined();

  const xlsxResult = await waitForExport(request, xlsxExportId);
  expect(xlsxResult.statut).toBe('DONE');
  expect(xlsxResult.storageKey).toBeDefined();

  // --- Étape 9 : vérifier que les URLs de téléchargement sont obtenables ---
  const pdfDownloadRes = await apiGet(request, `/exports/${pdfExportId}/download`);
  expect(pdfDownloadRes.ok()).toBeTruthy();
  const pdfDownload = await pdfDownloadRes.json();
  expect(pdfDownload.downloadUrl).toBeDefined();
  expect(pdfDownload.expiresIn).toBeDefined();

  const xlsxDownloadRes = await apiGet(request, `/exports/${xlsxExportId}/download`);
  expect(xlsxDownloadRes.ok()).toBeTruthy();
  const xlsxDownload = await xlsxDownloadRes.json();
  expect(xlsxDownload.downloadUrl).toBeDefined();
  expect(xlsxDownload.expiresIn).toBeDefined();
});

// ============================================================================
// Test 2 : Rejet d'export OFFICIEL sur version non publiée (422)
// ============================================================================

test('export OFFICIEL refusé sur version non publiée (Gestionnaire)', async ({
  request,
  page,
}) => {
  await setAuthCookie(request, page, 'GESTIONNAIRE');

  const semestresRes = await apiGet(request, '/semestres');
  expect(semestresRes.ok()).toBeTruthy();
  const semestres = await semestresRes.json();
  const semesterList = Array.isArray(semestres) ? semestres : semestres.items ?? [];
  const semester = semesterList.find(
    (s: { statut?: string }) => s.statut === 'ACTIF',
  );
  if (!semester) {
    test.skip();
    return;
  }

  const createVersionRes = await apiPost(request, '/versions', {
    semestreId: semester.id,
    motif: 'E2E L7-15 test refus officiel',
  });
  expect(createVersionRes.status()).toBe(201);
  const version = await createVersionRes.json();
  const versionId = version.id as string;

  const exportRes = await apiPost(request, '/exports', {
    versionId,
    format: 'PDF',
    mode: 'OFFICIEL',
    grille: 'NORMALE',
    parametres: { departementIds: [], groupeIds: [] },
  });
  expect(exportRes.status()).toBe(422);
});

// ============================================================================
// Test 3 : Export PDF par Responsable et Administrateur (mode brouillon)
// ============================================================================

test('export PDF accessible pour Responsable et Administrateur', async ({
  request,
  page,
}) => {
  for (const role of ['RESPONSABLE', 'ADMINISTRATEUR'] as Role[]) {
    await setAuthCookie(request, page, role);

    const semestresRes = await apiGet(request, '/semestres');
    expect(semestresRes.ok()).toBeTruthy();
    const semestres = await semestresRes.json();
    const semesterList = Array.isArray(semestres) ? semestres : semestres.items ?? [];
    const semester = semesterList.find(
      (s: { statut?: string }) => s.statut === 'ACTIF',
    );
    if (!semester) {
      test.skip();
      return;
    }

    const createVersionRes = await apiPost(request, '/versions', {
      semestreId: semester.id,
      motif: `E2E L7-15 export par ${role}`,
    });
    expect(createVersionRes.status()).toBe(201);
    const version = await createVersionRes.json();
    const versionId = version.id as string;

    const exportRes = await apiPost(request, '/exports', {
      versionId,
      format: 'PDF',
      mode: 'BROUILLON',
      grille: 'NORMALE',
      parametres: { departementIds: [], groupeIds: [] },
    });
    expect(exportRes.status()).toBe(201);
    const exportJob = await exportRes.json();
    const exportId = exportJob.id as string;

    const result = await waitForExport(request, exportId, 30);
    expect(result.statut).toBe('DONE');
    expect(result.storageKey).toBeDefined();
  }
});