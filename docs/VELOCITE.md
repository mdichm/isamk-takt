# 📊 Dashboard Vélocité TAKT

*Fichier généré automatiquement — Source : `Backlog_TAKT_tickets.csv`*

---

## 📈 Vue d'ensemble

| Métrique | Valeur |
|----------|--------|
| Tickets total | 218 |
| ✅ Terminés | 89 (40.8%) |
| 🔄 En cours | 0 |
| ⏳ À faire | 129 |
| Points total | 1112 |
| Points réalisés | 408 (36.7%) |
| Points restants | 704 |
| Débit journalier moyen | 45.33 pts/j |
| Jours écoulés depuis le début | 9 |

---

## 🔮 Prévisions de Date de Fin

Trois méthodes sont utilisées pour estimer la date de fin du projet :

| Méthode | Date estimée | Fiabilité | Hypothèse |
|---------|-------------|-----------|-----------|
| Débit continu (linéaire) | 06/11/2026 (~2.2 semaines restants) | Moyenne | Vélocité constante sur tous les lots |
| Par capacité par lot | 28/10/2026 (~0.9 semaines restants) | Réaliste | Complexité spécifique par lot + dépendances |

> **Date de fin retenue : 28/10/2026 (~0.9 semaines restants)** (méthode la plus réaliste : par capacité par lot)

---

## 🌊 Débit Continu

| Métrique | Valeur |
|----------|--------|
| Points réalisés | 408 |
| Débit journalier moyen | 45.33 pts/j |
| Débit hebdomadaire moyen | 317.33 pts/sem |
| Points restants | 704 |
| Prévision débit continu | 06/11/2026 (~2.2 semaines restants) |

---

## 📦 Prévisions par Lot

| Lot | Points restants | Coeff. vélocité | Jours estimés | Date fin lot |
|-----|----------------:|----------------:|--------------:|-------------:|
| L2 | 30 | 0.9 | 0.7 j | 22/10/2026 |
| L3 | 212 | 0.7 | 6.7 j | 28/10/2026 |
| L4 | 148 | 0.85 | 3.8 j | 25/10/2026 |
| L5 | 150 | 0.9 | 3.7 j | 25/10/2026 |
| L6 | 64 | 1.0 | 1.4 j | 23/10/2026 |
| L7 | 100 | 0.85 | 2.6 j | 24/10/2026 |

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
| Points fonctionnels | 917 |
| Points techniques | 195 |
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
| L1 | 33 | 142 | 33 | 100.0% |
| L2 | 19 | 94 | 12 | 63.2% |
| L3 | 45 | 225 | 3 | 6.7% |
| L4 | 24 | 148 | 0 | 0.0% |
| L5 | 29 | 150 | 0 | 0.0% |
| L6 | 10 | 64 | 0 | 0.0% |
| L7 | 19 | 113 | 2 | 10.5% |

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