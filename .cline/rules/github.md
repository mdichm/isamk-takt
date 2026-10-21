# Git, GitHub and CI workflow rules

Apply these rules to every task involving Git, GitHub, pull requests or CI.

The developer works from **two computers**, alternately or at the same time. The GitHub remote is the only source of truth: never assume a local clone is up to date, and never leave meaningful work on one computer only. Commands assume bash on Ubuntu (`python3`, `gh`, `pnpm`). If a command, credential or decision is missing, ask instead of guessing.

## 1. Session start (every task, on every computer)

```bash
git fetch --prune
git status -sb
git stash list
git branch -r
gh pr list --state open --json number,headRefName,isDraft,title
hostname
```

- On `main`: `git pull --ff-only`. If it fails, local `main` has unexpected commits: stop and report.
- On a ticket branch: `git pull --rebase origin <branch>`.
- Dirty working tree: do not pull. Commit it on the right branch (WIP), or stop and ask. Never discard changes without approval.
- Stashes exist on one computer only. If `git stash list` is not empty, report it to the user; never pop or drop it on your own.

## 2. One active computer per ticket (claim protocol)

A ticket is **claimed** by a remote branch plus a draft PR. The `En cours` status in `tickets_data.py` only reaches `main` when the PR is merged, so never use it to detect ownership.

Before starting ticket `<ID>` (example `L1-21`):

1. Run `git fetch --prune`, then look for an existing claim:
   `git branch -r --list "*<id-lowercase>*"` and `gh pr list --state open --search "<ID>"`.
   If a branch or PR exists, continue it (section 1) only if it was started from this computer or the user approves. Otherwise stop and ask.
2. Branch from fresh main: `git switch -c feat/<id-lowercase>-<slug> origin/main` (`fix/...` for bug fixes). Example: `feat/l1-21-grille-ui`.
3. Set the ticket to `En cours` in `docs/tools/tickets_data.py`, regenerate artifacts (section 5), commit `docs: mark <ID> En cours`.
4. Push at once and open a draft PR. This is the claim and costs no CI run.

```bash
git push -u origin <branch>
gh pr create --draft --title "feat(<id>): <title>" --body "Claimed by $(hostname). In progress."
```

5. Implement on the same branch.

**Switching computers**: commit (`wip: <ID> ...`), push, run the checklist of section 4, add a PR comment (`gh pr comment <n> --body "Handoff: $(hostname) -> other computer"`). On the other computer, run section 1, then continue. Never edit the same ticket on both computers at once.

## 3. Branches and commits

- Never commit directly to `main`. Every ticket has its own branch (`feat/<id>-<slug>` or `fix/<id>-<slug>`).
- Conventional Commits in English, imperative and concise: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `ci:`.
- One logical change per commit. Inspect first: `git status`, `git diff`, `git diff --staged`.
- Never commit secrets, `.env` files, generated binaries, editor state or temporary files.
- Prisma migrations (`packages/db/prisma/migrations/`) are committed together with the schema change. No untracked file may remain at the end of a session.

## 4. End of session or before switching computer

```bash
git status --porcelain   # must be empty
git stash list           # must be empty, otherwise report it
git log @{u}..           # must be empty: everything is pushed
```

If one of them is not empty, commit a WIP commit and push, or ask the user.

## 5. Generated backlog artifacts

Never edit by hand: `dist/Backlog_TAKT_tickets.csv`, `dist/Backlog_TAKT.xlsx`, `dist/tools/correspondance_tickets.json`, `dist/VELOCITE.md`, `dist/TRACABILITE_TAKT.md`.
Source of truth: `docs/tools/tickets_data.py` (statuses: `À faire`, `En cours`, `Terminé`).

```bash
python3 docs/tools/build_backlog.py && python3 docs/tools/verifier_coherence.py && python3 docs/tools/velocity_tracker.py
```

- Regenerate only twice per ticket: at the claim (`En cours`) and in the last commit before `gh pr ready` (`Terminé`), always after syncing with `main` (section 7). Les artefacts sont écrits dans `dist/` (non versionné, ignoré par Git) — ne pas les committer.
- Conflict on these files: resolve `tickets_data.py` first (keep every ticket's status), regenerate. Never merge the XLSX by hand: regenerate it (its bytes differ at every run, so a diff on it is meaningless).

## 6. Pull requests, validation and push policy

- One PR per ticket. Create it as a **draft** at the claim (section 2). Pushes to a draft or to a branch without a PR run no CI, so WIP pushes are free.
- CI starts from a clean checkout. Before marking the PR ready, run locally and fix every failure:

```bash
pnpm install --frozen-lockfile
pnpm validate && pnpm test                      # lint, typecheck, build, unit tests
(cd apps/api && pnpm db:generate && pnpm test:integration)   # if api, db or packages changed (needs Docker)
```

- Then: set `Terminé` (section 5), push, mark the PR ready, watch CI:

```bash
gh pr ready
gh pr checks --watch
```

- CI runs when the PR becomes ready and on every later push (superseded runs are cancelled). Do not push code known to break CI. Fixes after review are small, focused pushes.
- PR body: context, changes, tests performed, documentation and backlog updates, follow-ups.
- Do not merge, and do not enable auto-merge, unless the user asks. The repository uses merge commits.
- If remote CI fails: `gh run view <run-id> --log-failed`, find the root cause, apply the smallest safe fix (`fix:` or `ci:`), push, re-check.

## 7. Syncing with main (no force-push)

Default: merge, do not rebase.

```bash
git fetch --prune
git merge origin/main
```

Resolve conflicts by understanding both sides and keeping the latest valid logic. Explain the resolution to the user before committing. Never pick "ours" or "theirs" blindly. Generated files follow section 5.

Rebase only if the user asks. It rewrites history, so it needs `git push --force-with-lease` (never `--force`) with approval, and the other computer must then be checked for unpushed work before it resets its copy.

## 8. CI (`.github/workflows/ci.yml`)

Keep this design when editing the workflow:

- Pull requests to `main` run CI, except drafts (`ready_for_review` is a trigger). Pushes to `main` (docs-only pushes ignored) and `v*` tags run CI, then image build and dev deployment. A branch push without a PR runs nothing.
- Job `changes` classifies the PR's files: docs-only PRs skip build and tests, integration tests run only when `apps/api` or `packages/` change, Docker builds only when Dockerfiles, `infra/` or the lockfile change.
- **`CI gate` is the only required status check.** Never require individual jobs: path filtering would leave them pending.
- Security scans (`pnpm audit`, Trivy) run on PRs and on `main`. On `main` and tags, image builds run in parallel with validation and push only immutable tags (`sha-xxxxxxx`, semver); `latest` and `main` are moved by `deploy-dev` after every check is green. Never add a step that moves `latest` before validation.
- `concurrency` cancels superseded PR runs; `main` runs queue; deployment is serialized.
- `permissions: contents: read` at workflow level; widen per job only when needed. Set `timeout-minutes` on every job.
- Official actions (`actions/*`, `docker/*`, `github/*`) use a major tag. Any other third-party action is pinned to a full commit SHA with a version comment. Never use `@master`, `@main` or `@latest`. Dependabot keeps them current.
- The Node version lives only in `.github/actions/setup-node-pnpm/action.yml`; keep it aligned with `engines` in `package.json`.
- When dependencies, scripts, runtime versions or Dockerfiles change, update CI in the same PR.
- Never expose secrets, widen permissions or disable a check without explicit approval. After any workflow change, summarize the permission changes for the user.

## 9. Repository settings (verify, never change)

Expected on `main` (configured by the user in GitHub): pull request required with 0 approvals, required check `CI gate`, force-push and deletion blocked, merge commits allowed, "Automatically delete head branches" on.

```bash
gh api repos/{owner}/{repo}/rulesets
gh repo view --json deleteBranchOnMerge
```

Report any difference. Do not edit repository settings, rulesets or secrets.

## 10. Both computers must match

```bash
git config user.name; git config user.email; gh auth status; node -v; pnpm -v
```

- Same `user.name` and `user.email` on both computers.
- Expected git config on both: `pull.rebase true`, `fetch.prune true`, `push.autoSetupRemote true`, `rerere.enabled true`.
- Same Node major and the same pnpm version (`packageManager` in `package.json`).
- Authenticate with `gh` (keyring); never store tokens in plain text. If authentication or identity is missing, ask.
- These rules live in the repository, so both computers read the same version.

## 11. Safety

Ask the user before any of these: `git reset --hard`, `git push --force-with-lease`, `git clean`, `git stash pop` or `drop`, deleting a branch that is not listed in section 12, discarding changes, major dependency upgrades, changes to workflow permissions. Never force-push `main`. Never put tokens, passwords or private URLs in commits, PR text, logs or workflow files.

## 12. Cleanup after merge

Remote branches are deleted by GitHub on merge. Locally, on a clean tree:

```bash
git fetch --prune
git for-each-ref --format='%(refname:short) %(upstream:track)' refs/heads | awk '$2=="[gone]" {print $1}'
```

Delete each listed branch with `git branch -d <branch>`. This refuses unmerged work; if it refuses, ask. Never delete the current branch or `main`, and never delete a branch that has unpushed commits. Do this on both computers.
