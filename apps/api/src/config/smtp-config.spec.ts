// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires de la configuration SMTP avec secrets (L5-22)
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSmtpConfig } from './smtp-config.js';

describe('loadSmtpConfig', () => {
  const directories: string[] = [];

  afterEach(() => {
    for (const directory of directories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('donne la priorité au fichier secret et normalise la configuration', () => {
    const directory = mkdtempSync(join(tmpdir(), 'takt-smtp-'));
    directories.push(directory);
    const userFile = join(directory, 'smtp_user');
    const passFile = join(directory, 'smtp_pass');
    const fromFile = join(directory, 'smtp_from');
    writeFileSync(userFile, 'secret-user');
    writeFileSync(passFile, 'secret-pass');
    writeFileSync(fromFile, 'secret-sender@takt.tn');

    const config = loadSmtpConfig({
      NODE_ENV: 'production',
      SMTP_HOST: 'cck.rnu.tn',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'environment-user',
      SMTP_PASS: 'environment-pass',
      SMTP_USER_FILE: userFile,
      SMTP_PASS_FILE: passFile,
      SMTP_FROM: 'environment-sender@takt.tn',
      SMTP_FROM_FILE: fromFile,
      SMTP_FROM_NAME: 'TAKT',
      APP_URL: 'https://takt.local',
    });

    expect(config).toEqual({
      enabled: true,
      host: 'cck.rnu.tn',
      port: 587,
      secure: false,
      user: 'secret-user',
      password: 'secret-pass',
      from: 'secret-sender@takt.tn',
      fromName: 'TAKT',
      appUrl: 'https://takt.local',
    });
  });

  it('refuse une configuration production incomplète', () => {
    expect(() =>
      loadSmtpConfig({
        NODE_ENV: 'production',
        SMTP_HOST: 'cck.rnu.tn',
        SMTP_PORT: '587',
      }),
    ).toThrow('Configuration SMTP de production incomplète');
  });

  it('désactive l’envoi réel en développement', () => {
    const config = loadSmtpConfig({ NODE_ENV: 'development' });

    expect(config.enabled).toBe(false);
  });

  it('SMTP_FROM_FILE introuvable (ENOENT) bascule sur SMTP_FROM', () => {
    const config = loadSmtpConfig({
      NODE_ENV: 'production',
      SMTP_HOST: 'cck.rnu.tn',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'env-user',
      SMTP_PASS: 'env-pass',
      SMTP_USER_FILE: '/nonexistent/smtp_user',
      SMTP_PASS_FILE: '/nonexistent/smtp_pass',
      SMTP_FROM: 'env-sender@takt.tn',
      SMTP_FROM_FILE: '/nonexistent/smtp_from',
      SMTP_FROM_NAME: 'TAKT',
      APP_URL: 'https://takt.local',
    });

    expect(config.from).toBe('env-sender@takt.tn');
  });

  it('SMTP_FROM_FILE vide bascule sur SMTP_FROM', () => {
    const directory = mkdtempSync(join(tmpdir(), 'takt-smtp-empty-'));
    directories.push(directory);
    const fromFile = join(directory, 'smtp_from');
    writeFileSync(fromFile, '');

    const config = loadSmtpConfig({
      NODE_ENV: 'production',
      SMTP_HOST: 'cck.rnu.tn',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'env-user',
      SMTP_PASS: 'env-pass',
      SMTP_FROM: 'env-sender@takt.tn',
      SMTP_FROM_FILE: fromFile,
      SMTP_FROM_NAME: 'TAKT',
      APP_URL: 'https://takt.local',
    });

    expect(config.from).toBe('env-sender@takt.tn');
  });

  it('SMTP_FROM_FILE non definie utilise SMTP_FROM directement', () => {
    const config = loadSmtpConfig({
      NODE_ENV: 'production',
      SMTP_HOST: 'cck.rnu.tn',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'env-user',
      SMTP_PASS: 'env-pass',
      SMTP_FROM: 'env-sender@takt.tn',
      SMTP_FROM_NAME: 'TAKT',
      APP_URL: 'https://takt.local',
    });

    expect(config.from).toBe('env-sender@takt.tn');
  });

  it('ni SMTP_FROM ni SMTP_FROM_FILE donne from vide (production refuse)', () => {
    expect(() =>
      loadSmtpConfig({
        NODE_ENV: 'production',
        SMTP_HOST: 'cck.rnu.tn',
        SMTP_PORT: '587',
        SMTP_SECURE: 'false',
        SMTP_USER: 'env-user',
        SMTP_PASS: 'env-pass',
        SMTP_FROM_FILE: '/nonexistent/smtp_from',
      }),
    ).toThrow('Configuration SMTP de production incomplète');
  });
});
