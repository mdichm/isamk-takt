import { http, HttpResponse } from 'msw';

const departements = new Map<string, any>();
const formations = new Map<string, any>();
const niveaux = new Map<string, any>();
const groupes = new Map<string, any>();

function generateId() {
  return crypto.randomUUID();
}

async function jsonBody(request: Request) {
  return request.json();
}

export const handlers = [
  // Départements
  http.get('*/structure/departements', ({ request }) => {
    const url = new URL(request.url);
    const anneeId = url.searchParams.get('anneeId');
    let data = Array.from(departements.values());
    if (anneeId) data = data.filter((d) => d.anneeId === anneeId);
    return HttpResponse.json({ data, total: data.length, page: 1, limit: 10, totalPages: 1 });
  }),

  http.post('*/structure/departements', async ({ request }) => {
    const body = await jsonBody(request);
    const id = generateId();
    const dep = { id, ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    departements.set(id, dep);
    return HttpResponse.json(dep, { status: 201 });
  }),

  http.patch('*/structure/departements/:id', async ({ request, params }) => {
    const body = await jsonBody(request);
    const id = params.id as string;
    const existing = departements.get(id);
    if (!existing) return new HttpResponse(null, { status: 404 });
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    departements.set(id, updated);
    return HttpResponse.json(updated);
  }),

  http.delete('*/structure/departements/:id', ({ params }) => {
    const id = params.id as string;
    if (!departements.has(id)) return new HttpResponse(null, { status: 404 });
    departements.delete(id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch('*/structure/departements/reorder', async ({ request }) => {
    const body = await jsonBody(request);
    for (const item of body.items) {
      const dep = departements.get(item.id);
      if (dep) {
        dep.ordre = item.ordre;
        departements.set(item.id, dep);
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Formations
  http.get('*/structure/formations', ({ request }) => {
    const url = new URL(request.url);
    const departementId = url.searchParams.get('departementId');
    let data = Array.from(formations.values());
    if (departementId) data = data.filter((f) => f.departementId === departementId);
    return HttpResponse.json({ data, total: data.length, page: 1, limit: 10, totalPages: 1 });
  }),

  http.post('*/structure/formations', async ({ request }) => {
    const body = await jsonBody(request);
    const id = generateId();
    const form = { id, ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    formations.set(id, form);
    return HttpResponse.json(form, { status: 201 });
  }),

  http.patch('*/structure/formations/:id', async ({ request, params }) => {
    const body = await jsonBody(request);
    const id = params.id as string;
    const existing = formations.get(id);
    if (!existing) return new HttpResponse(null, { status: 404 });
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    formations.set(id, updated);
    return HttpResponse.json(updated);
  }),

  http.delete('*/structure/formations/:id', ({ params }) => {
    const id = params.id as string;
    if (!formations.has(id)) return new HttpResponse(null, { status: 404 });
    formations.delete(id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch('*/structure/formations/reorder', async ({ request }) => {
    const body = await jsonBody(request);
    for (const item of body.items) {
      const f = formations.get(item.id);
      if (f) {
        f.ordre = item.ordre;
        formations.set(item.id, f);
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Niveaux
  http.get('*/structure/niveaux', ({ request }) => {
    const url = new URL(request.url);
    const formationId = url.searchParams.get('formationId');
    let data = Array.from(niveaux.values());
    if (formationId) data = data.filter((n) => n.formationId === formationId);
    return HttpResponse.json({ data, total: data.length, page: 1, limit: 10, totalPages: 1 });
  }),

  http.post('*/structure/niveaux', async ({ request }) => {
    const body = await jsonBody(request);
    const id = generateId();
    const niv = { id, ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    niveaux.set(id, niv);
    return HttpResponse.json(niv, { status: 201 });
  }),

  http.patch('*/structure/niveaux/:id', async ({ request, params }) => {
    const body = await jsonBody(request);
    const id = params.id as string;
    const existing = niveaux.get(id);
    if (!existing) return new HttpResponse(null, { status: 404 });
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    niveaux.set(id, updated);
    return HttpResponse.json(updated);
  }),

  http.delete('*/structure/niveaux/:id', ({ params }) => {
    const id = params.id as string;
    if (!niveaux.has(id)) return new HttpResponse(null, { status: 404 });
    niveaux.delete(id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch('*/structure/niveaux/reorder', async ({ request }) => {
    const body = await jsonBody(request);
    for (const item of body.items) {
      const n = niveaux.get(item.id);
      if (n) {
        n.ordre = item.ordre;
        niveaux.set(item.id, n);
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Groupes
  http.get('*/structure/groupes', ({ request }) => {
    const url = new URL(request.url);
    const niveauId = url.searchParams.get('niveauId');
    const semestreId = url.searchParams.get('semestreId');
    let data = Array.from(groupes.values());
    if (niveauId) data = data.filter((g) => g.niveauId === niveauId);
    if (semestreId) data = data.filter((g) => g.semestreId === semestreId);
    return HttpResponse.json({ data, total: data.length, page: 1, limit: 10, totalPages: 1 });
  }),

  http.post('*/structure/groupes', async ({ request }) => {
    const body = await jsonBody(request);
    const id = generateId();
    const grp = { id, ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    groupes.set(id, grp);
    return HttpResponse.json(grp, { status: 201 });
  }),

  http.patch('*/structure/groupes/:id', async ({ request, params }) => {
    const body = await jsonBody(request);
    const id = params.id as string;
    const existing = groupes.get(id);
    if (!existing) return new HttpResponse(null, { status: 404 });
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    groupes.set(id, updated);
    return HttpResponse.json(updated);
  }),

  http.delete('*/structure/groupes/:id', ({ params }) => {
    const id = params.id as string;
    if (!groupes.has(id)) return new HttpResponse(null, { status: 404 });
    groupes.delete(id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch('*/groupes/reorder', async ({ request }) => {
    const body = await jsonBody(request);
    for (const item of body.items) {
      const g = groupes.get(item.id);
      if (g) {
        g.ordre = item.ordre;
        groupes.set(item.id, g);
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),
// Groupes API under /groupes (as used by hooks)
  http.get('*/groupes', ({ request }) => {
    const url = new URL(request.url);
    const niveauId = url.searchParams.get('niveauId');
    const semestreId = url.searchParams.get('semestreId');
    let data = Array.from(groupes.values());
    if (niveauId) data = data.filter((g) => g.niveauId === niveauId);
    if (semestreId) data = data.filter((g) => g.semestreId === semestreId);
    return HttpResponse.json({ data, total: data.length, page: 1, limit: 10, totalPages: 1 });
  }),
];
