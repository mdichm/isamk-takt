#!/usr/bin/env bash
# Spike S1 - tests empiriques FET (fet-cl). A lancer sous Linux (WSL ou conteneur).
# Usage : ./s1_fet_tests.sh /chemin/fet-cl /chemin/fichier.fet [dossier_de_travail]
# Variables : SHORT (limite courte, 5 s), LONG (limite pour le test des graines, 120 s),
#             WAIT (attente avant signal, 20 s)
set -u
FETCL="$(readlink -f "${1:?usage: $0 /chemin/fet-cl /chemin/fichier.fet [workdir]}")"
INPUT="$(readlink -f "${2:?fichier .fet manquant}")"
WORK="$(readlink -f "${3:-./s1-work}")"
SHORT="${SHORT:-5}"; LONG="${LONG:-120}"; WAIT="${WAIT:-20}"
mkdir -p "$WORK"; REPORT="$WORK/report.md"; : > "$REPORT"

log()  { echo "$*" | tee -a "$REPORT"; }
now()  { date +%s.%N; }
dur()  { awk -v a="$1" -v b="$2" 'BEGIN{printf "%.1f", b-a}'; }
files(){ (cd "$1" && find . -type f -printf '%s\t%p\n' | sort -k2 | head -40); }
axml() { find "$1" -name '*activities*.xml' -type f 2>/dev/null | head -1; }
# nombre d'activites : grep -c sort en code 1 quand il n'y a aucune correspondance, d'ou le "|| true"
nact() { if [ -n "${1:-}" ] && [ -f "$1" ]; then grep -c '<Activity>' "$1" || true; else echo 0; fi; }

# options pour ne garder que le XML des activites (reduit le cout d'ecriture)
MIN=(--writetimetablesxml=true --writetimetableconflicts=false --writetimetablesstatistics=false
     --writetimetablesdayshorizontal=false --writetimetablesdaysvertical=false
     --writetimetablestimehorizontal=false --writetimetablestimevertical=false
     --writetimetablessubgroups=false --writetimetablesgroups=false --writetimetablesyears=false
     --writetimetablesteachers=false --writetimetablesteachersfreeperiods=false
     --writetimetablesrooms=false --writetimetablessubjects=false
     --writetimetablesactivitytags=false --writetimetablesactivities=false)

log "# Rapport S1 - tests FET"
log "- Date : $(date -u +%FT%TZ)"
log "- Fichier : $INPUT ($(grep -c '<Activity>' "$INPUT" || true) activites dans le .fet)"

# ---------- T0
d="$WORK/t0"; mkdir -p "$d"
log; log "## T0 - version, options et structure"
"$FETCL" --version --outputdir="$d" 2>&1 | tee -a "$REPORT"
HELP="$("$FETCL" --help 2>&1 || true)"
for opt in inputfile outputdir timelimitseconds randomseeds10 randomseeds11 randomseeds12 randomseeds20 randomseeds21 randomseeds22 writetimetablesxml writetimetableconflicts; do
  if printf '%s' "$HELP" | grep -q -- "$opt"; then log "- option --$opt : presente dans l'aide"
  else log "- ATTENTION option --$opt : absente de l'aide de cette version (a verifier, le test T2 peut echouer)"; fi
done
files "$d" | tee -a "$REPORT"

# ---------- T1 : limite courte, sortie partielle
d="$WORK/t1"; mkdir -p "$d"
log; log "## T1 - limite de temps ${SHORT} s (sorties par defaut)"
t0=$(now)
timeout $((SHORT+300)) "$FETCL" --inputfile="$INPUT" --outputdir="$d" --timelimitseconds="$SHORT" > "$d/stdout.txt" 2>&1
rc=$?; t1=$(now)
log "- code de sortie : $rc ; duree : $(dur "$t0" "$t1") s (limite $SHORT s)"
x=$(axml "$d"); log "- activities xml : ${x:-ABSENT} ; activites placees (indicatif) : $(nact "$x")"
r=$(find "$d" -path '*logs/result.txt' | head -1); [ -n "$r" ] && { log "- result.txt :"; head -5 "$r" | sed 's/^/    /' | tee -a "$REPORT"; }
files "$d" | tee -a "$REPORT"
T1DUR=$(dur "$t0" "$t1")

# ---------- T2 : sorties minimales
d="$WORK/t2"; mkdir -p "$d"
log; log "## T2 - meme run, sorties minimales"
t0=$(now)
timeout $((SHORT+300)) "$FETCL" --inputfile="$INPUT" --outputdir="$d" --timelimitseconds="$SHORT" "${MIN[@]}" > "$d/stdout.txt" 2>&1
rc=$?; t1=$(now)
log "- code de sortie : $rc ; duree : $(dur "$t0" "$t1") s (T1 : ${T1DUR} s)"
if [ "$rc" -ne 0 ] && grep -qiE 'unknown|invalid|usage' "$d/stdout.txt"; then log "- ATTENTION : une option semble refusee, voir $d/stdout.txt"; fi
files "$d" | tee -a "$REPORT"

# ---------- T3 : graines
log; log "## T3 - graines identiques (limite ${LONG} s)"
for n in a b; do
  d="$WORK/t3$n"; mkdir -p "$d"; t0=$(now)
  timeout $((LONG+300)) "$FETCL" --inputfile="$INPUT" --outputdir="$d" --timelimitseconds="$LONG" \
     --randomseeds10=12345 --randomseeds11=23456 --randomseeds12=34567 \
     --randomseeds20=45678 --randomseeds21=56789 --randomseeds22=67890 "${MIN[@]}" > "$d/stdout.txt" 2>&1
  rc=$?; t1=$(now); x=$(axml "$d")
  h=$([ -n "$x" ] && sha256sum "$x" | cut -d' ' -f1 || echo ABSENT)
  log "- run $n : code $rc ; duree $(dur "$t0" "$t1") s ; sha256 $h"
  eval "H$n=$h; D$n=$(dur "$t0" "$t1")"
done
if [ "$Ha" = "$Hb" ] && [ "$Ha" != "ABSENT" ]; then log "- RESULTAT : empreintes identiques"
else log "- RESULTAT : empreintes differentes ou absentes (non concluant si un run a atteint la limite de ${LONG} s)"; fi

# ---------- T4 : SIGTERM
d="$WORK/t4"; mkdir -p "$d"
log; log "## T4 - SIGTERM apres ${WAIT} s"
( cd "$d" && exec "$FETCL" --inputfile="$INPUT" --outputdir="$d" --timelimitseconds=3600 > "$d/stdout.txt" 2>&1 ) &
pid=$!; sleep "$WAIT"
if kill -0 "$pid" 2>/dev/null; then
  t0=$(now); kill -TERM "$pid"; wait "$pid"; rc=$?; t1=$(now)
  log "- arret apres SIGTERM en $(dur "$t0" "$t1") s ; code $rc (143 = termine par SIGTERM sans gestion)"
else
  wait "$pid"; log "- FET s'est termine avant ${WAIT} s : test non concluant (utiliser un fichier plus difficile ou WAIT plus court)"
fi
x=$(axml "$d"); log "- activities xml : ${x:-ABSENT} ; activites placees (indicatif) : $(nact "$x")"
files "$d" | tee -a "$REPORT"

# ---------- T5 : sigwrite
d="$WORK/t5"; mkdir -p "$d"
log; log "## T5 - fichier sigwrite"
( cd "$d" && exec "$FETCL" --inputfile="$INPUT" --outputdir="$d" --timelimitseconds=3600 > "$d/stdout.txt" 2>&1 ) &
pid=$!; sleep "$WAIT"
if kill -0 "$pid" 2>/dev/null; then
  before=$(find "$d" -type f | wc -l)
  touch "$d/sigwrite"; sleep 10
  if [ -e "$d/sigwrite" ]; then
    log "- sigwrite dans le repertoire courant : NON consomme apres 10 s ; essai dans le dossier de sortie"
    rm -f "$d/sigwrite"; od=$(find "$d" -mindepth 1 -maxdepth 1 -type d | head -1)
    [ -n "$od" ] && { touch "$od/sigwrite"; sleep 10; [ -e "$od/sigwrite" ] && { log "- NON consomme non plus dans $od"; rm -f "$od/sigwrite"; } || log "- consomme dans $od"; }
  else
    log "- sigwrite consomme (repertoire courant du processus)"
  fi
  after=$(find "$d" -type f | wc -l)
  log "- fichiers avant : $before ; apres : $after"
  x=$(axml "$d"); log "- activites placees (indicatif) : $(nact "$x")"
  kill -TERM "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
else
  wait "$pid"; log "- FET s'est termine avant ${WAIT} s : test non concluant"
fi

log; log "## T6 et T7 (manuels) - capacite de salle contre effectif, positions imposees : voir ADR_S1_FET.md section 5"
log; log "Rapport : $REPORT"
