# ADR S5 – Authentification & RBAC

## Contexte
L'application TAKT nécessite une authentification stateless, sûre et extensible vers un futur SSO (LDAP/AD, OIDC). Le contrôle d'accès doit être basé sur les rôles (Administrateur, Gestionnaire, Responsable de département, Direction) et limité au périmètre département de l'utilisateur.

## Décision
- **Authentification locale** : email + mot de passe, hachage **argon2id** (paramètres par défaut OWASP).
- **Jeton d'accès** : JWT signé (RS256) durée 15 min, contient `sub`, `roles[]`, `departementId`.
- **Refresh token** : opaque, stocké en base, rotation à chaque usage, durée 7 jours, révoqué en cascade (famille).
- **Cookies** : refresh token dans cookie `HttpOnly; Secure; SameSite=Strict`.
- **Guards NestJS** :
  - `JwtAuthGuard` – validation signature, expiration, révocation via famille de refresh.
  - `RolesGuard` + décorateur `@Roles(...roles)` – vérifie que l'utilisateur possède au moins un des rôles requis *et* que son `departementId` correspond (pour les rôles départementaux).
- **Interface `AuthProvider`** – abstraction pour brancher un futur SSO sans toucher au RBAC.
- **Journal de sécurité** (`SecurityEvent`) distinct de l'audit métier, enregistre connexions, verrouillages, réutilisation de jeton, usage lien reset, MFA, exports.

## Conséquences
- Toutes les routes protégées passent par `JwtAuthGuard`; les routes à rôle passent par `RolesGuard`.
- Le refresh token n'est jamais exposé au JavaScript (cookie HttpOnly).
- La révocation en cascade empêche le replay d'un refresh compromis.
- L'architecture permet d'échanger `AuthProvider` par une implémentation OIDC/LDAP sans changer les guards.

## Références
- EX‑SEC‑01, EX‑SEC‑02, EX‑SEC‑03, EX‑SEC‑08, EX‑SEC‑09
- ST §5.1 (Authentification), §3.4.21 (Sécurité), §5.4 (Observabilité)
- Tickets L0‑31, L0‑32, L0‑33

## Statut
Accepté – implémenté et fusionné (2026‑10‑09).