// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Décorateur marquant un handler comme générateur d'événement de sécurité.
// Le type d'événement est lu par SecurityEventInterceptor via Reflector.

import { SetMetadata } from '@nestjs/common';

export const SECURITY_EVENT_KEY = 'security_event';

/**
 * Marque une méthode de contrôleur comme génératrice d'un événement de sécurité.
 * L'interceptor SecurityEventInterceptor lira cette métadonnée pour enregistrer
 * l'événement (type, userId, ip, userAgent, timestamp, détails).
 *
 * @param type Type de l'événement de sécurité (ex: 'LOGIN_SUCCESS', 'MFA_ENABLE')
 */
export const SecurityEvent = (type: string) => SetMetadata(SECURITY_EVENT_KEY, type);
