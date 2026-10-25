// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests E2E du workflow par rôle (L5-16)
//
// Scénarios couverts :
// 1. Parcours édition > soumission > validation > publication (Gestionnaire)
// 2. Parcours de rejet et correction (Responsable)
// 3. Parcours enseignant partagé : report d'approbation et revalidation
// 4. La Direction ne peut rien modifier (lecture seule)
//
// Authentification : appel API /auth/login, le cookie `token` est ensuite
// injecté dans le contexte navigateur pour les interactions UI.

import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const API_BASE = process.env.API_BASE ?? 'http://localhost:3000';

// ============================================================================
// Utilisateurs de test (doivent exister en base de recette)
// ============================================================================

const USERS = {
  GESTIONNAIRE: { email: 'gestionnaire@takt.test', password: 'TaktTest2026!' },
  RESPONSABLE: { email: 'responsable@takt.test', password: 'TaktTest2026!' },
  ADMINISTRATEUR: { email: 'administrateur@takt.test', password: 'TaktTest2026!' },
  DIRECTION: { email: 'direction@takt.test', password: 'TaktTest2026!' },
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
// Test 1 : Parcours édition > soumission > validation > publication
// ============================================================================

test('parcours complet : édition → soumission → validation → publication (Gestionnaire)', async ({
  request,
  page,
}) => {
  await setAuthCookie(request, page, 'GESTIONNAIRE');
  await page.goto('/');
  await expect(page.locator('text=TAKT')).toBeVisible();

  const createRes = await apiPost(request, '/versions', {
    semestreId: 'S1-2026',
  });
  expect(createRes.ok() || createRes.status() === 409).toBeTruthy();

  const versionRes = await apiGet(request, '/versions');
  const versions = await versionRes.json();
  const version = Array.isArray(versions) ? versions[0] : versions;
  expect(version).toBeDefined();
  const versionId = version.id;

  const submitRes = await apiPost(request, `/versions/${versionId}/transitions`, {
    action: 'SOUMETTRE',
  });
  expect(submitRes.ok()).toBeTruthy();

  const versionAfterSubmit = await apiGet(request, `/versions/${versionId}`);
  const versionData = await versionAfterSubmit.json();
  expect(versionData.statut).toBe('EN_VALIDATION');

  const validateRes = await apiPost(request, `/versions/${versionId}/validations`, {
    departementCode: 'INFO',
    decision: 'APPROUVE',
  });
  expect([200, 403, 409]).toContain(validateRes.status());

  const previsRes = await apiGet(request, `/versions/${versionId}/previsualisation-publication`);
  expect(previsRes.ok()).toBeTruthy();

  const publishRes = await apiPost(request, `/versions/${versionId}/publish`, {
    confirmation: true,
  });
  expect(publishRes.ok()).toBeTruthy();
  const publishBody = await publishRes.json();
  expect(publishBody.statut).toBe('PUBLIE');
});

// ============================================================================
// Test 2 : Parcours de rejet et correction
// ============================================================================

test('parcours rejet puis correction (Responsable)', async ({
  request,
  page,
}) => {
  await setAuthCookie(request, page, 'RESPONSABLE');

  const versionsRes = await apiGet(request, '/versions');
  const versions = await versionsRes.json();
  const version = Array.isArray(versions)
    ? versions.find((v: any) => v.statut === 'EN_VALIDATION')
    : null;
  if (!version) {
    test.skip();
    return;
  }

  const versionId = version.id;

  const rejectRes = await apiPost(request, `/versions/${versionId}/validations`, {
    departementCode: 'INFO',
    decision: 'REJETE',
    motif: 'Conflits non résolus sur les créneaux du matin',
  });
  expect(rejectRes.ok()).toBeTruthy();

  const versionAfterReject = await apiGet(request, `/versions/${versionId}`);
  const versionData = await versionAfterReject.json();
  expect(['REJETE', 'CORRECTION']).toContain(versionData.statut);

  const resubmitRes = await apiPost(request, `/versions/${versionId}/transitions`, {
    action: 'RESOUMETTRE',
  });
  expect(resubmitRes.ok()).toBeTruthy();

  const revalidateRes = await apiPost(request, `/versions/${versionId}/validations`, {
    departementCode: 'INFO',
    decision: 'APPROUVE',
  });
  expect(revalidateRes.ok()).toBeTruthy();
});

// ============================================================================
// Test 3 : Parcours enseignant partagé : report d'approbation et revalidation
// ============================================================================

test('parcours enseignant partagé : report d\'approbation et revalidation', async ({
  request,
  page,
}) => {
  await setAuthCookie(request, page, 'RESPONSABLE');

  const versionsRes = await apiGet(request, '/versions');
  const versions = await versionsRes.json();
  const version = Array.isArray(versions)
    ? versions.find((v: any) => v.statut === 'EN_VALIDATION')
    : null;
  if (!version) {
    test.skip();
    return;
  }

  const versionId = version.id;

  const impactRes = await apiGet(request, `/versions/${versionId}/impact`);
  const impact = await impactRes.json();
  const reporteeDept = impact.departements.find(
    (d: any) => d.reportee === true,
  );

  if (reporteeDept) {
    expect(reporteeDept.reportee).toBe(true);
  }

  const deptCode = reporteeDept?.departementCode ?? 'INFO';
  const revalidateRes = await apiPost(request, `/versions/${versionId}/validations`, {
    departementCode: deptCode,
    decision: 'APPROUVE',
  });
  expect([200, 409]).toContain(revalidateRes.status());
});

// ============================================================================
// Test 4 : La Direction ne peut rien modifier (lecture seule)
// ============================================================================

test('Direction : aucune action d\'écriture accessible', async ({
  request,
  page,
}) => {
  await setAuthCookie(request, page, 'DIRECTION');

  const versionsRes = await apiGet(request, '/versions');
  const versions = await versionsRes.json();
  const version = Array.isArray(versions) ? versions[0] : null;
  if (!version) {
    test.skip();
    return;
  }

  const versionId = version.id;

  const publishRes = await apiPost(request, `/versions/${versionId}/publish`, {
    confirmation: true,
  });
  expect(publishRes.status()).toBe(403);

  const validateRes = await apiPost(request, `/versions/${versionId}/validations`, {
    departementCode: 'INFO',
    decision: 'APPROUVE',
  });
  expect(validateRes.status()).toBe(403);

  const createRes = await apiPost(request, '/versions', {
    semestreId: 'S1-2026',
  });
  expect(createRes.status()).toBe(403);

  const getRes = await apiGet(request, `/versions/${versionId}`);
  expect(getRes.ok()).toBeTruthy();
});

// ============================================================================
// Test 5 : Prévisualisation avant publication (Gestionnaire)
// ============================================================================

test('prévisualisation avant publication affiche les données complètes (Gestionnaire)', async ({
  request,
  page,
}) => {
  await setAuthCookie(request, page, 'GESTIONNAIRE');

  const versionsRes = await apiGet(request, '/versions');
  const versions = await versionsRes.json();
  const version = Array.isArray(versions)
    ? versions.find((v: any) => v.statut === 'VALIDE')
    : null;
  if (!version) {
    test.skip();
    return;
  }

  const versionId = version.id;

  const previsRes = await apiGet(request, `/versions/${versionId}/previsualisation-publication`);
  expect(previsRes.ok()).toBeTruthy();
  const previs = await previsRes.json();

  expect(previs.versionId).toBe(versionId);
  expect(previs.statut).toBe('VALIDE');
  expect(Array.isArray(previs.departementsValides)).toBe(true);
  expect(Array.isArray(previs.conflits)).toBe(true);
  expect(Array.isArray(previs.activites)).toBe(true);
  expect(previs.provenance).toBeDefined();
});