# Rapport S1 - tests FET
- Date : 2026-10-24T10:43:19Z
- Fichier : /work/isamk.fet (333 activites dans le .fet)

## T0 - version, options et structure
FET version 7.12.0
Free timetabling software, licensed under the GNU Affero General Public License version 3
Copyright (C) 2002-2026 Liviu Lalescu, Volker Dirr
Homepage: https://lalescu.ro/liviu/fet/
This program uses Qt version 6.12.0, Copyright (C) The Qt Company Ltd and other contributors.
Depending on the platform and compiler, this program may use libraries from:
  gcc, Copyright (C) Free Software Foundation, Inc.
  MinGW-w64, Copyright (c) by the mingw-w64 project
  Clang
- option --inputfile : presente dans l'aide
- option --outputdir : presente dans l'aide
- option --timelimitseconds : presente dans l'aide
- option --randomseeds10 : presente dans l'aide
- option --randomseeds11 : presente dans l'aide
- option --randomseeds12 : presente dans l'aide
- option --randomseeds20 : presente dans l'aide
- option --randomseeds21 : presente dans l'aide
- option --randomseeds22 : presente dans l'aide
- option --writetimetablesxml : presente dans l'aide
- option --writetimetableconflicts : presente dans l'aide

## T1 - limite de temps 5 s (sorties par defaut)
- code de sortie : 0 ; duree : 4.9 s (limite 5 s)
- activities xml : /work/s1-work/t1/timetables/isamk-highest/isamk_activities.xml ; activites placees (indicatif) : 333
- result.txt :
    This file contains the result (log) of last operation
    
    FET command line generation started on 10/24/26 10:43 AM
    
    Starting timetable generation...
18762	./logs/difficult_activities.txt
550	./logs/file_open.log
51061	./logs/initial_order.txt
12165	./logs/max_placed_activities.txt
162	./logs/result.txt
47	./stdout.txt
35602	./timetables/isamk-current/isamk_activities.xml
285029	./timetables/isamk-current/isamk_activities_days_horizontal.html
284679	./timetables/isamk-current/isamk_activities_days_vertical.html
288930	./timetables/isamk-current/isamk_activities_time_horizontal.html
294185	./timetables/isamk-current/isamk_activities_time_vertical.html
369569	./timetables/isamk-current/isamk_activity_tags_days_horizontal.html
365019	./timetables/isamk-current/isamk_activity_tags_days_vertical.html
353219	./timetables/isamk-current/isamk_activity_tags_time_horizontal.html
354724	./timetables/isamk-current/isamk_activity_tags_time_vertical.html
842	./timetables/isamk-current/isamk_buildings_days_horizontal.html
842	./timetables/isamk-current/isamk_buildings_days_vertical.html
559	./timetables/isamk-current/isamk_buildings_time_horizontal.html
559	./timetables/isamk-current/isamk_buildings_time_vertical.html
219352	./timetables/isamk-current/isamk_groups_days_horizontal.html
204652	./timetables/isamk-current/isamk_groups_days_vertical.html
154215	./timetables/isamk-current/isamk_groups_time_horizontal.html
146614	./timetables/isamk-current/isamk_groups_time_vertical.html
5066	./timetables/isamk-current/isamk_index.html
153048	./timetables/isamk-current/isamk_rooms_days_horizontal.html
142898	./timetables/isamk-current/isamk_rooms_days_vertical.html
110846	./timetables/isamk-current/isamk_rooms_time_horizontal.html
107327	./timetables/isamk-current/isamk_rooms_time_vertical.html
52867	./timetables/isamk-current/isamk_soft_conflicts.txt
14666	./timetables/isamk-current/isamk_students_statistics.html
1595	./timetables/isamk-current/isamk_stylesheet.css
630241	./timetables/isamk-current/isamk_subgroups.xml
224360	./timetables/isamk-current/isamk_subgroups_days_horizontal.html
209660	./timetables/isamk-current/isamk_subgroups_days_vertical.html
157407	./timetables/isamk-current/isamk_subgroups_time_horizontal.html
149806	./timetables/isamk-current/isamk_subgroups_time_vertical.html
746332	./timetables/isamk-current/isamk_subjects_days_horizontal.html
713782	./timetables/isamk-current/isamk_subjects_days_vertical.html
595333	./timetables/isamk-current/isamk_subjects_time_horizontal.html
571718	./timetables/isamk-current/isamk_subjects_time_vertical.html

## T2 - meme run, sorties minimales
- code de sortie : 0 ; duree : 4.7 s (T1 : 4.9 s)
18809	./logs/difficult_activities.txt
550	./logs/file_open.log
51061	./logs/initial_order.txt
12275	./logs/max_placed_activities.txt
162	./logs/result.txt
47	./stdout.txt
1100	./timetables/isamk-current/isamk_index.html
1100	./timetables/isamk-highest/isamk_index.html
226	./timetables/isamk/isamk_random_seed_before.txt

## T3 - graines identiques (limite 120 s)
- run a : code 0 ; duree 120.0 s ; sha256 ABSENT
- run b : code 0 ; duree 120.0 s ; sha256 ABSENT
- RESULTAT : empreintes differentes ou absentes (non concluant si un run a atteint la limite de 120 s)

## T4 - SIGTERM apres 20 s
- arret apres SIGTERM en 0.3 s ; code 0 (143 = termine par SIGTERM sans gestion)
- activities xml : /work/s1-work/t4/timetables/isamk-highest/isamk_activities.xml ; activites placees (indicatif) : 333
18549	./logs/difficult_activities.txt
550	./logs/file_open.log
51061	./logs/initial_order.txt
12275	./logs/max_placed_activities.txt
171	./logs/result.txt
56	./stdout.txt
35536	./timetables/isamk-current/isamk_activities.xml
280638	./timetables/isamk-current/isamk_activities_days_horizontal.html
280288	./timetables/isamk-current/isamk_activities_days_vertical.html
284539	./timetables/isamk-current/isamk_activities_time_horizontal.html
289794	./timetables/isamk-current/isamk_activities_time_vertical.html
365763	./timetables/isamk-current/isamk_activity_tags_days_horizontal.html
361213	./timetables/isamk-current/isamk_activity_tags_days_vertical.html
349413	./timetables/isamk-current/isamk_activity_tags_time_horizontal.html
350918	./timetables/isamk-current/isamk_activity_tags_time_vertical.html
842	./timetables/isamk-current/isamk_buildings_days_horizontal.html
842	./timetables/isamk-current/isamk_buildings_days_vertical.html
559	./timetables/isamk-current/isamk_buildings_time_horizontal.html
559	./timetables/isamk-current/isamk_buildings_time_vertical.html
218851	./timetables/isamk-current/isamk_groups_days_horizontal.html
204151	./timetables/isamk-current/isamk_groups_days_vertical.html
153714	./timetables/isamk-current/isamk_groups_time_horizontal.html
146113	./timetables/isamk-current/isamk_groups_time_vertical.html
5066	./timetables/isamk-current/isamk_index.html
152807	./timetables/isamk-current/isamk_rooms_days_horizontal.html
142657	./timetables/isamk-current/isamk_rooms_days_vertical.html
110605	./timetables/isamk-current/isamk_rooms_time_horizontal.html
107086	./timetables/isamk-current/isamk_rooms_time_vertical.html
53683	./timetables/isamk-current/isamk_soft_conflicts.txt
14675	./timetables/isamk-current/isamk_students_statistics.html
1595	./timetables/isamk-current/isamk_stylesheet.css
622334	./timetables/isamk-current/isamk_subgroups.xml
223831	./timetables/isamk-current/isamk_subgroups_days_horizontal.html
209131	./timetables/isamk-current/isamk_subgroups_days_vertical.html
156878	./timetables/isamk-current/isamk_subgroups_time_horizontal.html
149277	./timetables/isamk-current/isamk_subgroups_time_vertical.html
743706	./timetables/isamk-current/isamk_subjects_days_horizontal.html
711156	./timetables/isamk-current/isamk_subjects_days_vertical.html
592707	./timetables/isamk-current/isamk_subjects_time_horizontal.html
569092	./timetables/isamk-current/isamk_subjects_time_vertical.html

## T5 - fichier sigwrite
- sigwrite consomme (repertoire courant du processus)
- fichiers avant : 6 ; apres : 99
- activites placees (indicatif) : 333

## T6 et T7 (manuels) - capacite de salle contre effectif, positions imposees : voir ADR_S1_FET.md section 5

Rapport : /work/s1-work/report.md
