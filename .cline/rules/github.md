# Git, GitHub, and Continuous Integration (CI) Workflow Rules

You have access to the terminal to run commands. Follow these strict rules for every code modification, repository management task, and workflow update.

## 1. Branch Management
- **Never commit directly** to the `main` or `master` branch unless explicitly instructed by the user.
- **Always create a feature branch** for new tasks using the naming convention: `feat/short-description` or `fix/issue-description`.
- Every new ticket must have it's own branch.
- **Update ticket status to "En cours":** Before creating a feature branch for a new ticket, change the ticket status from `"À faire"` to `"En cours"` in `docs/tools/tickets_data.py`. Regenerate backlog artifacts (`python3 docs/tools/build_backlog.py`, `python3 docs/tools/verifier_coherence.py`, `python3 docs/tools/velocity_tracker.py`), commit the change, then create the branch and start implementation.

## 2. Commit Guidelines
- **Run tests and linters** before committing to ensure the build is not broken.
- **Write atomic commits** representing one logical change per commit.
- **Use the Conventional Commits specification** for all commit messages:
  - `feat: add [feature description]`
  - `fix: resolve [bug description]`
  - `docs: update [documentation]`
  - `style: fix formatting`
  - `refactor: [code changes without features/fixes]`
  - `ci: update workflow or CI configuration`
- **Language:** Keep commit messages concise, imperative, and in English.

## 3. GitHub and Pull Requests via GitHub CLI (`gh`)
You must use the GitHub CLI (`gh`) for all GitHub interactions.

- **Authentication Check:** Ensure you are authenticated with `gh auth status` before performing remote operations.
- **Push and Pull Request:** After completing a task and committing changes, push the branch and **automatically create a Pull Request** using `gh pr create`. 
- **PR Configuration:** Always create it as a Draft (`--draft`) if work is ongoing, or standard if ready. Provide a clear, structured title and markdown description detailing the changes.
- **Fallback:** Only if `gh` is completely unavailable on the system, fallback to standard `git push` and explicitly ask the user to create the PR manually.

### Un seul push par ticket

- **Commitez tout en local avant de pousser** : implémentation, tests, documentation, mise à jour du backlog et de la vélocité doivent tous être committés en local avant le premier `git push`.
- **Un seul `git push -u origin <branche>` par ticket** : chaque push sur la branche d'une Pull Request ouverte déclenche un nouveau run de CI. Évitez les pushes intermédiaires.
- **Créez la PR uniquement après le push final** avec `gh pr create`.
- Si des corrections sont nécessaires après revue, un push supplémentaire est inévitable — mais il doit rester exceptionnel.

## 4. Conflict Resolution
- **Analyze and resolve:** If a merge conflict occurs, analyze the conflicting files, resolve the issues keeping the latest valid logic.
- **Communicate:** Explain the resolution to the user clearly before finalizing the commit.

## 5. Continuous Integration (CI) Rules
You must systematically ensure that the project has a functional and up-to-date CI workflow via GitHub Actions.

### Required Triggers
- The workflow must trigger on every `push` and `pull_request` targeting the main branches (`main`, `master`, `develop`).

### Mandatory Workflow Steps (`.github/workflows/ci.yml`)
1. **Code Validation:** Code linter and formatting checks (e.g., ESLint, Prettier, Black, Flake8, depending on the project language).
2. **Unit Tests:** Execution of the project's test suite with coverage/reporting if applicable.
3. **Build Check:** Verification that the project compiles, builds, or bundles successfully without errors.

### Cline Behavior & Constraints
- **Proactive Verification:** Before closing any complex task, verify if the `.github/workflows/ci.yml` file exists. If it is missing or incomplete, immediately propose to create or update it.
- **Version Alignment:** Ensure that the runtime versions (Node.js, Python, Ruby, Go, etc.) configured in the CI match exactly with the project's configuration files (`package.json`, `runtime.txt`, `.nvmrc`, etc.).
- **Safe Modifications:** Never push changes that risk breaking the CI pipeline. If you modify a dependency, a script, or a build tool, update the CI workflow accordingly.

## 6. End-of-Ticket Workflow

At the end of each ticket, perform the following steps in order **only after the implementation is complete and validated**.

### 6.1 Validate locally

1. Read `.github/workflows/ci.yml`.
2. Run the same essential commands locally: lint, typecheck, tests, and build.
3. Fix all failures locally before pushing.
4. Do not push code known to break CI.

### 6.2 Update documentation

- Update documentation affected by the ticket, including:
  - Features or user workflows
  - APIs or endpoints
  - Environment variables
  - Configuration
  - Commands, scripts, or setup steps
  - Architecture or data model

- Relevant files may include `README.md`, architecture docs, OpenAPI specs, `.env.example`, and inline JSDoc/Docstrings.
- Include documentation changes in the same atomic commit as the related code change, or use a separate `docs: ...` commit when appropriate.

### 6.3 Update the backlog (mark ticket as Terminé)

After implementation is complete, update the ticket status and regenerate backlog artifacts:

**Step 1: Update ticket status in source data**
```bash
# Edit docs/tools/tickets_data.py
# Find the ticket by key (e.g., "repo") and change:
# statut="À faire"  →  statut="Terminé"
```

**Step 2: Regenerate backlog artifacts & validate**
```bash
python3 docs/tools/build_backlog.py
python3 docs/tools/verifier_coherence.py
```

**Step 3: Update velocity**
```bash
python3 docs/tools/velocity_tracker.py
```

**Step 4: Commit all generated files**
```bash
git add docs/Backlog_TAKT_tickets.csv docs/Backlog_TAKT.xlsx docs/tools/correspondance_tickets.json docs/VELOCITE.md
git commit -m "docs: update backlog & velocity (ticket <TICKET-ID> → Terminé)"
```

### 6.4 Update velocity

- Après chaque modification de statut de ticket dans le backlog, régénérer la vélocité via le script de flux continu :
  ```bash
  python3 docs/tools/velocity_tracker.py
  ```
  Le script lit `docs/Backlog_TAKT_tickets.csv` et met à jour `docs/VELOCITE.md` avec le débit continu, la prévision Monte Carlo P50/P85/P95 et les KPIs.
- Sum the story points of tickets whose status is **“Terminé”** in the *Lots* sheet of `Backlog_TAKT.xlsx` remains as validation.
- Record the total in the current sprint velocity tracker, such as `docs/velocity.md` or the sprint’s velocity field.
- If backlog or velocity files changed, commit:

  ```bash
  git add docs/VELOCITE.md
  git commit -m "docs: update backlog & velocity"
  ```

### 6.5 Push and create the pull request

After local validation, documentation, backlog, and velocity updates are complete:

1. **Un seul push** : assurez-vous que tous les commits (code, tests, documentation, backlog, vélocité) sont déjà faits en local, puis poussez une seule fois :

   ```bash
   git push -u origin <branch-name>
   ```

   Chaque push sur la branche d'une Pull Request ouverte déclenche un nouveau run de CI. Évitez les pushes intermédiaires.

2. Create a pull request with `gh pr create`.
3. Use a clear conventional title, for example: `feat: add document transfer workflow`.
4. Provide a Markdown description including:
   - Context
   - Changes
   - Testing performed
   - Documentation and backlog updates
   - Follow-ups, if any
5. Create a **draft PR** if work remains incomplete.
6. Mark it ready for review only when implementation, tests, documentation, backlog, velocity, and CI are complete.

### 6.6 Monitor CI

- After pushing and creating the PR, monitor CI using:

  ```bash
  gh pr checks
  ```

  or:

  ```bash
  gh run watch
  ```

- Do not consider the ticket complete until all required CI checks pass.
- If remote CI fails:
  1. Treat it as a blocking issue.
  2. Inspect failed logs:

     ```bash
     gh run view <run-id> --log-failed
     ```

  3. Identify the root cause.
  4. Apply the smallest safe fix.
  5. Commit with `fix: ...` or `ci: ...`.
  6. Push the correction and re-check CI.

## 7. Safety Rules

- Ask before destructive operations: `git reset --hard`, `git push --force`, branch deletion, dependency major upgrades, or changes to protected files.
- Never force-push to `main`, `master`, or `develop`.
- Never expose tokens, passwords, or private URLs in commits, PR descriptions, logs, or documentation.

- If a required command, credential, or project context is missing, ask the user instead of guessing.

## 8. Cleanup of merged branches

- Regularly delete local and remote branches that have been merged into `main` (or `develop`) to keep the repository clean.
- To list merged branches locally:  
  ```bash
  git branch --merged main
  ```
- To delete them locally (excluding `main`, `develop`, and current branch):  
  ```bash
  git branch --merged main | grep -v '\\*\\|main\\|develop' | xargs -n 1 git branch -d
  ```
- To delete remote merged branches (if you have permission):  
  ```bash
  git fetch -p && git branch -r --merged origin/main | sed 's/   origin\\///' | grep -v 'main$|develop$' | xargs -n 1 git push origin --delete
  ```
- Alternatively, enable **Automatic branch deletion** in the repository settings (Settings → General → Pull requests → “Automatically delete head branches”).
