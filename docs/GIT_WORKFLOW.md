# Git & CI Workflow — TAKT

Ce document résume les règles de workflow Git et CI à suivre pour chaque ticket. L'objectif est d'éviter les lancements redondants de la CI (un run pour le code, un second pour la documentation) et de garantir une historial propre.

## 1. Une branche par ticket

- Ne jamais committer directement sur `main` / `master` / `develop`.
- Créer une branche dédiée : `feat/short-description` ou `fix/issue-description`.

## 2. Un seul push par ticket (évite les doubles runs de CI)

Chaque push sur une branche de Pull Request déclenche un nouveau run de CI. Pour éviter de lancer la CI deux fois pour le même ticket (une fois pour le code, une seconde pour la documentation/backlog), suivez cet ordre :

1. **Implémentez le code et les tests** → commit local (`feat: ...`)
2. **Mettez à jour la documentation** (README, OpenAPI, `.env.example`, etc.) → commit local (`docs: ...`)
3. **Mettez à jour le backlog et la vélocité** (`tickets_data.py`, backlog, `VELOCITE.md`) → commit local (`docs: ...`)
4. **Validez localement** : lint, typecheck, tests, build
5. **Un seul `git push -u origin <branche>`** — tous les commits locaux sont poussés d'un coup
6. **Créez la PR avec `gh pr create` uniquement après ce push unique**

> ⚠️ Ne faites **pas** un push pour le code, puis un second push pour la documentation/backlog. Cela lancerait la CI deux fois pour le même ticket.

Si des corrections sont nécessaires après revue, un push supplémentaire est inévitable mais doit rester exceptionnel.

## 3. Convention de commits

Utiliser la spécification Conventional Commits, en anglais, impératif et concis :

- `feat: ...` — nouvelle fonctionnalité
- `fix: ...` — correction de bug
- `docs: ...` — documentation (README, backlog, vélocité, règles)
- `style: ...` — formatage
- `refactor: ...` — refactor sans changement de comportement
- `ci: ...` — configuration CI

## 4. Création de la Pull Request

Toujours via `gh pr create` :

```bash
gh pr create --title "feat: ..." --body-file /tmp/pr-body.md --label "enhancement"
```

- Créer en tant que **draft** (`--draft`) si le travail est en cours, sinon standard.
- Passer en "ready for review" uniquement lorsque l'implémentation, les tests, la documentation, le backlog, la vélocité et la CI sont terminés.

## 5. Suivi de la CI

Après push et création de la PR :

```bash
gh pr checks <pr-number>
# ou
gh run watch <run-id> --exit-status
```

Le ticket n'est considéré comme terminé que lorsque tous les checks CI passent.
