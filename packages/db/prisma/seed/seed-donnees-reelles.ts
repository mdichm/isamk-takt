/**
 * Script de seed — Données réelles S4 (semestre 4) de l'ISAMK
 * Ticket L7-16 : Recette sur données réelles
 *
 * Ce script charge des données de référence pour le semestre S4.
 * ⚠️  Les données doivent être complétées avec les vraies données de l'ISAMK
 *    collectées auprès de la maîtrise d'ouvrage.
 *
 * Valeurs initiales du jeu de règles de charge (conformément à ST_TAKT.md §0.4 HY-05) :
 *   - Charge de référence : 0 pour tous les grades
 *   - Coefficients : CM=1, TD=1, TP=1, CI=1
 *   - Seuil : 1, Plafond : 4
 */

import { PrismaClient } from '@takt/db';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed — Données réelles S4 (L7-16)');

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
  // 2. Semestre 4 (S4)
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
  // 3. Types d'enseignement (CM, TD, TP, CI, AUTRE)
  // ============================================
  console.log('📚 Création des types d\'enseignement...');
  const typesEnseignement: Record<string, any> = {};
  for (const code of ['CM', 'TD', 'TP', 'CI', 'AUTRE'] as const) {
    typesEnseignement[code] = await prisma.typeEnseignement.upsert({
      where: { code },
      update: {},
      create: {
        code,
        libelle: code === 'CM' ? 'Cours Magistral'
          : code === 'TD' ? 'Travaux Dirigés'
          : code === 'TP' ? 'Travaux Pratiques'
          : code === 'CI' ? 'Cours Intégré'
          : 'Autre',
      },
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
  // 5. ActivityTags (un par type d'enseignement)
  // ============================================
  console.log('🏷️ Création des activity tags...');
  const activityTags: Record<string, any> = {};
  for (const code of ['CM', 'TD', 'TP', 'CI', 'AUTRE'] as const) {
    activityTags[code] = await prisma.activityTag.upsert({
      where: { code: `TAG_${code}` },
      update: {},
      create: {
        code: `TAG_${code}`,
        libelle: `Tag ${typesEnseignement[code].libelle}`,
        isActive: true,
      },
    });
  }

  for (const code of ['CM', 'TD', 'TP', 'CI', 'AUTRE'] as const) {
    await prisma.typeEnseignement.update({
      where: { id: typesEnseignement[code].id },
      data: { activityTagId: activityTags[code].id },
    });
  }

  // ============================================
  // 6. Départements
  // ============================================
  console.log('🏢 Création des départements...');
  const departements: Record<string, any> = {};
  const departementsData = [
    { code: 'INFO', libelle: 'Informatique', ordre: 1 },
    { code: 'MATH', libelle: 'Mathématiques', ordre: 2 },
    { code: 'PHYSIQUE', libelle: 'Physique', ordre: 3 },
    { code: 'ELECTRO', libelle: 'Électrotechnique', ordre: 4 },
    { code: 'GENIE_CIVIL', libelle: 'Génie Civil', ordre: 5 },
  ];
  for (const d of departementsData) {
    departements[d.code] = await prisma.departement.upsert({
      where: { anneeId_code: { anneeId: annee.id, code: d.code } },
      update: {},
      create: { anneeId: annee.id, ...d },
    });
  }

  // ============================================
  // 7. Formations
  // ============================================
  console.log('🎓 Création des formations...');
  const formations: Record<string, any> = {};
  const formationsData = [
    { departement: 'INFO', code: 'L3-INFO', libelle: 'Licence 3 Informatique', ordre: 1 },
    { departement: 'INFO', code: 'M1-INFO', libelle: 'Master 1 Informatique', ordre: 2 },
    { departement: 'MATH', code: 'L3-MATH', libelle: 'Licence 3 Mathématiques', ordre: 1 },
    { departement: 'PHYSIQUE', code: 'L3-PHYS', libelle: 'Licence 3 Physique', ordre: 1 },
    { departement: 'ELECTRO', code: 'L3-ELEC', libelle: 'Licence 3 Électrotechnique', ordre: 1 },
  ];
  for (const f of formationsData) {
    formations[f.code] = await prisma.formation.upsert({
      where: { departementId_code: { departementId: departements[f.departement].id, code: f.code } },
      update: {},
      create: { departementId: departements[f.departement].id, ...f },
    });
  }

  // ============================================
  // 8. Niveaux
  // ============================================
  console.log('📋 Création des niveaux...');
  const niveaux: Record<string, any> = {};
  const niveauxData = [
    { formation: 'L3-INFO', code: 'L3', libelle: 'Licence 3', ordre: 1 },
    { formation: 'M1-INFO', code: 'M1', libelle: 'Master 1', ordre: 1 },
    { formation: 'L3-MATH', code: 'L3', libelle: 'Licence 3', ordre: 1 },
    { formation: 'L3-PHYS', code: 'L3', libelle: 'Licence 3', ordre: 1 },
    { formation: 'L3-ELEC', code: 'L3', libelle: 'Licence 3', ordre: 1 },
  ];
  for (const n of niveauxData) {
    niveaux[n.formation + ':' + n.code] = await prisma.niveau.upsert({
      where: { formationId_code: { formationId: formations[n.formation].id, code: n.code } },
      update: {},
      create: { formationId: formations[n.formation].id, ...n },
    });
  }


  // ============================================
  // 9. Groupes (avec divisions TD/TP)
  // ============================================
  console.log('👥 Création des groupes...');
  const groupes: Record<string, any> = {};
  const groupesData = [
    { niveau: 'L3-INFO:L3', code: 'L3-INFO-S4', libelle: 'L3 Informatique S4', type: 'SECTION', effectif: 60, ordre: 1 },
    { niveau: 'L3-INFO:L3', code: 'L3-INFO-S4-TD-A', libelle: 'L3 Info S4 TD A', type: 'GROUPE', effectif: 30, parent: 'L3-INFO-S4', ordre: 2 },
    { niveau: 'L3-INFO:L3', code: 'L3-INFO-S4-TD-B', libelle: 'L3 Info S4 TD B', type: 'GROUPE', effectif: 30, parent: 'L3-INFO-S4', ordre: 3 },
    { niveau: 'L3-INFO:L3', code: 'L3-INFO-S4-TP-A', libelle: 'L3 Info S4 TP A', type: 'SOUS_GROUPE', effectif: 15, parent: 'L3-INFO-S4-TD-A', ordre: 4 },
    { niveau: 'L3-INFO:L3', code: 'L3-INFO-S4-TP-B', libelle: 'L3 Info S4 TP B', type: 'SOUS_GROUPE', effectif: 15, parent: 'L3-INFO-S4-TD-A', ordre: 5 },
    { niveau: 'L3-INFO:L3', code: 'L3-INFO-S4-TP-C', libelle: 'L3 Info S4 TP C', type: 'SOUS_GROUPE', effectif: 15, parent: 'L3-INFO-S4-TD-B', ordre: 6 },
    { niveau: 'L3-INFO:L3', code: 'L3-INFO-S4-TP-D', libelle: 'L3 Info S4 TP D', type: 'SOUS_GROUPE', effectif: 15, parent: 'L3-INFO-S4-TD-B', ordre: 7 },
    { niveau: 'M1-INFO:M1', code: 'M1-INFO-S4', libelle: 'M1 Informatique S4', type: 'SECTION', effectif: 40, ordre: 1 },
    { niveau: 'M1-INFO:M1', code: 'M1-INFO-S4-TD-A', libelle: 'M1 Info S4 TD A', type: 'GROUPE', effectif: 20, parent: 'M1-INFO-S4', ordre: 2 },
    { niveau: 'M1-INFO:M1', code: 'M1-INFO-S4-TD-B', libelle: 'M1 Info S4 TD B', type: 'GROUPE', effectif: 20, parent: 'M1-INFO-S4', ordre: 3 },
    { niveau: 'L3-MATH:L3', code: 'L3-MATH-S4', libelle: 'L3 Math S4', type: 'SECTION', effectif: 50, ordre: 1 },
    { niveau: 'L3-MATH:L3', code: 'L3-MATH-S4-TD-A', libelle: 'L3 Math S4 TD A', type: 'GROUPE', effectif: 25, parent: 'L3-MATH-S4', ordre: 2 },
    { niveau: 'L3-MATH:L3', code: 'L3-MATH-S4-TD-B', libelle: 'L3 Math S4 TD B', type: 'GROUPE', effectif: 25, parent: 'L3-MATH-S4', ordre: 3 },
  ];
  for (const g of groupesData) {
    const niveauKey = g.niveau;
    const parentId = g.parent ? groupes[g.parent]?.id : undefined;
    groupes[g.code] = await prisma.groupe.upsert({
      where: { niveauId_semestreId_code: { niveauId: niveaux[niveauKey].id, semestreId: semestre.id, code: g.code } },
      update: {},
      create: {
        niveauId: niveaux[niveauKey].id,
        semestreId: semestre.id,
        parentId,
        type: g.type,
        code: g.code,
        libelle: g.libelle,
        effectif: g.effectif,
        ordre: g.ordre,
      },
    });
  }


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
  // 11. Salles
  // ============================================
  console.log('🏫 Création des salles...');
  const salles: Record<string, any> = {};
  const sallesData = [
    { code: 'AMPHI-A', libelle: 'Amphithéâtre A', type: 'AMPHI', capaciteMax: 120, capaciteRecommandee: 100, departement: 'INFO', equipements: ['VIDEOPROJ', 'TABLEAU', 'WIFI', 'CLIM'] },
    { code: 'AMPHI-B', libelle: 'Amphithéâtre B', type: 'AMPHI', capaciteMax: 100, capaciteRecommandee: 80, departement: 'INFO', equipements: ['VIDEOPROJ', 'TABLEAU', 'WIFI'] },
    { code: 'TD-1', libelle: 'Salle TD 1', type: 'TD', capaciteMax: 35, capaciteRecommandee: 30, departement: 'INFO', equipements: ['TABLEAU', 'WIFI'] },
    { code: 'TD-2', libelle: 'Salle TD 2', type: 'TD', capaciteMax: 35, capaciteRecommandee: 30, departement: 'INFO', equipements: ['TABLEAU', 'WIFI'] },
    { code: 'TD-3', libelle: 'Salle TD 3', type: 'TD', capaciteMax: 30, capaciteRecommandee: 25, departement: 'MATH', equipements: ['TABLEAU', 'WIFI'] },
    { code: 'TP-INFO-1', libelle: 'Salle TP Info 1', type: 'TP', capaciteMax: 24, capaciteRecommandee: 20, departement: 'INFO', equipements: ['ORDINATEUR', 'VIDEOPROJ', 'TABLEAU', 'WIFI'] },
    { code: 'TP-INFO-2', libelle: 'Salle TP Info 2', type: 'TP', capaciteMax: 24, capaciteRecommandee: 20, departement: 'INFO', equipements: ['ORDINATEUR', 'VIDEOPROJ', 'TABLEAU', 'WIFI'] },
    { code: 'TP-PHYS-1', libelle: 'Salle TP Physique 1', type: 'TP', capaciteMax: 20, capaciteRecommandee: 16, departement: 'PHYSIQUE', equipements: ['TABLEAU', 'WIFI'] },
    { code: 'SALLE-CI-1', libelle: 'Salle CI 1', type: 'SALLE_CI', capaciteMax: 30, capaciteRecommandee: 25, departement: 'INFO', equipements: ['VIDEOPROJ', 'TABLEAU', 'WIFI'] },
    { code: 'BUREAU-101', libelle: 'Bureau 101', type: 'BUREAU', capaciteMax: 4, capaciteRecommandee: 4, departement: 'INFO', equipements: ['ORDINATEUR', 'WIFI'] },
  ];
  for (const s of sallesData) {
    salles[s.code] = await prisma.salle.upsert({
      where: { code: s.code },
      update: {},
      create: {
        code: s.code,
        libelle: s.libelle,
        siteId: sitePrincipal.id,
        capaciteMax: s.capaciteMax,
        capaciteRecommandee: s.capaciteRecommandee,
        accesPMR: true,
        departementId: departements[s.departement]?.id,
        typeSalleId: typesSalle[s.type].id,
      },
    });
    for (const eqCode of s.equipements) {
      await prisma.salleEquipement.create({
        data: { salleId: salles[s.code].id, equipementId: equipements[eqCode].id },
      });
    }
  }


  // ============================================
  // 12. Enseignants
  // ============================================
  console.log('👨‍🏫 Création des enseignants...');
  const enseignants: Record<string, any> = {};
  const enseignantsData = [
    { matricule: 'ENS001', nom: 'Martin', prenom: 'Jean', email: 'jean.martin@isamk.tn', departement: 'INFO', grade: 'MAITRE_CONFERENCES' },
    { matricule: 'ENS002', nom: 'Dubois', prenom: 'Marie', email: 'marie.dubois@isamk.tn', departement: 'INFO', grade: 'MAITRE_CONFERENCES' },
    { matricule: 'ENS003', nom: 'Durand', prenom: 'Pierre', email: 'pierre.durand@isamk.tn', departement: 'INFO', grade: 'ASSISTANT' },
    { matricule: 'ENS004', nom: 'Petit', prenom: 'Sophie', email: 'sophie.petit@isamk.tn', departement: 'MATH', grade: 'PROFESSEUR' },
    { matricule: 'ENS005', nom: 'Bernard', prenom: 'Luc', email: 'luc.bernard@isamk.tn', departement: 'PHYSIQUE', grade: 'MAITRE_CONFERENCES' },
    { matricule: 'ENS006', nom: 'Roux', prenom: 'Claire', email: 'claire.roux@isamk.tn', departement: 'ELECTRO', grade: 'MAITRE_ASSISTANT' },
    { matricule: 'ENS007', nom: 'Moreau', prenom: 'Paul', email: 'paul.moreau@isamk.tn', departement: 'INFO', grade: 'VACATAIRE' },
    { matricule: 'ENS008', nom: 'Laurent', prenom: 'Anne', email: 'anne.laurent@isamk.tn', departement: 'MATH', grade: 'PES' },
    { matricule: 'ENS009', nom: 'Michel', prenom: 'David', email: 'david.michel@isamk.tn', departement: 'INFO', grade: 'CONTRAT_EXPERT' },
    { matricule: 'ENS010', nom: 'Garcia', prenom: 'Elena', email: 'elena.garcia@isamk.tn', departement: 'GENIE_CIVIL', grade: 'MAITRE_ASSISTANT' },
  ];
  for (const e of enseignantsData) {
    enseignants[e.matricule] = await prisma.enseignant.upsert({
      where: { anneeId_matricule: { anneeId: annee.id, matricule: e.matricule } },
      update: {},
      create: {
        matricule: e.matricule,
        nom: e.nom,
        prenom: e.prenom,
        email: e.email,
        telephone: null,
        isActive: true,
        anneeId: annee.id,
        departementId: departements[e.departement].id,
        gradeId: grades[e.grade].id,
      },
    });
  }

  // ============================================
  // 13. Modules (avec codes et semestre S4 = 2)
  // ============================================
  console.log('📖 Création des modules...');
  const modules: Record<string, any> = {};
  const modulesData = [
    { niveau: 'L3-INFO:L3', code: 'INFO401', libelle: 'Algorithmique avancée', type: 'CM', grade: 'MAITRE_CONFERENCES', semestreNumero: 2, credits: 6, effectifMax: 60 },
    { niveau: 'L3-INFO:L3', code: 'INFO402', libelle: 'Bases de données', type: 'CM', grade: 'MAITRE_CONFERENCES', semestreNumero: 2, credits: 6, effectifMax: 60 },
    { niveau: 'L3-INFO:L3', code: 'INFO403', libelle: 'Programmation web', type: 'CM', grade: 'ASSISTANT', semestreNumero: 2, credits: 6, effectifMax: 60 },
    { niveau: 'L3-INFO:L3', code: 'INFO404', libelle: 'Réseaux informatiques', type: 'CM', grade: 'MAITRE_CONFERENCES', semestreNumero: 2, credits: 6, effectifMax: 60 },
    { niveau: 'L3-INFO:L3', code: 'INFO405', libelle: 'Génie logiciel', type: 'CM', grade: 'MAITRE_CONFERENCES', semestreNumero: 2, credits: 6, effectifMax: 60 },
    { niveau: 'M1-INFO:M1', code: 'INFO501', libelle: 'Intelligence artificielle', type: 'CM', grade: 'PROFESSEUR', semestreNumero: 2, credits: 6, effectifMax: 40 },
    { niveau: 'M1-INFO:M1', code: 'INFO502', libelle: 'Sécurité des systèmes', type: 'CM', grade: 'MAITRE_CONFERENCES', semestreNumero: 2, credits: 6, effectifMax: 40 },
    { niveau: 'L3-MATH:L3', code: 'MATH401', libelle: 'Analyse réelle', type: 'CM', grade: 'PROFESSEUR', semestreNumero: 2, credits: 6, effectifMax: 50 },
    { niveau: 'L3-MATH:L3', code: 'MATH402', libelle: 'Algèbre linéaire', type: 'CM', grade: 'MAITRE_CONFERENCES', semestreNumero: 2, credits: 6, effectifMax: 50 },
  ];
  for (const m of modulesData) {
    modules[m.code] = await prisma.module.upsert({
      where: { niveauId_code_semestreNumero: { niveauId: niveaux[m.niveau].id, code: m.code, semestreNumero: m.semestreNumero } },
      update: {},
      create: {
        niveauId: niveaux[m.niveau].id,
        typeId: typesEnseignement[m.type].id,
        gradeId: grades[m.grade]?.id,
        code: m.code,
        libelle: m.libelle,
        semestreNumero: m.semestreNumero,
        credits: m.credits,
        effectifMax: m.effectifMax,
      },
    });
  }


  // ============================================
  // 14. ModuleVolumes (volumes horaires en minutes, multiple de 30)
  // ============================================
  console.log('⏱️ Création des volumes horaires...');
  const moduleVolumesData = [
    { module: 'INFO401', volumes: [{ type: 'CM', volume: 1800 }, { type: 'TD', volume: 1800 }, { type: 'TP', volume: 900 }] },
    { module: 'INFO402', volumes: [{ type: 'CM', volume: 1800 }, { type: 'TD', volume: 1800 }, { type: 'TP', volume: 900 }] },
    { module: 'INFO403', volumes: [{ type: 'CM', volume: 1440 }, { type: 'TD', volume: 2160 }, { type: 'TP', volume: 1800 }] },
    { module: 'INFO404', volumes: [{ type: 'CM', volume: 1800 }, { type: 'TD', volume: 1800 }, { type: 'TP', volume: 900 }] },
    { module: 'INFO405', volumes: [{ type: 'CM', volume: 1440 }, { type: 'TD', volume: 2160 }] },
    { module: 'INFO501', volumes: [{ type: 'CM', volume: 1800 }, { type: 'TD', volume: 1800 }] },
    { module: 'INFO502', volumes: [{ type: 'CM', volume: 1800 }, { type: 'TD', volume: 1800 }] },
    { module: 'MATH401', volumes: [{ type: 'CM', volume: 2160 }, { type: 'TD', volume: 1440 }] },
    { module: 'MATH402', volumes: [{ type: 'CM', volume: 2160 }, { type: 'TD', volume: 1440 }] },
  ];
  for (const mv of moduleVolumesData) {
    const module = modules[mv.module];
    for (const vol of mv.volumes) {
      await prisma.moduleVolume.upsert({
        where: { moduleId_type: { moduleId: module.id, type: vol.type } },
        update: {},
        create: { moduleId: module.id, type: vol.type, volume: vol.volume },
      });
    }
  }

  // ============================================
  // 15. EnseignantModule (qui enseigne quoi)
  // ============================================
  console.log('🎯 Création des affectations enseignant-module...');
  const enseignantModulesData = [
    { enseignant: 'ENS001', module: 'INFO401' },
    { enseignant: 'ENS002', module: 'INFO402' },
    { enseignant: 'ENS003', module: 'INFO403' },
    { enseignant: 'ENS001', module: 'INFO404' },
    { enseignant: 'ENS002', module: 'INFO405' },
    { enseignant: 'ENS004', module: 'MATH401' },
    { enseignant: 'ENS004', module: 'MATH402' },
    { enseignant: 'ENS005', module: 'INFO404' },
    { enseignant: 'ENS006', module: 'INFO403' },
    { enseignant: 'ENS007', module: 'INFO501' },
    { enseignant: 'ENS008', module: 'INFO502' },
    { enseignant: 'ENS009', module: 'INFO501' },
  ];
  for (const em of enseignantModulesData) {
    await prisma.enseignantModule.upsert({
      where: { enseignantId_moduleId: { enseignantId: enseignants[em.enseignant].id, moduleId: modules[em.module].id } },
      update: {},
      create: { enseignantId: enseignants[em.enseignant].id, moduleId: modules[em.module].id },
    });
  }

  // ============================================
  // 16. Creneaux (grille horaire Lundi-Vendredi, 8h-18h)
  // ============================================
  console.log('🕐 Création des créneaux horaires...');
  const jours: string[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
  const creneauxData = [
    { ordre: 1, debut: '08:00', fin: '09:30' },
    { ordre: 2, debut: '09:30', fin: '11:00' },
    { ordre: 3, debut: '11:00', fin: '12:30' },
    { ordre: 4, debut: '14:00', fin: '15:30' },
    { ordre: 5, debut: '15:30', fin: '17:00' },
    { ordre: 6, debut: '17:00', fin: '18:30' },
  ];
  for (const jour of jours) {
    for (const c of creneauxData) {
      await prisma.creneau.create({
        data: {
          semestreId: semestre.id,
          jour: jour as any,
          ordre: c.ordre,
          heureDebut: new Date(`2026-01-01T${c.debut}:00`),
          heureFin: new Date(`2026-01-01T${c.fin}:00`),
          estPause: false,
          estActive: true,
        },
      });
    }
    await prisma.creneau.create({
      data: {
        semestreId: semestre.id,
        jour: jour as any,
        ordre: 99,
        heureDebut: new Date(`2026-01-01T12:30:00`),
        heureFin: new Date(`2026-01-01T14:00:00`),
        estPause: true,
        estActive: true,
      },
    });
  }


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
  // 19. Contraintes d'instance par défaut (globales)
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

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

