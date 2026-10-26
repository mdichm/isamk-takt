// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service SMTP institutionnel (L5-22)
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SmtpEmailService } from './smtp-email.service.js';

const configuration = {
  host: 'cck.rnu.tn',
  port: 587,
  secure: false,
  user: 'smtp-user',
  password: 'smtp-pass',
  from: 'notifications@takt.tn',
  fromName: 'TAKT',
  appUrl: 'https://takt.local',
  enabled: true,
};

describe('SmtpEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('construit un message minimal contenant uniquement le titre et le lien', async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: 'message-1' });
    const service = new SmtpEmailService(configuration, { sendMail });

    await service.sendNotification({
      to: 'destinataire@example.tn',
      titre: 'Nouvelle version disponible',
      lien: '/versions/123',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: { address: 'notifications@takt.tn', name: 'TAKT' },
      to: 'destinataire@example.tn',
      subject: 'Nouvelle version disponible',
      text: expect.stringContaining('https://takt.local/versions/123'),
    });
    const message = sendMail.mock.calls[0]?.[0] as { text: string };
    expect(message.text).not.toContain('charge');
    expect(message.text).not.toContain('pédagog');
  });

  it('refuse un lien externe au domaine de l’application', async () => {
    const sendMail = vi.fn();
    const service = new SmtpEmailService(configuration, { sendMail });

    await expect(
      service.sendNotification({
        to: 'destinataire@example.tn',
        titre: 'Titre',
        lien: 'https://site-externe.example/collecte',
      }),
    ).rejects.toThrow('Lien de notification invalide');
    expect(sendMail).not.toHaveBeenCalled();
  });
});
