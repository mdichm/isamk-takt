#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
# Vérifie l'empreinte SHA256 du binaire FET 7.12.0 contre la référence.
# Usage : ./verify-fet-fingerprint.sh [url] [reference-file]
# Exit 0 si l'empreinte correspond, exit 1 sinon.
# Si le fichier de référence contient "PLACEHOLDER", le hash calculé est
# affiché pour permettre sa mise à jour, puis le script échoue (exit 1).

set -euo pipefail

FETCH_URL="${1:-https://lalescu.ro/liviu/fet/download/bin/fet-7.12.0-bin.tar.xz}"
REFERENCE_FILE="${2:-docs/fet-fingerprint.sha256}"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

echo "Téléchargement du binaire FET depuis $FETCH_URL..."
curl -sL --retry 3 --retry-delay 5 --connect-timeout 30 --max-time 300 \
  "$FETCH_URL" -o "$WORK_DIR/fet-bin.tar.xz"

echo "Extraction du binaire fet-cl..."
tar -xf "$WORK_DIR/fet-bin.tar.xz" -C "$WORK_DIR"

# Trouver le binaire fet-cl dans l'archive extraite
FET_BINARY="$(find "$WORK_DIR" -name 'fet-cl' -type f | head -1)"
if [ -z "$FET_BINARY" ]; then
  echo "ERREUR : binaire fet-cl introuvable dans l'archive" >&2
  exit 1
fi

ACTUAL_SHA="$(sha256sum "$FET_BINARY" | awk '{print $1}')"
echo "Empreinte calculée : $ACTUAL_SHA"

# Lire l'empreinte de référence (première colonne de la première ligne non commentée)
REFERENCE_SHA="$(grep -v '^\s*#' "$REFERENCE_FILE" | awk '{print $1}' | head -1)"
echo "Empreinte de référence : $REFERENCE_SHA"

if [ "$REFERENCE_SHA" = "PLACEHOLDER_SHA256" ]; then
  echo ""
  echo "ATTENTION : l'empreinte de référence est un placeholder."
  echo "Mettez à jour $REFERENCE_FILE avec la valeur suivante :"
  echo "  $ACTUAL_SHA  fet-cl"
  echo ""
  exit 1
fi

if [ "$ACTUAL_SHA" = "$REFERENCE_SHA" ]; then
  echo "OK : empreinte FET correspondante."
  exit 0
else
  echo "ERREUR : empreinte FET différente ! Build du worker bloqué." >&2
  exit 1
fi
