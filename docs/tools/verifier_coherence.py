# -*- coding: utf-8 -*-
"""Vérifie la cohérence documentaire TAKT et génère TRACABILITE_TAKT.md.
Usage : python3 tools/verifier_coherence.py   (code de sortie 1 en cas d'écart)"""
import csv, re, os, sys, json
from collections import defaultdict, OrderedDict
HERE = os.path.dirname(os.path.abspath(__file__)); DOCS = os.path.dirname(HERE)
read = lambda p: open(os.path.join(DOCS, p), encoding="utf-8-sig").read()
errors, warnings = [], []
def err(m): errors.append(m)

sf = read("SF_TAKT.md"); st = read("ST_TAKT.md")
rows = list(csv.DictReader(open(os.path.join(DOCS,"Backlog_TAKT_tickets.csv"),encoding="utf-8-sig"), delimiter=";"))

# --- 1. exigences de la SF
ex_def = re.findall(r"\*\*(EX-[A-Z]+-\d{2})\*\*", sf)
dups = {e for e in ex_def if ex_def.count(e) > 1}
if dups: err(f"Codes EX définis plusieurs fois dans la SF : {sorted(dups)}")
EX = list(OrderedDict.fromkeys(ex_def))

# --- 2. backlog : références SF
cover = defaultdict(list)
for r in rows:
    codes = re.findall(r"EX-[A-Z]+-\d{2}", r["Réf. SF"])
    for c in codes:
        if c not in EX: err(f"{r['ID']} cite {c} absent de la SF")
        cover[c].append(r["ID"])
    if not codes and r["Type"] not in ("Tâche technique","Test","Spike"):
        err(f"{r['ID']} ({r['Type']}) sans exigence SF")
for e in EX:
    if e not in cover: err(f"Exigence {e} non couverte par un ticket")

# --- 3. sections de la ST
heads = set(re.findall(r"^#{2,6} (\d+(?:\.\d+)*)\b", st, flags=re.M))
for r in rows:
    for s in re.findall(r"§(\d+(?:\.\d+)*)", r["Réf. ST"]):
        if s not in heads: err(f"{r['ID']} cite §{s} absent de la ST")

# --- 4. dépendances
ids = {r["ID"] for r in rows}; graph = {}
if len(ids) != len(rows): err("Identifiants de tickets en double")
for r in rows:
    deps = [d.strip() for d in r["Dépendances"].split(",") if d.strip()]
    graph[r["ID"]] = deps
    for d in deps:
        if d not in ids: err(f"{r['ID']} dépend de {d} inexistant")
        if d == r["ID"]: err(f"{r['ID']} dépend de lui-même")
state = {}
def dfs(n, path):
    state[n] = 1
    for m in graph.get(n, []):
        if m not in graph: continue
        if state.get(m) == 1: err("Cycle de dépendances : " + " → ".join(path+[n,m])); continue
        if m not in state: dfs(m, path+[n])
    state[n] = 2
for n in graph:
    if n not in state: dfs(n, [])

# --- 5. références croisées depuis la SF et la ST
for name, txt in (("SF", sf), ("ST", st)):
    for c in set(re.findall(r"EX-[A-Z]+-\d{2}", txt)):
        if c not in EX: err(f"{name} cite {c} absent de la SF")
sf_heads = set(re.findall(r"^#{2,3} (\d+(?:\.\d+)*)\b", sf, flags=re.M))
for s in set(re.findall(r"SF §(\d+(?:\.\d+)*)", st)):
    if s not in sf_heads: err(f"La ST cite SF §{s} absent de la SF")
for s in set(re.findall(r"ST §(\d+(?:\.\d+)*)", sf)):
    if s not in heads: err(f"La SF cite ST §{s} absent de la ST")
for ref in re.findall(r"Decision Log \(§(\d+)\)", st):
    if ref not in sf_heads: err(f"ST renvoie au Decision Log §{ref} absent")
dl = re.findall(r"^\| (DL-\d{3}) \|", sf, flags=re.M)
if dl != [f"DL-{i:03d}" for i in range(1, len(dl)+1)]: err("Decision Log : numérotation non continue")

# --- 6. vocabulaire interdit et versions
bad = [(r"\bPlanificateur", "Planificateur (utiliser Gestionnaire)"), (r"\bDU\b", "sigle DU (utiliser charge)"),
       (r"Responsable pédagogique\b", "Responsable pédagogique (rôle) — sauf comité de validation"),
       (r"\bv1\.[1-9]\b|\(v1\.\d\)|\bV1\.[1-9]\b", "marqueur de version intermédiaire"),
       (r"\bDEC-0\d\d\b", "ancien registre DEC"), (r"RB-03|US-P06|\bEF-\d\d\b", "ancien identifiant disparu"),
       (r"\bAWS\b|ECS Fargate|Terraform", "ancienne cible cloud"), (r"\bRESPONSABLE_PEDAGOGIQUE\b|\bPLANIFICATEUR\b", "ancien code de rôle"),
       (r"ROUVRIR|ARCHIVEE", "réouverture ou archivage d'année supprimés"),
       (r"Stencilia|tokens_v2_2|Package_V2_2|tokens_v2_3_[0-5]\b", "ancienne référence de charte (avant tokens 2.3.6)")]
files = {"SF_TAKT.md": sf, "ST_TAKT.md": st}
for p in ("ADR_S1_FET.md","ETAT_PROJET_TAKT.md"):
    if os.path.exists(os.path.join(DOCS,p)): files[p] = read(p)
files["Backlog_TAKT_tickets.csv"] = open(os.path.join(DOCS,"Backlog_TAKT_tickets.csv"),encoding="utf-8-sig").read()
for fn, txt in files.items():
    for pat, label in bad:
        for m in re.finditer(pat, txt):
            ctx = txt[max(0,m.start()-60):m.end()+40].replace("\n"," ")
            if txt.startswith("| DL-", txt.rfind("\n", 0, m.start()) + 1): continue  # Decision Log = historique, jamais réécrit
            if pat == r"\bDU\b" and "«" in txt[max(0,m.start()-3):m.start()]: continue
            if label.startswith("Responsable pédagogique") and "scolarité" in ctx: continue
            if "ROUVRIR" in pat and ("aucune action de réouverture" in ctx.lower() or "Il n'existe aucune" in ctx or "supprimé" in ctx or "ARCHIVEE" not in ctx and "ROUVRIR" not in ctx): continue
            err(f"{fn} : {label} → …{ctx}…")
for fn, txt in (("SF_TAKT.md", sf), ("ST_TAKT.md", st)):
    if not re.search(r"version 1\.0|Version\*\* \| 1\.0", txt, flags=re.I): err(f"{fn} : version 1.0 non déclarée")

# --- 7. Prisma : modèles référencés
models = set(re.findall(r"^model (\w+) \{", st, flags=re.M))
body = st[st.index("```prisma"): st.index("### 2.3")]
for m in re.finditer(r"^\s+\w+\s+(\w+)(\?|\[\])?\s+(@relation|$)", body, flags=re.M):
    pass
enums = set(re.findall(r"^enum (\w+)", body, flags=re.M))
for ref in set(re.findall(r"^\s+\w+\s+([A-Z]\w+)\??\[?\]?\s+@relation", body, flags=re.M)):
    if ref not in models: err(f"Prisma : relation vers modèle inconnu {ref}")
# chaque relation a son pendant (relations nommées exclues)
for mdl in re.finditer(r"^model (\w+) \{(.*?)^\}", body, flags=re.M|re.S):
    name, content = mdl.groups()
    for line in content.splitlines():
        m = re.match(r"\s+\w+\s+(\w+)(\?|\[\])?\s*(.*)", line)
        if m and m.group(1) in models and "@relation(fields" in line:
            target = m.group(1)
            tc = re.search(rf"^model {target} \{{(.*?)^\}}", body, flags=re.M|re.S).group(1)
            if not re.search(rf"\s{name}(\?|\[\])?\s", tc): err(f"Prisma : {name} → {target} sans relation inverse")

# --- 8. génération de la matrice
# Le JSON de correspondance est une source versionnée : son absence ne doit jamais amputer la matrice en silence.
CORR_PATH = os.path.join(HERE, "correspondance_tickets.json")
if not os.path.exists(CORR_PATH):
    err("tools/correspondance_tickets.json absent : la matrice serait amputée de sa section "
        "« Correspondance » (restaurer le fichier depuis Git ou relancer build_backlog.py)")
    corr = {}
else:
    with open(CORR_PATH, encoding="utf-8") as f:
        corr = json.load(f)
pts = sum(int(r["Points"]) for r in rows)
lines = ["# Matrice de traçabilité TAKT 1.0", "",
 "Fichier généré par `tools/verifier_coherence.py`. Ne pas l'éditer à la main.", "",
 f"- {len(EX)} exigences, {len(rows)} tickets, {pts} points.", "",
 "## Exigences → tickets", "", "| Exigence | Tickets | Lots |", "|---|---|---|"]
lot_of = {r["ID"]: r["Lot"] for r in rows}
for e in EX:
    t = cover.get(e, []); lots = sorted({lot_of[x] for x in t})
    lines.append(f"| {e} | {', '.join(t) if t else '**NON COUVERTE**'} | {', '.join(lots)} |")
lines += ["", "## Tickets techniques sans exigence (justifiés par la ST)", "", "| Ticket | Titre | Réf. ST |", "|---|---|---|"]
for r in rows:
    if not re.search(r"EX-", r["Réf. SF"]): lines.append(f"| {r['ID']} | {r['Titre']} | {r['Réf. ST']} |")
if corr:
    lines += ["", "## Correspondance des anciens numéros de tickets", "", "| Ancien | Nouveau |", "|---|---|"]
    for k, v in sorted(corr.items(), key=lambda kv: (kv[0][:2], int(kv[0].split('-')[1]))): lines.append(f"| {k} | {v} |")
# On n'écrase la matrice que si tous les contrôles ont réussi (évite d'écrire un fichier incomplet).
if not errors:
    with open(os.path.join(DOCS, "TRACABILITE_TAKT.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
print(f"{len(EX)} exigences · {len(rows)} tickets · {pts} points · {len(models)} modèles Prisma")
if errors:
    print(f"\n{len(errors)} ÉCART(S) :"); [print(" -", e) for e in errors]; sys.exit(1)
print("OK : aucun écart de cohérence.")
