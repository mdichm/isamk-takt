/**
 * Script de seed — Données réelles S4 (semestre 4) de l'ISAMK
 * Ticket L7-16 : Recette sur données réelles
 *
 * Ce script charge les données réelles extraites du fichier docs/isamk.fet
 * via le script extract-fet-data.ts.
 *
 * Données extraites du fichier FET :
 *   - 93 sujets (modules)
 *   - 111 enseignants
 *   - 42 groupes dans 5 années (L1, L2, L3, M1, M2)
 *   - 333 activités (affectations enseignant → matière → groupe)
 *   - 29 salles (capacité placeholder 30000 → à corriger)
 *   - 13 activity tags
 *   - 6 jours, 19 créneaux de 30 min
 *
 * Valeurs initiales du jeu de règles de charge (conformément à ST_TAKT.md §0.4 HY-05) :
 *   - Charge de référence : 0 pour tous les grades
 *   - Coefficients : CM=1, TD=1, TP=1, CI=1
 *   - Seuil : 1, Plafond : 4
 */

import { PrismaClient, Prisma } from '@takt/db';
import * as fs from 'fs';

const prisma = new PrismaClient();

const EXTRACTED_DATA_FILE = '/home/mehdi/dev/isamk-takt/packages/db/prisma/seed/isamk-extracted-data.json';

// Mapping des Activity Tags FET vers les codes TypeEnseignement
const TAG_TO_TYPE_CODE: Record<string, string> = {
  'C': 'CM',
  'TD': 'TD',
  'TP': 'TP',
  'CI': 'CI',
  'Amphi': 'CM',
  'Labo': 'TP',
  'Atelier Cer': 'TP',
  'Atelier AV': 'TP',
  'Atelier Tsg': 'TP',
  'Atelier Bij': 'TP',
  'Autre': 'AUTRE',
  'peeka': 'AUTRE',
  'Mezz. AV': 'AUTRE',
};

// Capacités réalistes par type de salle (le FET indique 30000 pour toutes)
const CAPACITE_PAR_TYPE: Record<string, { max: number; recommandee: number }> = {
  AMPHI: { max: 150, recommandee: 120 },
  TD: { max: 40, recommandee: 30 },
  TP: { max: 24, recommandee: 20 },
  CI: { max: 30, recommandee: 25 },
  BUREAU: { max: 4, recommandee: 4 },
  AUTRE: { max: 30, recommandee: 25 },
};

// Déduction du département à partir du préfixe du code de groupe
const GROUPE_PREFIX_TO_DEPT: Record<string, { code: string; libelle: string }> = {
  AP: { code: 'AP', libelle: 'Arts Plastiques' },
  DE: { code: 'DE', libelle: 'Design Espace' },
  DI: { code: 'DI', libelle: 'Design Industriel' },
  DP: { code: 'DP', libelle: 'Design Produit' },
  AI: { code: 'AI', libelle: 'Arts Appliqués' },
  Cer: { code: 'CER', libelle: 'Céramique' },
  CI: { code: 'CI', libelle: 'Communication Visuelle' },
  Pub: { code: 'PUB', libelle: 'Publicité' },
  Tsg: { code: 'TSG', libelle: 'Textile' },
  PAV: { code: 'PAV', libelle: 'Arts Visuels' },
};

async function main() {
  console.log('🌱 Début du seed — Données réelles S4 (L7-16)');

  // ============================================
  // Chargement des données extraites du fichier FET
  // ============================================
  console.log('📖 Chargement des données extraites du fichier FET...');
  const extracted = JSON.parse(fs.readFileSync(EXTRACTED_DATA_FILE, 'utf-8'));
  const {
    days, hours, subjects, teachers, years, activities, rooms, activityTags,
  } = extracted;

  console.log(`   ${subjects.length} sujets, ${teachers.length} enseignants, ${years.length} années,`);
  console.log(`   ${years.reduce((s: number, y: any) => s + y.groups.length, 0)} groupes, ${activities.length} activités, ${rooms.length} salles, ${activityTags.length} tags`);

  // ============================================
  // 1. Année universitaire
  // ============================================
  console.log('📅 Création de l\'année universitaire 2026-2027...');
  const annee = await prisma.annee.upsert({
    where: { code: '2026-2027' },
    update: {},
    create: {
      code: '2026-2027',
      numero: 2026,
      nbSemaines: 14,
      statut: 'PREPARATION',
    },
  });

  // ============================================
  // 2. Semestre 4 (S4 = semestre 2 de l'année)
  // ============================================
  console.log('📅 Création du semestre S4...');
  const semestre = await prisma.semestre.upsert({
    where: { anneeId_numero: { anneeId: annee.id, numero: 2 } },
    update: {},
    create: {
      anneeId: annee.id,
      numero: 2,
      nbSemaines: 14,
    },
  });


  // ============================================
  // 3. Types d'enseignement (basés sur les Activity Tags FET)
  // ============================================
  console.log('📚 Création des types d\'enseignement...');
  const typesEnseignement: Record<string, any> = {};
  const typeCodes = ['CM', 'TD', 'TP', 'CI', 'AUTRE'];
  const typeLibelles: Record<string, string> = {
    CM: 'Cours Magistral',
    TD: 'Travaux Dirigés',
    TP: 'Travaux Pratiques',
    CI: 'Cours Intégré',
    AUTRE: 'Autre',
  };
  for (const code of typeCodes) {
    typesEnseignement[code] = await prisma.typeEnseignement.upsert({
      where: { code },
      update: {},
      create: { code, libelle: typeLibelles[code] },
    });
  }

  // ============================================
  // 4. Grades (conformément à HY-05)
  // ============================================
  console.log('👨‍🏫 Création des grades...');
  const grades: Record<string, any> = {};
  const gradesData = [
    { code: 'ASSISTANT', libelle: 'Assistant' },
    { code: 'MAITRE_ASSISTANT', libelle: 'Maître assistant' },
    { code: 'MAITRE_CONFERENCES', libelle: 'Maître de conférences' },
    { code: 'PROFESSEUR', libelle: 'Professeur' },
    { code: 'PES', libelle: 'PES' },
    { code: 'PES_P', libelle: 'PES_P' },
    { code: 'PES_A', libelle: 'PES_A' },
    { code: 'CONTRAT_EXPERT', libelle: 'Contrat expert' },
    { code: 'VACATAIRE', libelle: 'Vacataire' },
    { code: 'CONTRAT', libelle: 'Contrat' },
  ];
  for (const g of gradesData) {
    grades[g.code] = await prisma.grade.upsert({
      where: { code: g.code },
      update: {},
      create: g,
    });
  }

  // ============================================
  // 5. ActivityTags (basés sur les tags FET)
  // ============================================
  console.log('🏷️ Création des activity tags...');
  const activityTagsMap: Record<string, any> = {};
  for (const tag of activityTags) {
    const typeCode = TAG_TO_TYPE_CODE[tag.name] || 'AUTRE';
    activityTagsMap[tag.name] = await prisma.activityTag.upsert({
      where: { code: `TAG_${tag.name.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}` },
      update: {},
      create: {
        code: `TAG_${tag.name.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}`,
        libelle: tag.longName || tag.name,
        isActive: true,
        typeId: typesEnseignement[typeCode].id,
      },
    });
  }

  // Lier les types d'enseignement à leurs activity tags
  for (const code of typeCodes) {
    const tagForType = Object.values(activityTagsMap).find((t: any) => t.typeId === typesEnseignement[code].id);
    if (tagForType) {
      await prisma.typeEnseignement.update({
        where: { id: typesEnseignement[code].id },
        data: { activityTagId: tagForType.id },
      });
    }
  }


  // ============================================
  // 6. Départements (déduits des préfixes de groupes FET)
  // ============================================
  console.log('🏢 Création des départements...');
  const departements: Record<string, any> = {};
  const deptsUsed = new Set<string>();
  years.forEach((y: any) => {
    y.groups.forEach((g: any) => {
      const prefix = g.name.split('_')[0].replace(/\d+/, '');
      if (prefix && !deptsUsed.has(prefix)) {
        deptsUsed.add(prefix);
      }
    });
  });
  const departementsData = Array.from(deptsUsed).map(prefix => {
    const info = GROUPE_PREFIX_TO_DEPT[prefix] || { code: prefix, libelle: prefix };
    return { code: info.code, libelle: info.libelle, ordre: departementsData.length + 1 };
  });
  for (const d of departementsData) {
    departements[d.code] = await prisma.departement.upsert({
      where: { anneeId_code: { anneeId: annee.id, code: d.code } },
      update: {},
      create: { anneeId: annee.id, ...d },
    });
  }
  console.log(`   ${departementsData.length} départements créés`);

  // ============================================
  // 7. Formations (déduites des années FET)
  // ============================================
  console.log('🎓 Création des formations...');
  const formations: Record<string, any> = {};
  const formationsData: Array<{ code: string; libelle: string; departement: string; ordre: number }> = [];
  let forOrdre = 1;
  years.forEach((y: any) => {
    // Déduire le département à partir du premier groupe de l'année
    const firstGroup = y.groups[0]?.name || '';
    const prefix = firstGroup.split('_')[0].replace(/\d+/, '');
    const deptInfo = GROUPE_PREFIX_TO_DEPT[prefix] || { code: prefix, libelle: prefix };
    const deptCode = deptInfo.code;
    if (!departements[deptCode]) {
      console.warn(`   Département ${deptCode} non trouvé pour l'année ${y.name}`);
      return;
    }
    formationsData.push({
      code: y.name,
      libelle: y.longName || `${y.name} Formation`,
      departement: deptCode,
      ordre: forOrdre++,
    });
  });
  for (const f of formationsData) {
    formations[f.code] = await prisma.formation.upsert({
      where: { departementId_code: { departementId: departements[f.departement].id, code: f.code } },
      update: {},
      create: { departementId: departements[f.departement].id, ...f },
    });
  }
  console.log(`   ${formationsData.length} formations créées`);

  // ============================================
  // 8. Niveaux
  // ============================================
  console.log('📋 Création des niveaux...');
  const niveaux: Record<string, any> = {};
  const niveauxData: Array<{ formation: string; code: string; libelle: string; ordre: number }> = [];
  years.forEach((y: any) => {
    niveauxData.push({
      formation: y.name,
      code: y.name,
      libelle: y.longName || y.name,
      ordre: 1,
    });
  });
  for (const n of niveauxData) {
    niveaux[n.formation + ':' + n.code] = await prisma.niveau.upsert({
      where: { formationId_code: { formationId: formations[n.formation].id, code: n.code } },
      update: {},
      create: { formationId: formations[n.formation].id, ...n },
    });
  }
  console.log(`   ${niveauxData.length} niveaux créés`);

  // ============================================
  // 9. Groupes (à partir des données FET)
  // ============================================
  console.log('👥 Création des groupes...');
  const groupes: Record<string, any> = {};
  let groupeOrdre = 1;
  for (const y of years) {
    const niveauKey = `${y.name}:${y.name}`;
    const niveauId = niveaux[niveauKey]?.id;
    if (!niveauId) {
      console.warn(`   Niveau non trouvé pour ${y.name}`);
      continue;
    }
    for (const g of y.groups) {
      const groupeCode = `${y.name}-${g.name}`;
      const parentId = undefined; // Pas de hiérarchie parent/enfant dans le FET
      groupes[groupeCode] = await prisma.groupe.upsert({
        where: { niveauId_semestreId_code: { niveauId, semestreId: semestre.id, code: groupeCode } },
        update: {},
        create: {
          niveauId,
          semestreId: semestre.id,
          parentId,
          type: 'SECTION',
          code: groupeCode,
          libelle: g.longName || g.name,
          effectif: g.numberOfStudents || 30,
          ordre: groupeOrdre++,
        },
      });
    }
  }
  console.log(`   ${Object.keys(groupes).length} groupes créés`);


  // ============================================
  // 10. Types de salle, Sites, Équipements
  // ============================================
  console.log('🏫 Création des types de salle, sites et équipements...');
  const typesSalle: Record<string, any> = {};
  for (const t of [
    { code: 'AMPHI', libelle: 'Amphithéâtre' },
    { code: 'TD', libelle: 'Salle de TD' },
    { code: 'TP', libelle: 'Salle de TP' },
    { code: 'BUREAU', libelle: 'Bureau' },
    { code: 'SALLE_CI', libelle: 'Salle CI' },
  ]) {
    typesSalle[t.code] = await prisma.typeSalle.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
  }

  const sitePrincipal = await prisma.site.upsert({
    where: { code: 'SITE-PRINCIPAL' },
    update: {},
    create: { code: 'SITE-PRINCIPAL', libelle: 'Campus Principal', estPrincipal: true },
  });

  const equipements: Record<string, any> = {};
  for (const e of [
    { code: 'VIDEOPROJ', libelle: 'Vidéo projecteur' },
    { code: 'TABLEAU', libelle: 'Tableau blanc' },
    { code: 'ORDINATEUR', libelle: 'Ordinateur' },
    { code: 'WIFI', libelle: 'WiFi' },
    { code: 'CLIM', libelle: 'Climatisation' },
  ]) {
    equipements[e.code] = await prisma.equipement.upsert({
      where: { code: e.code },
      update: {},
      create: e,
    });
  }

  // ============================================
  // 11. Salles (à partir des données FET, capacités corrigées)
  // ============================================
  console.log('🏫 Création des salles...');
  const salles: Record<string, any> = {};
  for (const r of rooms) {
    // Déduire le type de salle à partir du nom
    let typeCode = 'TD';
    let departementCode = 'INFO';
    const nameUpper = r.name.toUpperCase();
    if (nameUpper.includes('AMPHI') || nameUpper.includes('AMPHITHEATRE')) {
      typeCode = 'AMPHI';
    } else if (nameUpper.includes('LABO') || nameUpper.includes('ATELIER')) {
      typeCode = 'TP';
    } else if (nameUpper.includes('BUREAU')) {
      typeCode = 'BUREAU';
    } else if (nameUpper.includes('CI')) {
      typeCode = 'CI';
    }

    const cap = CAPACITE_PAR_TYPE[typeCode];
    const salleCode = `SALLE-${r.name.replace(/\s+/g, '_').toUpperCase()}`;
    salles[salleCode] = await prisma.salle.upsert({
      where: { code: salleCode },
      update: {},
      create: {
        code: salleCode,
        libelle: r.name,
        siteId: sitePrincipal.id,
        capaciteMax: cap.max,
        capaciteRecommandee: cap.recommandee,
        accesPMR: true,
        departementId: departements[departementCode]?.id,
        typeSalleId: typesSalle[typeCode].id,
      },
    });
    // Équipements par défaut selon le type
    const defaultEqs = typeCode === 'AMPHI' ? ['VIDEOPROJ', 'TABLEAU', 'WIFI', 'CLIM']
      : typeCode === 'TP' ? ['ORDINATEUR', 'VIDEOPROJ', 'TABLEAU', 'WIFI']
        : ['TABLEAU', 'WIFI'];
    for (const eqCode of defaultEqs) {
      await prisma.salleEquipement.create({
        data: { salleId: salles[salleCode].id, equipementId: equipements[eqCode].id },
      });
    }
  }
  console.log(`   ${Object.keys(salles).length} salles créées`);


  // ============================================
  // 12. Enseignants (à partir des données FET)
  // ============================================
  console.log('👨‍🏫 Création des enseignants...');
  const enseignants: Record<string, any> = {};
  const gradesValues = Object.values(grades);
  let gradeIndex = 0;
  for (const t of teachers) {
    const matricule = `ENS${String(enseignants.length + 1).padStart(3, '0')}`;
    const nameParts = t.name.trim().split(' ');
    const nom = nameParts.pop() || 'INCONNU';
    const prenom = nameParts.join(' ') || 'INCONNU';
    const email = `${prenom.toLowerCase()}.${nom.toLowerCase()}@isamk.tn`.replace(/\s+/g, '.');
    const grade = gradesValues[gradeIndex % gradesValues.length];
    gradeIndex++;
    const deptCode = Object.keys(departements)[0] || 'INFO';
    enseignants[t.name.trim()] = await prisma.enseignant.upsert({
      where: { matricule },
      update: {},
      create: {
        matricule,
        nom,
        prenom,
        email,
        departementId: departements[deptCode].id,
        gradeId: grade.id,
        targetHours: t.targetHours || 0,
      },
    });
  }
  console.log(`   ${Object.keys(enseignants).length} enseignants créés`);

  // ============================================
  // 13. Modules (sujets FET)
  // ============================================
  console.log('📖 Création des modules...');
  const modules: Record<string, any> = {};
  let moduleCounter = 1;
  const sujetsSansCode = subjects.filter((s: any) => !s.code);

  // Construire un mapping sujet → niveauId en analysant les activités
  const sujetToNiveauId: Record<string, string> = {};
  for (const a of activities) {
    if (sujetToNiveauId[a.subject]) continue;
    // Chercher un groupe étudiant correspondant dans les groupes créés
    const groupeEtudiant = a.students[0];
    if (!groupeEtudiant) continue;
    const groupeCle = Object.entries(groupes).find(([code, g]: [string, any]) => g.libelle === groupeEtudiant || g.code === groupeEtudiant || code === groupeEtudiant);
    if (groupeCle) {
      const g = groupeCle[1];
      sujetToNiveauId[a.subject] = g.niveauId;
    }
  }
  // Niveau par défaut (premier niveau disponible)
  const defaultNiveauId = Object.values(niveaux)[0]?.id;

  for (const s of subjects) {
    const code = s.code || `MOD${String(moduleCounter++).padStart(3, '0')}`;
    const niveauId = sujetToNiveauId[s.name] || defaultNiveauId;
    let typeId = typesEnseignement['CM'].id;
    let gradeId = grades['MAITRE_CONFERENCES'].id;
    let semestreNumero = 2;
    let credits = 6;
    let effectifMax = 60;

    // Chercher une activité avec ce sujet pour déduire le type d'enseignement
    const activitePourSujet = activities.find((a: any) => a.subject === s.name);
    if (activitePourSujet) {
      const typeCode = TAG_TO_TYPE_CODE[activitePourSujet.activityTag] || 'CM';
      typeId = typesEnseignement[typeCode]?.id || typesEnseignement['CM'].id;
    }

    modules[code] = await prisma.module.upsert({
      where: { niveauId_code_semestreNumero: { niveauId: niveauId as string, code, semestreNumero } },
      update: {},
      create: {
        niveauId: niveauId as string,
        typeId,
        gradeId,
        code,
        libelle: s.name,
        semestreNumero,
        credits,
        effectifMax,
        originId: s.name,
      },
    });
  }
  console.log(`   ${Object.keys(modules).length} modules créés`);


  // ============================================
  // 14. ModuleVolumes (volumes horaires calculés depuis les activités FET)
  // ============================================
  console.log('⏱️ Création des volumes horaires...');
  // Calculer le volume total par sujet + type d'enseignement
  const volumeMap: Record<string, Record<string, number>> = {};
  for (const a of activities) {
    const typeCode = TAG_TO_TYPE_CODE[a.activityTag] || 'CM';
    if (!volumeMap[a.subject]) volumeMap[a.subject] = {};
    volumeMap[a.subject][typeCode] = (volumeMap[a.subject][typeCode] || 0) + a.duration;
  }
  let volumeCount = 0;
  for (const [subjectName, volumes] of Object.entries(volumeMap)) {
    // Trouver le module correspondant
    const module = Object.values(modules).find((m: any) => m.libelle === subjectName || m.originId === subjectName);
    if (!module) {
      console.warn(`   Module non trouvé pour le sujet: ${subjectName}`);
      continue;
    }
    for (const [typeCode, totalDuration] of Object.entries(volumes)) {
      const typeId = Object.values(typesEnseignement).find((t: any) => t.code === typeCode)?.id;
      if (!typeId) continue;
      await prisma.moduleVolume.upsert({
        where: { moduleId_type: { moduleId: module.id, type: typeCode } },
        update: {},
        create: { moduleId: module.id, type: typeCode, volume: totalDuration * 30 }, // en minutes
      });
      volumeCount++;
    }
  }
  console.log(`   ${volumeCount} volumes horaires créés`);


  // ============================================
  // 15. EnseignantModule (qui enseigne quoi, déduit des activités FET)
  // ============================================
  console.log('🎯 Création des relations enseignant-module...');
  const emSet = new Set<string>();
  let emCount = 0;
  for (const a of activities) {
    const ens = enseignants[a.teacher];
    const mod = Object.values(modules).find((m: any) => m.libelle === a.subject || m.originId === a.subject);
    if (!ens || !mod) continue;
    const key = `${ens.id}-${mod.id}`;
    if (emSet.has(key)) continue;
    emSet.add(key);
    await prisma.enseignantModule.upsert({
      where: { enseignantId_moduleId: { enseignantId: ens.id, moduleId: mod.id } },
      update: {},
      create: { enseignantId: ens.id, moduleId: mod.id },
    });
    emCount++;
  }
  console.log(`   ${emCount} relations enseignant-module créées`);

  // ============================================
  // 16. Creneaux (grille horaire depuis les données FET)
  // ============================================
  console.log('🕐 Création des créneaux horaires...');
  const JOURS_MAP: Record<string, string> = {
    'Lundi': 'LUNDI', 'Mardi': 'MARDI', 'Mercredi': 'MERCREDI',
    'Jeudi': 'JEUDI', 'Vendredi': 'VENDREDI', 'Samedi': 'SAMEDI',
  };
  let creneauCount = 0;
  for (const jourName of days) {
    const jourEnum = JOURS_MAP[jourName] || 'LUNDI';
    for (let i = 0; i < hours.length; i++) {
      const heureName = hours[i]; // ex: "08:30"
      const [h, m] = heureName.split(':').map(Number);
      const debutMin = h * 60 + m;
      const finMin = debutMin + 30; // 30 min par créneau
      const hDebut = Math.floor(debutMin / 60).toString().padStart(2, '0');
      const mDebut = (debutMin % 60).toString().padStart(2, '0');
      const hFin = Math.floor(finMin / 60).toString().padStart(2, '0');
      const mFin = (finMin % 60).toString().padStart(2, '0');
      const estPause = debutMin >= 12 * 60 && debutMin < 14 * 60; // pause 12h-14h
      await prisma.creneau.create({
        data: {
          semestreId: semestre.id,
          jour: jourEnum as any,
          ordre: i + 1,
          heureDebut: new Date(`2026-01-01T${hDebut}:${mDebut}:00`),
          heureFin: new Date(`2026-01-01T${hFin}:${mFin}:00`),
          estPause,
          estActive: true,
        },
      });
      creneauCount++;
    }
  }
  console.log(`   ${creneauCount} créneaux créés`);


  // ============================================
  // 17. Jeu de règles de charge (HY-05)
  // ============================================
  console.log('⚖️ Création du jeu de règles de charge (HY-05)...');
  const chargeRuleSet = await prisma.chargeRuleSet.upsert({
    where: { numero: 1 },
    update: {},
    create: {
      numero: 1,
      periode: 'SEMESTRIELLE',
      seuil: 1,
      plafond: 4,
      arrondi: 30,
      anneeId: annee.id,
    },
  });

  for (const grade of Object.values(grades)) {
    await prisma.chargeReferenceGrade.create({
      data: {
        rulesetId: chargeRuleSet.id,
        gradeId: grade.id,
        coefficient: new Prisma.Decimal(0),
      },
    });
  }

  for (const type of Object.values(typesEnseignement)) {
    await prisma.chargeCoefficient.create({
      data: {
        rulesetId: chargeRuleSet.id,
        typeId: type.id,
        coefficient: new Prisma.Decimal(1),
      },
    });
  }

  // ============================================
  // 18. Contraintes par défaut
  // ============================================
  console.log('📋 Création des définitions de contrainte...');
  const contrainteDefinitions = [
    { code: 'MAX_HOURS_PER_DAY', libelle: 'Maximum d\'heures par jour', categorie: 'DURE', portee: 'GLOBALE', classe: 'HARD_CONSTRAINT', traductionFET: 'FET_SUPPORTED', paramsSchema: { type: 'object', properties: { heures: { type: 'integer', minimum: 1 } }, required: ['heures'] }, fetSupport: 'NATIF', actif: true },
    { code: 'MIN_HOURS_PER_DAY', libelle: 'Minimum d\'heures par jour', categorie: 'DURE', portee: 'GLOBALE', classe: 'HARD_CONSTRAINT', traductionFET: 'FET_SUPPORTED', paramsSchema: { type: 'object', properties: { heures: { type: 'integer', minimum: 0 }, joursVidesAutorises: { type: 'boolean' } }, required: ['heures'] }, fetSupport: 'NATIF', actif: true },
    { code: 'MAX_CONTINUOUS_HOURS', libelle: 'Maximum d\'heures continues', categorie: 'DURE', portee: 'GLOBALE', classe: 'HARD_CONSTRAINT', traductionFET: 'FET_SUPPORTED', paramsSchema: { type: 'object', properties: { heures: { type: 'integer', minimum: 1 } }, required: ['heures'] }, fetSupport: 'NATIF', actif: true },
    { code: 'MIN_CONTINUOUS_HOURS', libelle: 'Minimum d\'heures continues', categorie: 'SOUPLE', portee: 'GLOBALE', classe: 'SOFT_CONSTRAINT', traductionFET: 'FET_TRANSFORMED', paramsSchema: { type: 'object', properties: { heures: { type: 'integer', minimum: 1 } }, required: ['heures'] }, fetSupport: 'PARTIEL', actif: true },
    { code: 'MAX_GAPS_PER_DAY', libelle: 'Maximum de creux par jour', categorie: 'DURE', portee: 'GLOBALE', classe: 'HARD_CONSTRAINT', traductionFET: 'FET_SUPPORTED', paramsSchema: { type: 'object', properties: { creux: { type: 'integer', minimum: 0 } }, required: ['creux'] }, fetSupport: 'NATIF', actif: true },
    { code: 'MAX_GAPS_PER_WEEK', libelle: 'Maximum de creux par semaine', categorie: 'DURE', portee: 'GLOBALE', classe: 'HARD_CONSTRAINT', traductionFET: 'FET_SUPPORTED', paramsSchema: { type: 'object', properties: { creux: { type: 'integer', minimum: 0 } }, required: ['creux'] }, fetSupport: 'NATIF', actif: true },
    { code: 'MAX_DAYS_PER_WEEK', libelle: 'Maximum de jours par semaine', categorie: 'DURE', portee: 'GLOBALE', classe: 'HARD_CONSTRAINT', traductionFET: 'FET_SUPPORTED', paramsSchema: { type: 'object', properties: { jours: { type: 'integer', minimum: 1 } }, required: ['jours'] }, fetSupport: 'NATIF', actif: true },
    { code: 'MIN_DAYS_PER_WEEK', libelle: 'Minimum de jours par semaine', categorie: 'DURE', portee: 'GLOBALE', classe: 'HARD_CONSTRAINT', traductionFET: 'FET_SUPPORTED', paramsSchema: { type: 'object', properties: { jours: { type: 'integer', minimum: 1 } }, required: ['jours'] }, fetSupport: 'NATIF', actif: true },
    { code: 'MAX_SPAN_PER_DAY', libelle: 'Amplitude journalière maximale', categorie: 'SOUPLE', portee: 'GLOBALE', classe: 'SOFT_CONSTRAINT', traductionFET: 'FET_SUPPORTED', paramsSchema: { type: 'object', properties: { heures: { type: 'integer', minimum: 1 } }, required: ['heures'] }, fetSupport: 'NATIF', actif: true },
    { code: 'MAX_HOURS_IN_INTERVAL', libelle: 'Maximum d\'heures dans un intervalle', categorie: 'DURE', portee: 'GLOBALE', classe: 'HARD_CONSTRAINT', traductionFET: 'FET_SUPPORTED', paramsSchema: { type: 'object', properties: { debut: { type: 'string' }, fin: { type: 'string' }, heures: { type: 'integer', minimum: 1 } }, required: ['debut', 'fin', 'heures'] }, fetSupport: 'NATIF', actif: true },
  ];
  for (const cd of contrainteDefinitions) {
    await prisma.contrainteDefinition.upsert({
      where: { code: cd.code },
      update: {},
      create: cd,
    });
  }


  // ============================================
  // 19. Instances de contrainte par défaut (globales)
  // ============================================
  console.log('📋 Création des instances de contrainte...');
  const defMaxHours = await prisma.contrainteDefinition.findUnique({ where: { code: 'MAX_HOURS_PER_DAY' } });
  const defMaxDays = await prisma.contrainteDefinition.findUnique({ where: { code: 'MAX_DAYS_PER_WEEK' } });
  const defMaxGaps = await prisma.contrainteDefinition.findUnique({ where: { code: 'MAX_GAPS_PER_DAY' } });

  if (defMaxHours) {
    await prisma.contrainteInstance.create({
      data: {
        semestreId: semestre.id,
        definitionId: defMaxHours.id,
        params: { heures: 8 },
        poids: 100,
        nature: 'REGLE',
        commentaire: 'Maximum 8 heures par jour par enseignant',
        actif: true,
        creePar: 'system',
      },
    });
  }
  if (defMaxDays) {
    await prisma.contrainteInstance.create({
      data: {
        semestreId: semestre.id,
        definitionId: defMaxDays.id,
        params: { jours: 5 },
        poids: 100,
        nature: 'REGLE',
        commentaire: 'Maximum 5 jours travaillés par semaine',
        actif: true,
        creePar: 'system',
      },
    });
  }
  if (defMaxGaps) {
    await prisma.contrainteInstance.create({
      data: {
        semestreId: semestre.id,
        definitionId: defMaxGaps.id,
        params: { creux: 2 },
        poids: 80,
        nature: 'REGLE',
        commentaire: 'Maximum 2 creux par jour',
        actif: true,
        creePar: 'system',
      },
    });
  }

  // ============================================
  // 20. Répartition par défaut (BROUILLON)
  // ============================================
  console.log('📊 Création de la répartition par défaut...');
  for (const dept of Object.values(departements)) {
    await prisma.repartition.create({
      data: {
        semestreId: semestre.id,
        departementId: dept.id,
        statut: 'BROUILLON',
      },
    });
  }

  console.log('✅ Seed terminé avec succès !');
  console.log(`   Année: ${annee.code} (${annee.id})`);
  console.log(`   Semestre: S${semestre.numero} (${semestre.id})`);
  console.log(`   Départements: ${Object.keys(departements).length}`);
  console.log(`   Formations: ${Object.keys(formations).length}`);
  console.log(`   Niveaux: ${Object.keys(niveaux).length}`);
  console.log(`   Groupes: ${Object.keys(groupes).length}`);
  console.log(`   Enseignants: ${Object.keys(enseignants).length}`);
  console.log(`   Modules: ${Object.keys(modules).length}`);
  console.log(`   Salles: ${Object.keys(salles).length}`);
}

try {
  main();
} catch (e) {
  console.error('❌ Erreur lors du seed:', e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

