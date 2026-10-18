# 📊 Dashboard Vélocité TAKT

*Généré le 18/10/2026 par `velocity_tracker.py` — Ne pas éditer à la main.*

---

## 📈 Vue d'ensemble

| Métrique | Valeur |
|----------|--------|
| Tickets total | 210 |
| ✅ Terminés | 49 (23.3%) |
| 🔄 En cours | 1 |
| ⏳ À faire | 160 |
| Points total | 1079 |
| Points réalisés | 218 (20.2%) |
| Points restants | 861 |
| Débit journalier moyen | 36.33 pts/j |
| Jours écoulés depuis le début | 6 |

---

## 🔮 Prévisions de Date de Fin

Trois méthodes sont utilisées pour estimer la date de fin du projet :

| Méthode | Date estimée | Fiabilité | Hypothèse |
|---------|-------------|-----------|-----------|
| Débit continu (linéaire) | 11/11/2026 (~3.4 semaines restants) | Moyenne | Vélocité constante sur tous les lots |
| Par capacité par lot | 27/10/2026 (~1.1 semaines restants) | Réaliste | Complexité spécifique par lot + dépendances |

> **Date de fin retenue : 27/10/2026 (~1.1 semaines restants)** (méthode la plus réaliste : par capacité par lot)

---

## 🌊 Débit Continu

| Métrique | Valeur |
|----------|--------|
| Points réalisés | 218 |
| Débit journalier moyen | 36.33 pts/j |
| Débit hebdomadaire moyen | 254.33 pts/sem |
| Points restants | 861 |
| Prévision débit continu | 11/11/2026 (~3.4 semaines restants) |

---

## 📦 Prévisions par Lot

| Lot | Points restants | Coeff. vélocité | Jours estimés | Date fin lot |
|-----|----------------:|----------------:|--------------:|-------------:|
| L1 | 80 | 1.0 | 2.2 j | 20/10/2026 |
| L2 | 94 | 0.9 | 2.9 j | 21/10/2026 |
| L3 | 225 | 0.7 | 8.8 j | 27/10/2026 |
| L4 | 148 | 0.85 | 4.8 j | 23/10/2026 |
| L5 | 150 | 0.9 | 4.6 j | 23/10/2026 |
| L6 | 64 | 1.0 | 1.8 j | 20/10/2026 |
| L7 | 100 | 0.85 | 3.2 j | 21/10/2026 |

*Le lot le plus long détermine la date de fin globale du projet.*

---

## 🏃 Vélocité par Sprint

| Sprint | Points réalisés |
|--------|----------------:|
| *Aucun sprint terminé* | — |

---

## 📈 KPIs Globaux (détail)

| Métrique | Valeur |
|----------|--------|
| Points fonctionnels | 889 |
| Points techniques | 190 |
| Ratio Tech/Func | 0.21 |

---

## 📉 Burndown (données pour graphique)

```csv
Sprint,Points restants,Points idéaux
```

*Utiliser ces données dans Excel/Google Sheets pour tracer le burndown chart.*

---

## 📋 Détail par Lot (complétion)

| Lot | Tickets | Points | Terminés | % |
|-----|--------:|-------:|---------:|---:|
| L0 | 39 | 176 | 39 | 100.0% |
| L1 | 27 | 122 | 10 | 37.0% |
| L2 | 19 | 94 | 0 | 0.0% |
| L3 | 45 | 225 | 0 | 0.0% |
| L4 | 24 | 148 | 0 | 0.0% |
| L5 | 29 | 150 | 0 | 0.0% |
| L6 | 10 | 64 | 0 | 0.0% |
| L7 | 17 | 100 | 0 | 0.0% |

---

## 📝 Notes et Méthodologie

- **Vélocité** : Points d'histoire « Terminés » par sprint (critère : Definition of Done validée).
- **Débit continu** : Moyenne linéaire des points réalisés par jour ouvré depuis le début du projet.
- **Monte Carlo** : 10000 simulations sur la vélocité historique des 5 derniers sprints. P50 = médiane, P85/P95 = variantes prudentes.
- **Par capacité par lot** : Chaque lot est estimé indépendamment avec un coefficient de vélocité spécifique (voir `LOT_VELOCITY_COEFFICIENTS`). La date de fin globale = max des dates de fin par lot. C'est la méthode la plus réaliste car elle modélise la complexité variable et les dépendances entre lots.
- **Burndown idéal** : Ligne droite du total vers 0 sur 10 sprints planifiés.
- **Scope creep** : Non détecté automatiquement — comparer les exports CSV successifs.
- **Carry-over** : Tickets « En cours » reportés au sprint suivant = risque de surcharge.
- **Mise à jour** : Relancer ce script à chaque fin de sprint après mise à jour des statuts dans le CSV.

---

*Fichier généré automatiquement — Source : `Backlog_TAKT_tickets.csv`*