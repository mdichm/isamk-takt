// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Script de seed pour les tests de charge k6 (L7-08)
// Crée 4 000 séances et les données de référence nécessaires aux scénarios k6.
// Usage : pnpm tsx tests/load/seed.ts

import { PrismaClient, RoleCode, JourSemaine, SeanceStatut, VersionStatut, RessourceType } from '@takt/db';
import { hash as argonHash } from 'argon2';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/takt?schema=public';
const NB_SEANCES = 4000;
const OUTPUT_FILE = join(__dirname, 'k6', 'results', 'seed-ids.json');

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

  try {
    console.log('🌱 Début du seed L7-08 (4 000 séances)...');

    await prisma.parametreSecurite.upsert({
      where: { id: 1 },
      update: { longueurMin: 8 },
      create: { id: 1, longueurMin: 8 },
    });

    const annee = await prisma.annee.create({
      data: { numero: 2026, code: '2026-2027', nbSemaines: 14, statut: 'ACTIVE' },
    });
    console.log(`  Année créée : ${annee.id}`);

    const semestre = await prisma.semestre.create({
      data: { anneeId: annee.id, numero: 1, nbSemaines: 14 },
    });
    console.log(`  Semestre créé : ${semestre.id}`);

    const departement = await prisma.departement.create({
      data: { anneeId: annee.id, code: 'INFO', libelle: 'Informatique', ordre: 1 },
    });
    console.log(`  Département créé : ${departement.id}`);

    const formation = await prisma.formation.create({
      data: { departementId: departement.id, code: 'L3-INFO', libelle: 'Licence 3 Informatique', ordre: 1 },
    });
    const niveau = await prisma.niveau.create({
      data: { formationId: formation.id, code: 'L3', libelle: 'Licence 3', ordre: 1 },
    });
    const groupe = await prisma.groupe.create({
      data: { niveauId: niveau.id, semestreId: semestre.id, type: 'GROUPE', code: 'INFO-L3-S1', libelle: 'L3 Informatique S1', effectif: 60, ordre: 1 },
    });
    console.log(`  Groupe créé : ${groupe.id}`);

    const typeSalle = await prisma.typeSalle.create({ data: { code: 'AMPHI', libelle: 'Amphithâtre', estActive: true } });
    const salle = await prisma.salle.create({
      data: { code: 'AMPHI-A', libelle: 'Amphithâtre A', capaciteMax: 120, capaciteRecommandee: 100, estActive: true, departementId: departement.id, typeSalleId: typeSalle.id },
    });
    console.log(`  Salle créée : ${salle.id}`);

    const typeCM = await prisma.typeEnseignement.create({ data: { code: 'CM', libelle: 'Cours magistral' } });
    const grade = await prisma.grade.create({ data: { code: 'MCF', libelle: 'Maître de conférences' } });

    const module = await prisma.module.create({
      data: { niveauId: niveau.id, code: 'ALGO', libelle: 'Algorithmique avancée', typeId: typeCM.id, gradeId: grade.id, credits: 6, semestreNumero: 1 },
    });
    await prisma.moduleVolume.create({ data: { moduleId: module.id, type: 'CM', volume: 900 } });

    const enseignant = await prisma.enseignant.create({
      data: { matricule: 'ENS001', nom: 'Dupond', prenom: 'Marie', email: 'marie.dupond@univ.fr', isActive: true, anneeId: annee.id, departementId: departement.id, gradeId: grade.id },
    });
    await prisma.enseignantModule.create({ data: { enseignantId: enseignant.id, moduleId: module.id } });
    console.log(`  Enseignant créé : ${enseignant.id}`);

    const jours: JourSemaine[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
    const creneaux: { id: string; jour: JourSemaine; ordre: number }[] = [];
    for (let j = 0; j < jours.length; j++) {
      for (let o = 1; o <= 4; o++) {
        const c = await prisma.creneau.create({
          data: { semestreId: semestre.id, jour: jours[j], ordre: o, heureDebut: new Date(`2026-01-01T${8 + o * 2 - 2}:00:00`), heureFin: new Date(`2026-01-01T${10 + o * 2 - 2}:00:00`), estPause: false, estActive: true },
        });
        creneaux.push({ id: c.id, jour: jours[j], ordre: o });
      }
    }
    console.log(`  ${creneaux.length} créneaux créés.`);

    const password = 'TaktTest2026!';
    const passwordHash = await argonHash(password);
    const user = await prisma.user.create({
      data: {
        email: 'gestionnaire@takt.test', passwordHash, firstName: 'Gestionnaire', lastName: 'TAKT', isActive: true, provider: 'LOCAL',
        roles: { create: { role: RoleCode.GESTIONNAIRE, departementCode: departement.code } },
      },
      include: { roles: true },
    });
    console.log(`  Utilisateur créé : ${user.email}`);

    const version = await prisma.versionEdt.create({
      data: { semestreId: semestre.id, numero: '1.0', statut: VersionStatut.EDITION, revision: 0 },
    });
    console.log(`  Version créée : ${version.id}`);

    console.log(`  Création de ${NB_SEANCES} séances...`);
    const batchSize = 500;
    let created = 0;

    for (let batch = 0; batch < Math.ceil(NB_SEANCES / batchSize); batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, NB_SEANCES);

      await prisma.$transaction(
        Array.from({ length: end - start }, (_, i) => {
          const idx = start + i;
          const creneau = creneaux[idx % creneaux.length];
          const seanceNum = idx + 1;
          const affectationKey = `${groupe.id}:${module.id}:${typeCM.id}:${enseignant.id}`;

          return prisma.seance.create({
            data: {
              semestreId: semestre.id,
              versionId: version.id,
              enseignantId: enseignant.id,
              salleId: salle.id,
              affectationKey: `${affectationKey}:${seanceNum}`,
              rang: 1,
              tag: 'ALGO_CM',
              jour: creneau.jour,
              creneauDebutId: creneau.id,
              nbCreneaux: 1,
              statut: SeanceStatut.PLACEE,
              origine: 'MOTEUR',
              revision: 0,
              groupes: { create: { groupeId: groupe.id } },
              occupations: { create: [
                { jour: creneau.jour, creneauId: creneau.id, ressourceType: RessourceType.ENSEIGNANT, ressourceId: enseignant.id },
                { jour: creneau.jour, creneauId: creneau.id, ressourceType: RessourceType.SALLE, ressourceId: salle.id },
                { jour: creneau.jour, creneauId: creneau.id, ressourceType: RessourceType.GROUPE, ressourceId: groupe.id },
              ] },
            },
          });
        })
      );

      created += end - start;
      if (created % 1000 === 0) {
        console.log(`    ${created}/${NB_SEANCES} séances créées...`);
      }
    }
    console.log(`  ${created} séances créées.`);

    const profil = await prisma.profilGeneration.create({
      data: {
        semestreId: semestre.id, nom: 'Profil par défaut', numero: 1, estParDefaut: true,
        dureeLimiteMinutes: 30, preserverVerrous: false, graines: [1, 2, 3, 4, 5, 6],
        poidsScore: { dure: 50, souple: 30, distance: 20 }, valeursSnapshot: {},
      },
    });
    console.log(`  Profil de génération créé : ${profil.id}`);

    const ids = {
      userId: user.id, email: user.email, password,
      anneeId: annee.id, semestreId: semestre.id, departementId: departement.id,
      versionId: version.id, groupeId: groupe.id, enseignantId: enseignant.id,
      salleId: salle.id, creneauIds: creneaux.map(c => c.id),
      seanceCount: NB_SEANCES, profilId: profil.id,
    };

    try { mkdirSync(join(__dirname, 'k6', 'results'), { recursive: true }); } catch {}
    writeFileSync(OUTPUT_FILE, JSON.stringify(ids, null, 2));
    console.log(`
✅ Seed terminé. IDs écrits dans ${OUTPUT_FILE}`);
    console.log(`  - Email : ${user.email}`);
    console.log(`  - Mot de passe : ${password}`);
    console.log(`  - Version : ${version.id}`);
    console.log(`  - Département : ${departement.id}`);
    console.log(`  - Semestre : ${semestre.id}`);
    console.log(`  - Nombre de séances : ${NB_SEANCES}`);
  } catch (error) {
    console.error('Erreur lors du seed :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
