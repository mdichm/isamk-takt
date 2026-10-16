import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import appConfig from './app.config.js';

describe('app.config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    delete process.env.OPENAPI_ENABLED;
    delete process.env.OPENAPI_PATH;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('devrait retourner une configuration par défaut en développement', () => {
    process.env.NODE_ENV = 'development';
    const config = appConfig();

    expect(config.nodeEnv).toBe('development');
    expect(config.openapi.enabled).toBe(true);
    expect(config.openapi.path).toBe('api/docs');
  });

  it('devrait désactiver OpenAPI quand OPENAPI_ENABLED=false', () => {
    process.env.NODE_ENV = 'development';
    process.env.OPENAPI_ENABLED = 'false';
    const config = appConfig();

    expect(config.openapi.enabled).toBe(false);
  });

  it('devrait utiliser le chemin OpenAPI personnalisé', () => {
    process.env.NODE_ENV = 'development';
    process.env.OPENAPI_PATH = 'docs/swagger';
    const config = appConfig();

    expect(config.openapi.path).toBe('docs/swagger');
  });

  it('devrait détecter l environnement production', () => {
    process.env.NODE_ENV = 'production';
    const config = appConfig();

    expect(config.nodeEnv).toBe('production');
    expect(config.openapi.enabled).toBe(true);
  });
});
