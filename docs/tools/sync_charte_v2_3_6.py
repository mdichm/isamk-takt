# -*- coding: utf-8 -*-
"""Synchronise la documentation TAKT avec le package de charte V2.3.6 (DL-032).

Usage (depuis la racine du dépôt) : py -3 docs/tools/sync_charte_v2_3_6.py
Idempotent : peut être relancé sans effet de bord.

Corrections appliquées :
  1. tickets_data.py   : ticket « tokens » (L0-05) aligné sur la V2.3.6 (Black Ops One, clés d'état = codes API)
  2. SF_TAKT.md        : EX-NFR-10 (police de marque) et ajout de DL-032
  3. ETAT_PROJET_TAKT  : chemins V2_2 -> V2_3_6, tableau cassé, chantier de design mis à jour
  4. Tokens JSON       : blocs dupliqués supprimés, chemin du token exempté, source_of_truth, change_log
  5. Icônes SVG        : suppression de role="img" (contradictoire avec aria-hidden="true")
"""
import json
import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parents[1]                      # <racine>/docs
PKG = DOCS / "design" / "TAKT_Package_V2_3_6"
TOKENS = PKG / "02_Design_System" / "TAKT_design_tokens_v2_3_6.json"
ICONS = PKG / "02_Design_System" / "icons"


def read(path: Path) -> str:
    """Lit un fichier texte UTF-8 (BOM toléré)."""
    return path.read_text(encoding="utf-8-sig")


def write(path: Path, text: str) -> None:
    """Écrit en UTF-8 sans BOM, fins de ligne LF."""
    path.write_text(text, encoding="utf-8", newline="\n")


def log(status: str, message: str) -> None:
    print(f"[{status:<6}] {message}")


def fail(message: str) -> None:
    log("ERREUR", message)
    sys.exit(1)


# --------------------------------------------------------------------------- 1. ticket tokens
NEW_TICKET_TOKENS = '''t("tokens","L0",E,T,"Intégration des tokens de conception",
  "Paquet design-tokens : génération des variables CSS depuis TAKT_design_tokens_v2_3_6.json (charte V2.3.6, clés d'état = codes API), configuration Tailwind, polices Sora, Inter et Black Ops One auto-hébergées, logo maître SVG, icônes métier SVG.",
  ["Les couleurs de l'interface proviennent exclusivement des variables CSS générées, sans valeur hexadécimale en dur hors du paquet",
   "Aucune requête réseau externe pour les polices",
   "Black Ops One n'est utilisée que pour la signature de marque « TAKT » ; le logo est toujours le SVG maître, jamais reconstruit en texte",
   "OFL-Black-Ops-One.txt est conservé avec la police dans le dépôt et dans l'image web",
   "Les couleurs d'état sont lues uniquement depuis states.*.*.text (texte) et states.*.*.color (icône, bordure) ; le lint interdit color en texte",
   "Le contraste texte 4,5:1 et composant 3:1 est vérifié sur Ivory, Warm, Inset, Card et Elevated ; seul color.navigation_on_deep.text_disabled est exempté ; le build échoue en cas d'écart",
   "Les icônes d'état référencées par les tokens existent dans lucide-react (version épinglée) ou dans le dossier icons/ ; un test échoue sinon"],
  "EX-NFR-10","§0.1","FRONT","Must",5,["repo"])'''


def patch_ticket_tokens() -> None:
    """Remplace le bloc du ticket « tokens » : de `t("tokens"` jusqu'au prochain ticket ou à la prochaine ligne `E = `."""
    path = DOCS / "tools" / "tickets_data.py"
    text = read(path)
    if "TAKT_design_tokens_v2_3_6.json" in text:
        return log("SKIP", "tickets_data.py : ticket tokens déjà à jour")
    # Ancrage sur le début de ligne et la clé : indépendant du contenu exact du ticket.
    pattern = re.compile(r'^t\("tokens",.*?(?=^E = |^t\(|\Z)', re.DOTALL | re.MULTILINE)
    matches = pattern.findall(text)
    if len(matches) != 1:
        fail(f'tickets_data.py : {len(matches)} bloc(s) « tokens » trouvé(s), 1 attendu')
    # Le bloc capturé se termine avant la ligne suivante : on rétablit le saut de ligne final.
    new_text = pattern.sub(lambda _m: NEW_TICKET_TOKENS + "\n", text, count=1)
    write(path, new_text)
    log("OK", "tickets_data.py : ticket tokens mis à jour")


# --------------------------------------------------------------------------- 2. SF
DL_032 = (
    "| DL-032 | 2026-10-04 | Mise à jour de la charte (package V2.3.6) : police de marque et clés d'état "
    "| Charte V2.3.6 retenue ; Black Ops One (licence OFL) remplace Stencilia-A pour la signature de marque ; "
    "tokens V2.3.6 comme source unique, clés d'état alignées sur les codes API ; DL-031 reste valable pour le reste "
    "| EX-NFR-10 | À renseigner |"
)


def patch_sf() -> None:
    path = DOCS / "SF_TAKT.md"
    text = read(path)
    changed = False
    if "composé en Stencilia-A" in text:
        text = text.replace("composé en Stencilia-A", "composé en Black Ops One (licence OFL)")
        changed = True
    if "| DL-032 |" not in text:
        text, count = re.subn(
            r"^(\| DL-031 \|.*)$", lambda m: m.group(1) + "\n" + DL_032, text, count=1, flags=re.MULTILINE
        )
        if count != 1:
            fail("SF_TAKT.md : ligne DL-031 introuvable")
        changed = True
    if changed:
        write(path, text)
        log("OK", "SF_TAKT.md : EX-NFR-10 corrigée, DL-032 ajouté")
    else:
        log("SKIP", "SF_TAKT.md : déjà à jour")


# --------------------------------------------------------------------------- 3. ETAT_PROJET
ETAT_ITEM_3 = (
    "3. **Chantier de design** (hors ST, tokens en v2.3.6) : la charte V2.3.6 est intégrée comme source "
    "(tokens, logo, Black Ops One sous licence OFL). Restent à faire : revue du Design System UI et de la charte "
    "à partir des `.docx` du package, génération des variables CSS et test de contraste (ticket « Intégration des "
    "tokens de conception »), vérification des noms d'icônes contre `lucide-react`."
)


def patch_etat() -> None:
    path = DOCS / "ETAT_PROJET_TAKT.md"
    text = read(path)
    original = text
    text = re.sub(r"^3\. \*\*Chantier de design\*\*.*$", lambda _m: ETAT_ITEM_3, text, count=1, flags=re.MULTILINE)
    text = text.replace(") || `tools/`", ") |\n| `tools/`")                 # ligne de tableau cassée
    text = text.replace("DL-001 à DL-030", "DL-001 à DL-032")
    for old, new in (("V2_2", "V2_3_6"), ("v2_2", "v2_3_6"), ("V2.2", "V2.3.6")):
        text = text.replace(old, new)
    if text == original:
        return log("SKIP", "ETAT_PROJET_TAKT.md : déjà à jour")
    write(path, text)
    log("OK", "ETAT_PROJET_TAKT.md : chemins, tableau et chantier de design corrigés")


# --------------------------------------------------------------------------- 4. tokens JSON
def patch_tokens() -> None:
    data = json.loads(read(TOKENS))
    changes = []

    # 4.1 Blocs dupliqués à la racine : la source canonique est states.* (clés = codes API)
    for key in ("lock", "constraint", "origin", "warning_acceptance"):
        if key in data:
            if key not in data.get("states", {}):
                fail(f"tokens : states.{key} absent, suppression du bloc racine « {key} » refusée")
            del data[key]
            changes.append(f"bloc racine « {key} » supprimé (states.{key} fait foi)")

    # 4.2 Chemin réel du token exempté du test de contraste
    dumped = json.dumps(data, ensure_ascii=False, indent=2)
    old_path, new_path = "color.navigation.text_disabled", "color.navigation_on_deep.text_disabled"
    if old_path in dumped:
        dumped = dumped.replace(old_path, new_path)
        changes.append(f"exemption corrigée : {old_path} -> {new_path}")
    data = json.loads(dumped)

    # 4.3 Source de vérité et migration
    source = data["source_of_truth"]
    expected_file = "02_Design_System/TAKT_design_tokens_v2_3_6.json"
    expected_migration = (
        "Cette V2.3.6 remplace la V2.3.5. Les .docx/.pdf doivent être synchronisés séparément "
        "avec ce JSON dans le package."
    )
    if source.get("file") != expected_file or source.get("migration") != expected_migration:
        source["file"], source["migration"] = expected_file, expected_migration
        changes.append("source_of_truth aligné sur la V2.3.6")

    # 4.4 Trace du correctif local dans le change_log
    if not any(entry.get("version") == "2.3.6-takt1" for entry in data["change_log"]):
        data["change_log"].append(
            {
                "version": "2.3.6-takt1",
                "changes": [
                    "Suppression des blocs racine lock, constraint, origin et warning_acceptance (doublons de states.*).",
                    "Exemption du test de contraste : color.navigation_on_deep.text_disabled.",
                    "source_of_truth.file et migration alignés sur la V2.3.6.",
                ],
                "notes": [
                    "Correctif local TAKT à reporter dans le package officiel.",
                    "Les principes de lock et de constraint (ex-blocs racine) restent portés par states.*.usage.",
                ],
            }
        )
        changes.append("entrée 2.3.6-takt1 ajoutée au change_log")

    if not changes:
        return log("SKIP", "tokens JSON : déjà à jour")
    write(TOKENS, json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    for change in changes:
        log("OK", f"tokens JSON : {change}")


# --------------------------------------------------------------------------- 5. icônes
def patch_icons() -> None:
    touched = 0
    for svg in sorted(ICONS.glob("*.svg")):
        text = read(svg)
        new_text = text.replace(' role="img" aria-hidden="true"', ' aria-hidden="true"')
        if new_text != text:
            write(svg, new_text)
            touched += 1
    log("OK" if touched else "SKIP", f"icônes SVG : {touched} fichier(s) corrigé(s)")


if __name__ == "__main__":
    for required in (TOKENS, ICONS):
        if not required.exists():
            fail(f"introuvable : {required} (lancer depuis la racine du dépôt)")
    patch_ticket_tokens()
    patch_sf()
    patch_etat()
    patch_tokens()
    patch_icons()
    print("\nSuite : py -3 docs/tools/build_backlog.py puis py -3 docs/tools/verifier_coherence.py")