#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# install.sh — Installe le skill agent « fet-cl » (SKILL.md) dans les
# répertoires de skills utilisés par les agents IA du dépôt
# (Cline / Claude Code / Cursor / Devin).
#
# Usage :
#   bash docs/tools/skills/fet-cl/install.sh            # racine auto-détectée
#   bash docs/tools/skills/fet-cl/install.sh <racine>   # racine explicite
#
# Les répertoires agents (.agents/, .claude/, .cursor/, .devin/) sont
# volontairement NON versionnés (cf. .gitignore) : ce script permet à chaque
# membre de l'équipe d'installer ou de resynchroniser le skill localement.
#
# Spécification d'origine : .github/skills/fet-cl.yaml (v1.0, fet-cl 7.11.1).
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../" && pwd)}"
SRC="$ROOT/docs/tools/skills/fet-cl/SKILL.md"

if [ ! -f "$SRC" ]; then
  echo "ERREUR : SKILL.md introuvable : $SRC" >&2
  exit 1
fi

for dir in .agents .claude .cursor .devin; do
  dest="$ROOT/$dir/skills/fet-cl"
  mkdir -p "$dest"
  cp "$SRC" "$dest/SKILL.md"
  echo "OK  : $dest/SKILL.md"
done

echo "Skill « fet-cl » installé dans les 4 répertoires agents."
