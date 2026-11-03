import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, API_BASE } from './client';

/**
 * Le client doit router tous les chemins relatifs vers « /api/* », seul
 * préfixe proxyé vers le backend (proxy Next en dev, nginx en production).
 * Sans ce préfixe, la requête est servie par le front (404 ou page HTML).
 */
describe('client API — résolution des URLs', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const calledUrl = (): string => String(fetchMock.mock.calls[0]?.[0]);

  it('expose le préfixe /api', () => {
    expect(API_BASE).toBe('/api');
  });

  it('préfixe un chemin relatif par /api', async () => {
    await apiFetch('/repartitions?page=1&limit=12');
    expect(calledUrl()).toBe('/api/repartitions?page=1&limit=12');
  });

  it('préfixe un chemin sans slash initial par /api', async () => {
    await apiFetch('repartitions');
    expect(calledUrl()).toBe('/api/repartitions');
  });

  it('ne double pas le préfixe sur un chemin déjà préfixé', async () => {
    await apiFetch('/api/auth/me');
    expect(calledUrl()).toBe('/api/auth/me');
  });

  it('laisse inchangée une URL absolue', async () => {
    await apiFetch('http://localhost:3001/repartitions');
    expect(calledUrl()).toBe('http://localhost:3001/repartitions');
  });

  it('laisse inchangé un préfixe /api exact', async () => {
    await apiFetch('/api');
    expect(calledUrl()).toBe('/api');
  });

  it('préfixe les endpoints des modules utilisant API_BASE + chemin', async () => {
    await apiFetch(`${API_BASE}/structure/departements?limit=100`);
    expect(calledUrl()).toBe('/api/structure/departements?limit=100');
  });

  it('joint le jeton d’authentification lorsqu’il est disponible', async () => {
    document.cookie = 'token=jeton-test';
    await apiFetch('/repartitions');
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer jeton-test');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });
});
