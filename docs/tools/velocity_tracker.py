# -*- coding: utf-8 -*-
"""Génère VELOCITE.md — Dashboard de vélocité du projet TAKT en flux continu.

Usage : python3 docs/tools/velocity_tracker.py
Lit Backlog_TAKT_tickets.csv et génère un rapport Markdown avec :
  - Débit continu points/jour et points/semaine
  - Vélocité historique par sprint pour référence
  - Burndown continu
  - Prévision de fin par débit moyen et Monte Carlo P50/P85/P95
  - KPIs : % done, carry-over, scope creep, ratio tech/func
"""

import csv
import os
import sys
import random
from collections import defaultdict
from datetime import datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(HERE)
CSV_PATH = os.path.join(DOCS, "Backlog_TAKT_tickets.csv")
OUT_PATH = os.path.join(DOCS, "VELOCITE.md")

# Configuration
SPRINT_LENGTH_DAYS = 14  # 2 semaines
VELOCITY_WINDOW = 5      # Moyenne sur 5 derniers sprints
PROJECT_START_DATE = datetime(2026, 10, 12)  # Date de début du projet
CONTINUOUS_FLOW = True   # Mode flux continu sans regroupement par sprint
MONTE_CARLO_ITERATIONS = 10000


def read_backlog():
    """Lit le CSV et retourne la liste des tickets."""
    if not os.path.exists(CSV_PATH):
        print(f"⚠️  {CSV_PATH} introuvable — backlog vide")
        return []

    rows = []
    with open(CSV_PATH, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            rows.append(row)
    return rows


def compute_velocity(rows):
    """Calcule la vélocité par sprint basé sur le champ Sprint du CSV."""
    done_tickets = [r for r in rows if r.get("Statut", "").strip().lower() == "terminé"]

    if not done_tickets:
        return {}

    velocity = defaultdict(int)
    for t in done_tickets:
        sprint = t.get("Sprint", "").strip()
        if sprint:
            # Normaliser le format: "3" -> "Sprint 3", "Sprint 3" -> "Sprint 3"
            if sprint.isdigit():
                sprint_key = f"Sprint {sprint}"
            elif sprint.lower().startswith("sprint"):
                sprint_key = sprint.capitalize()
            else:
                sprint_key = f"Sprint {sprint}"
            velocity[sprint_key] += int(t.get("Points", 0) or 0)

    # Trier par numéro de sprint
    return dict(sorted(velocity.items(), key=lambda x: int(x[0].split()[1])))


def compute_kpis(rows):
    """Calcule les KPIs globaux."""
    total = len(rows)
    done = len([r for r in rows if r.get("Statut", "").strip().lower() == "terminé"])
    in_progress = len([r for r in rows if r.get("Statut", "").strip().lower() == "en cours"])
    todo = len([r for r in rows if r.get("Statut", "").strip().lower() == "à faire"])

    total_points = sum(int(r.get("Points", 0) or 0) for r in rows)
    done_points = sum(int(r.get("Points", 0) or 0) for r in rows
                      if r.get("Statut", "").strip().lower() == "terminé")

    tech_types = {"Tâche technique", "Test", "Spike"}
    tech_points = sum(int(r.get("Points", 0) or 0) for r in rows if r.get("Type") in tech_types)
    func_points = total_points - tech_points

    return {
        "total_tickets": total,
        "done_tickets": done,
        "in_progress_tickets": in_progress,
        "todo_tickets": todo,
        "total_points": total_points,
        "done_points": done_points,
        "completion_pct": round((done / total * 100) if total else 0, 1),
        "points_completion_pct": round((done_points / total_points * 100) if total_points else 0, 1),
        "tech_points": tech_points,
        "func_points": func_points,
        "tech_func_ratio": round(tech_points / func_points, 2) if func_points else 0,
    }



def compute_daily_metrics(kpis):
    """Débit continu basé sur la date de début du projet."""
    today = datetime.now()
    elapsed_days = max(1, (today - PROJECT_START_DATE).days)
    daily_throughput = kpis["done_points"] / elapsed_days
    weekly_throughput = daily_throughput * 7
    return daily_throughput, weekly_throughput, elapsed_days

def forecast_continuous(kpis, daily_throughput):
    """Prévision de fin basée sur débit journalier moyen."""
    remaining = kpis["total_points"] - kpis["done_points"]
    if daily_throughput <= 0:
        return "— (débit nul)"
    days_needed = remaining / daily_throughput
    end_date = datetime.now() + timedelta(days=days_needed)
    return f"{end_date.strftime('%d/%m/%Y')} (~{days_needed/7:.1f} semaines restants)"

def forecast_monte_carlo(velocity, kpis):
    """Monte Carlo sur la distribution historique de vélocité sprint."""
    if not velocity:
        return None, None, None
    values = list(velocity.values())
    recent = values[-VELOCITY_WINDOW:] if len(values) >= VELOCITY_WINDOW else values
    if not recent:
        return None, None, None
    remaining = kpis["total_points"] - kpis["done_points"]
    results_days = []
    random.seed(42)
    for _ in range(MONTE_CARLO_ITERATIONS):
        cum = 0
        days = 0
        while cum < remaining:
            v = random.choice(recent)
            cum += v
            days += SPRINT_LENGTH_DAYS
        results_days.append(days)
    results_days.sort()
    def perc(p):
        idx = max(0, min(len(results_days)-1, int(p * (len(results_days)-1))))
        return datetime.now() + timedelta(days=results_days[idx])
    p50 = perc(0.5).strftime('%d/%m/%Y')
    p85 = perc(0.85).strftime('%d/%m/%Y')
    p95 = perc(0.95).strftime('%d/%m/%Y')
    return p50, p85, p95


def generate_burndown_data(velocity, kpis, num_sprints=10):
    """Génère les données de burndown pour graphique."""
    lines = ["Sprint,Points restants,Points idéaux"]
    remaining = kpis["total_points"]
    ideal_velocity = kpis["total_points"] / num_sprints if num_sprints else 0
    ideal_remaining = kpis["total_points"]

    for i in range(1, num_sprints + 1):
        sprint_key = f"Sprint {i}"
        if sprint_key in velocity:
            remaining -= velocity[sprint_key]
        ideal_remaining = max(0, ideal_remaining - ideal_velocity)
        lines.append(f"{sprint_key},{max(0, remaining)},{round(ideal_remaining, 1)}")

    return "\n".join(lines)


def forecast_completion(velocity, kpis):
    """Estime la date de fin selon la vélocité moyenne."""
    if not velocity:
        return "— (aucune vélocité)"

    values = list(velocity.values())
    recent = values[-VELOCITY_WINDOW:]
    avg_velocity = sum(recent) / len(recent) if recent else 0

    if avg_velocity <= 0:
        return "— (vélocité nulle)"

    remaining_points = kpis["total_points"] - kpis["done_points"]
    sprints_needed = remaining_points / avg_velocity
    end_date = PROJECT_START_DATE + timedelta(days=sprints_needed * SPRINT_LENGTH_DAYS)

    return f"{end_date.strftime('%d/%m/%Y')} (~{sprints_needed:.1f} sprints restants)"


def generate_markdown(velocity, kpis, burndown_csv, forecast, rows, daily_throughput=0, weekly_throughput=0, elapsed_days=0, p50=None, p85=None, p95=None):
    """Génère le fichier VELOCITE.md."""
    today = datetime.now().strftime("%d/%m/%Y")
    num_sprints = 10

    md = [
        f"# 📊 Dashboard Vélocité TAKT",
        f"",
        f"*Généré le {today} par `velocity_tracker.py` — Ne pas éditer à la main.*",
        f"",
        f"---",
        f"",
        f"## 🏃 Vélocité par Sprint",
        f"",
        f"| Sprint | Points réalisés |",
        f"|--------|----------------:|",
    ]

    for sprint in sorted(velocity.keys(), key=lambda x: int(x.split()[1])):
        md.append(f"| {sprint} | {velocity[sprint]} |")

    if velocity:
        values = list(velocity.values())
        recent = values[-VELOCITY_WINDOW:]
        avg = sum(recent) / len(recent) if recent else 0
        md.append(f"| **Moyenne ({VELOCITY_WINDOW} derniers)** | **{avg:.1f}** |")
    else:
        md.append(f"| *Aucun sprint terminé* | — |")

    # Flux continu
    if CONTINUOUS_FLOW:
        md.append(f"")
        md.append(f"---")
        md.append(f"")
        md.append(f"## 🌊 Débit Continu")
        md.append(f"")
        md.append(f"| Métrique | Valeur |")
        md.append(f"|----------|--------|")
        md.append(f"| Points réalisés | {kpis['done_points']} |")
        md.append(f"| Jours écoulés depuis le début | {elapsed_days} |")
        md.append(f"| Débit journalier moyen | {daily_throughput:.2f} pts/j |")
        md.append(f"| Débit hebdomadaire moyen | {weekly_throughput:.2f} pts/sem |")
        md.append(f"| Points restants | {kpis['total_points'] - kpis['done_points']} |")
        md.append(f"| Prévision débit continu | {forecast} |")
        if p50 and p85 and p95:
            md.append(f"")
            md.append(f"| Méthode Monte Carlo | |")
            md.append(f"| P50 | {p50} |")
            md.append(f"| P85 | {p85} |")
            md.append(f"| P95 | {p95} |")

    md += [
        f"",
        f"---",
        f"",
        f"## 📈 KPIs Globaux",
        f"",
        f"| Métrique | Valeur |",
        f"|----------|--------|",
        f"| Tickets total | {kpis['total_tickets']} |",
        f"| ✅ Terminés | {kpis['done_tickets']} ({kpis['completion_pct']}%) |",
        f"| 🔄 En cours | {kpis['in_progress_tickets']} |",
        f"| ⏳ À faire | {kpis['todo_tickets']} |",
        f"| Points total | {kpis['total_points']} |",
        f"| Points réalisés | {kpis['done_points']} ({kpis['points_completion_pct']}%) |",
        f"| Points fonctionnels | {kpis['func_points']} |",
        f"| Points techniques | {kpis['tech_points']} |",
        f"| Ratio Tech/Func | {kpis['tech_func_ratio']} |",
        f"",
        f"---",
        f"",
        f"## 📉 Burndown (données pour graphique)",
        f"",
        f"```csv",
        f"{burndown_csv}",
        f"```",
        f"",
        f"*Utiliser ces données dans Excel/Google Sheets pour tracer le burndown chart.*",
        f"",
        f"---",
        f"",
        f"## 🔮 Prévision de Fin",
        f"",
        f"> **Date estimée de fin : {forecast}**",
        f"",
        f"*Basé sur la vélocité moyenne des {VELOCITY_WINDOW} derniers sprints ({SPRINT_LENGTH_DAYS} jours/sprint).""",
        f"",
        f"---",
        f"",
        f"## 📋 Détail par Lot",
        f"",
        f"| Lot | Tickets | Points | Terminés | % |",
        f"|-----|--------:|-------:|---------:|---:|",
    ]

    lots = defaultdict(lambda: {"tickets": 0, "points": 0, "done": 0, "done_pts": 0})
    for r in rows:
        lot = r.get("Lot", "?")
        pts = int(r.get("Points", 0) or 0)
        lots[lot]["tickets"] += 1
        lots[lot]["points"] += pts
        if r.get("Statut", "").strip().lower() == "terminé":
            lots[lot]["done"] += 1
            lots[lot]["done_pts"] += pts

    for lot in sorted(lots.keys()):
        d = lots[lot]
        pct = round(d["done"] / d["tickets"] * 100, 1) if d["tickets"] else 0
        md.append(f"| {lot} | {d['tickets']} | {d['points']} | {d['done']} | {pct}% |")

    md += [
        f"",
        f"---",
        f"",
        f"## 📝 Notes",
        f"",
        f"- **Vélocité** : Points d'histoire « Terminés » par sprint (critère : Definition of Done validée).",
        f"- **Burndown idéal** : Ligne droite du total vers 0 sur {num_sprints} sprints planifiés.",
        f"- **Scope creep** : Non détecté automatiquement — comparer les exports CSV successifs.",
        f"- **Carry-over** : Tickets « En cours » reportés au sprint suivant = risque de surcharge.",
        f"- **Mise à jour** : Relancer ce script à chaque fin de sprint après mise à jour des statuts dans le CSV.",
        f"",
        f"---",
        f"",
        f"*Fichier généré automatiquement — Source : `Backlog_TAKT_tickets.csv`*",
    ]

    return "\n".join(md)


def main():
    print("📊 Génération VELOCITE.md...")

    rows = read_backlog()
    if not rows:
        print("⚠️  Backlog vide — création d'un VELOCITE.md minimal")
        with open(OUT_PATH, "w", encoding="utf-8") as f:
            f.write("# 📊 Dashboard Vélocité TAKT\n\n*Backlog vide — aucun ticket.*\n")
        print(f"✅ {OUT_PATH} créé")
        return 0

    kpis = compute_kpis(rows)
    velocity = compute_velocity(rows)
    daily_throughput, weekly_throughput, elapsed_days = compute_daily_metrics(kpis)
    forecast_cont = forecast_continuous(kpis, daily_throughput)
    p50, p85, p95 = forecast_monte_carlo(velocity, kpis) if velocity else (None, None, None)
    burndown_csv = generate_burndown_data(velocity, kpis) if velocity else "Sprint,Points restants,Points idéaux"
    md = generate_markdown(velocity, kpis, burndown_csv, forecast_cont, rows, daily_throughput, weekly_throughput, elapsed_days, p50, p85, p95)

    with open(OUT_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(md)

    print(f"✅ {OUT_PATH} généré ({len(rows)} tickets, {len(velocity)} sprints)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
