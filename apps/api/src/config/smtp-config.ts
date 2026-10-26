// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Configuration SMTP institutionnelle et lecture de secrets (L5-22)
import { readFileSync } from 'node:fs';

export interface SmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  fromName: string;
  appUrl: string;
}

export type Environment = Record<string, string | undefined>;

function readSecret(env: Environment, valueKey: string, fileKey: string): string {
  const filePath = env[fileKey];
  if (filePath) {
    try {
      const content = readFileSync(filePath, 'utf8').trim();
      if (content) {
        return content;
      }
    } catch (error: unknown) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        throw error;
      }
    }
  }
  return env[valueKey]?.trim() ?? '';
}

export function loadSmtpConfig(env: Environment = process.env): SmtpConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const host = env.SMTP_HOST?.trim() || 'cck.rnu.tn';
  const port = Number.parseInt(env.SMTP_PORT ?? '587', 10);
  const secure = env.SMTP_SECURE === 'true';
  const user = readSecret(env, 'SMTP_USER', 'SMTP_USER_FILE');
  const password = readSecret(env, 'SMTP_PASS', 'SMTP_PASS_FILE');
  const from = readSecret(env, 'SMTP_FROM', 'SMTP_FROM_FILE');
  const fromName = env.SMTP_FROM_NAME?.trim() ?? 'TAKT';
  const appUrl = (env.APP_URL?.trim() ?? 'http://localhost:3000').replace(/\/$/, '');

  if (nodeEnv === 'production' && (!host || !Number.isFinite(port) || !user || !password || !from)) {
    throw new Error('Configuration SMTP de production incomplète');
  }

  return {
    enabled: nodeEnv !== 'development',
    host,
    port,
    secure,
    user,
    password,
    from,
    fromName,
    appUrl,
  };
}
