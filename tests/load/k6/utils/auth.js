import http from 'k6/http';

// ============================================================================
// TAKT - Helpers d'authentification pour les tests de charge k6 (L7-08)
// ============================================================================

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function login(email, password) {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email,
    password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status !== 200) {
    throw new Error(`Échec de l'authentification (${res.status}): ${res.body}`);
  }

  const body = JSON.parse(res.body);
  return body.accessToken;
}

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
