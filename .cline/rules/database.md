---
paths:
  - "prisma/**"
  - "src/**/*.repository.ts"
---
# Persistance & Gestion de la Base de Données

## Stack Technique Obligatoire
* **Moteur :** PostgreSQL 16.
* **ORM :** Prisma ORM 6.x.

## Règles de Migration & Performance
* **Modélisation :** Déclarer les relations et index de manière explicite dans le fichier `schema.prisma`.
* **Contraintes avancées :** Pour les contraintes complexes, déclencheurs (triggers) ou optimisations spécifiques impossibles en Prisma natif, utiliser obligatoirement des migrations SQL brutes personnalisées (`prisma migrate dev --create-only`).
* **Requêtes :** 
  * Éviter les `include` profonds qui génèrent des jointures SQL massives. Privilégier des requêtes ciblées ou l'utilisation de `select`.
  * Toujours paginer les requêtes retournant des listes.
