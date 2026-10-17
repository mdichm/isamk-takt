# TAKT — ISAMK Scheduling Application

Monorepo TypeScript pour l'application de planification ISAMK.

## 📋 Description

TAKT est une application de planification et d'ordonnancement conçue pour ISAMK. Le projet est organisé en monorepo avec Turbo, pnpm et TypeScript strict.

## 🛠 Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Runtime | Node.js | 24 LTS |
| Backend | NestJS | 10+ |
| Frontend | Next.js | 15 (App Router) |
| Base de données | PostgreSQL | 16 |
| ORM | Prisma | 7.x |
| Gestion de paquets | pnpm | 9.x |
| Build system | Turbo | 2.x |
| Tests | Vitest | 4.x |
| Licence | GNU AGPL v3 | |

## 📁 Structure du dépôt

```
apps/
  api/          # API NestJS (backend)
  web/          # Application Next.js (frontend)
  worker/       # Worker de tâches
packages/
  db/           # Client Prisma et schéma
  contracts/    # Schémas Zod et contrats d'API
  design-tokens/| # Tokens de design
  engine-fet/   # Moteur de planification
  charge-engine/# Moteur de charge
  conflict-engine/| # Moteur de conflit
docs/           # Documentation (backlog, traçabilité, etc.)
infra/          # Déploiement et variables d'environnement d'exemple
```

## 🚀 Installation

### Prérequis

- Node.js >= 24.0.0
- pnpm >= 9.0.0
- PostgreSQL 16

### Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/mdichm/isamk-takt.git
cd isamk-takt

# Installer les dépendances
pnpm install

# Générer le client Prisma
pnpm db:generate

# Configurer les variables d'environnement
cp infra/.env.example apps/api/.env
# Éditer apps/api/.env avec vos propres valeurs

# Lancer en développement
pnpm dev
```

### Scripts disponibles

| Script | Description |
|--------|-------------|
| `pnpm dev` | Lance tous les services en développement |
| `pnpm build` | Construit tous les packages |
| `pnpm lint` | Vérifie le code (ESLint / oxlint) |
| `pnpm typecheck` | Vérifie les types TypeScript |
| `pnpm test` | Lance les tests unitaires |
| `pnpm validate` | Lint + typecheck + build |
| `pnpm db:generate` | Génère le client Prisma |
| `pnpm db:migrate` | Applique les migrations Prisma |
| `pnpm db:push` | Pousse le schéma Prisma vers la DB |
| `pnpm db:studio` | Ouvre Prisma Studio |

## 🔐 Variables d'environnement

Copiez `infra/.env.example` vers `apps/api/.env` et adaptez les valeurs :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/takt"
JWT_SECRET="votre-secret-jwt"
JWT_EXPIRATION="15m"
REFRESH_TOKEN_EXPIRATION="7d"
PORT=3000
NODE_ENV=development
```

> **⚠️ Sécurité :** Le fichier `.env` ne doit jamais être commit. Il est déjà inclus dans `.gitignore`.

## 📖 Documentation API

La documentation OpenAPI est générée automatiquement par le backend NestJS via Swagger. Une fois le serveur démarré, elle est accessible sur :

```
http://localhost:3000/api
```

## 📄 Licence

Ce projet est sous licence **GNU Affero General Public License v3**. Consultez le fichier [LICENSE](./LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues. Ouvrez une issue ou une pull request sur GitHub.