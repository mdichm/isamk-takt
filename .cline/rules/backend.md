---
paths:
  - "apps/backend/**"
  - "src/**/*.controller.ts"
  - "src/**/*.service.ts"
  - "src/**/*.module.ts"
---
# Architecture & Standards Backend

## Stack Technique Obligatoire
* **Runtime :** Node.js 24 LTS.
* **Framework :** NestJS 10+.
* **Architecture :** Monolithe modulaire strict. Chaque domaine doit être isolé dans son propre module.
* **Documentation :** OpenAPI généré automatiquement via le plugin ou les décorateurs `@nestjs/swagger`.

## Règles de Code & Sécurité
* **Validation :** Tout endpoint (`@Body()`, `@Query()`, `@Param()`) doit posséder un DTO fortement typé avec validation stricte via `class-validator`.
* **Typage :** Mode TypeScript strict. Déclarer explicitement le type de retour de toutes les méthodes des contrôleurs et services.
* **OpenAPI :** Chaque endpoint public doit documenter ses réponses (`@ApiResponse`, `@ApiOperation`) et structures pour garantir la fiabilité du client généré.
* **Gestion des erreurs :** Utiliser exclusivement les exceptions natives de NestJS (`HttpException`, `BadRequestException`, etc.). Ne jamais laisser une promesse rejetée non gérée.
