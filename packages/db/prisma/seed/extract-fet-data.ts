/**
 * Script d'extraction des données depuis le fichier .fet de l'ISAMK
 * Ticket L7-16 : Recette sur données réelles
 * Parsing XML sans dépendance externe (regex-based).
 */

import * as fs from 'fs';
import * as path from 'path';

const FET_FILE = '/home/mehdi/dev/isamk-takt/docs/isamk.fet';
const OUTPUT_FILE = '/home/mehdi/dev/isamk-takt/packages/db/prisma/seed/isamk-extracted-data.json';

interface FetData {
  institution: string;
  days: string[];
  hours: string[];
  subjects: Array<{ name: string; longName: string; code: string; comments: string }>;
  teachers: Array<{ name: string; longName: string; code: string; targetHours: number; qualifiedSubjects: string[]; comments: string }>;
  years: Array<{ name: string; longName: string; code: string; numberOfStudents: number; comments: string; groups: any[] }>;
  activities: Array<{ teacher: string; subject: string; activityTag: string; students: string[]; duration: number; totalDuration: number; id: number; activityGroupId: number; active: boolean; comments: string }>;
  rooms: Array<{ name: string; longName: string; code: string; building: string; capacity: number; virtual: boolean; comments: string }>;
  activityTags: Array<{ name: string; longName: string; code: string; printable: boolean; comments: string }>;
}

function extractTagContent(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractAllTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

function extractChild(fragment: string, tag: string): string | null {
  return extractTagContent(fragment, tag);
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function main() {
  console.log('📖 Lecture du fichier FET...');
  const xmlContent = fs.readFileSync(FET_FILE, 'utf-8');
  console.log(`   Taille: ${(xmlContent.length / 1024).toFixed(1)} KB`);

  const data: FetData = {
    institution: 'ISAM Kairouan',
    days: [],
    hours: [],
    subjects: [],
    teachers: [],
    years: [],
    activities: [],
    rooms: [],
    activityTags: [],
  };

  const inst = extractTagContent(xmlContent, 'Institution_Name');
  if (inst) data.institution = decodeXmlEntities(inst);
  // ============================================
  // Jours
  // ============================================
  const daysSection = extractTagContent(xmlContent, 'Days_List') || '';
  const dayNames = extractAllTags(daysSection, 'Day').map(d => {
    const ln = extractChild(d, 'Long_Name') || extractChild(d, 'Name') || '';
    return decodeXmlEntities(ln);
  });
  data.days = dayNames.filter(Boolean);
  console.log(`   Jours: ${data.days.length} (${data.days.join(', ')})`);

  // ============================================
  // Heures (créneaux)
  // ============================================
  const hoursSection = extractTagContent(xmlContent, 'Hours_List') || '';
  const hourNames = extractAllTags(hoursSection, 'Hour').map(h => {
    const ln = extractChild(h, 'Long_Name') || extractChild(h, 'Name') || '';
    return decodeXmlEntities(ln);
  });
  data.hours = hourNames.filter(Boolean);
  console.log(`   Créneaux horaires: ${data.hours.length}`);


  // ============================================
  // Sujets (Modules)
  // ============================================
  const subjectsSection = extractTagContent(xmlContent, 'Subjects_List') || '';
  const subjectFragments = extractAllTags(subjectsSection, 'Subject');
  data.subjects = subjectFragments.map(s => ({
    name: decodeXmlEntities(extractChild(s, 'Name') || ''),
    longName: decodeXmlEntities(extractChild(s, 'Long_Name') || ''),
    code: decodeXmlEntities(extractChild(s, 'Code') || ''),
    comments: decodeXmlEntities(extractChild(s, 'Comments') || ''),
  }));
  console.log(`   Sujets (modules): ${data.subjects.length}`);

  // ============================================
  // Activity Tags (Types d'enseignement)
  // ============================================
  const tagsSection = extractTagContent(xmlContent, 'Activity_Tags_List') || '';
  const tagFragments = extractAllTags(tagsSection, 'Activity_Tag');
  data.activityTags = tagFragments.map(t => ({
    name: decodeXmlEntities(extractChild(t, 'Name') || ''),
    longName: decodeXmlEntities(extractChild(t, 'Long_Name') || ''),
    code: decodeXmlEntities(extractChild(t, 'Code') || ''),
    printable: extractChild(t, 'Printable') !== 'false',
    comments: decodeXmlEntities(extractChild(t, 'Comments') || ''),
  }));
  console.log(`   Activity tags: ${data.activityTags.length}`);


  // ============================================
  // Enseignants
  // ============================================
  const teachersSection = extractTagContent(xmlContent, 'Teachers_List') || '';
  const teacherFragments = extractAllTags(teachersSection, 'Teacher');
  data.teachers = teacherFragments.map(t => {
    const qualifiedSection = extractChild(t, 'Qualified_Subjects') || '';
    const qualifiedSubjects = extractAllTags(qualifiedSection, 'Subject').map(s => decodeXmlEntities(s)).filter(Boolean);
    return {
      name: decodeXmlEntities(extractChild(t, 'Name') || ''),
      longName: decodeXmlEntities(extractChild(t, 'Long_Name') || ''),
      code: decodeXmlEntities(extractChild(t, 'Code') || ''),
      targetHours: parseInt(extractChild(t, 'Target_Number_of_Hours') || '0', 10),
      qualifiedSubjects,
      comments: decodeXmlEntities(extractChild(t, 'Comments') || ''),
    };
  });
  console.log(`   Enseignants: ${data.teachers.length}`);


  // ============================================
  // Étudiants (Années + Groupes)
  // ============================================
  const studentsSection = extractTagContent(xmlContent, 'Students_List') || '';
  const yearFragments = extractAllTags(studentsSection, 'Year');
  data.years = yearFragments.map(y => {
    const groupFragments = extractAllTags(y, 'Group');
    const groups = groupFragments.map(g => ({
      name: decodeXmlEntities(extractChild(g, 'Name') || ''),
      longName: decodeXmlEntities(extractChild(g, 'Long_Name') || ''),
      code: decodeXmlEntities(extractChild(g, 'Code') || ''),
      numberOfStudents: parseInt(extractChild(g, 'Number_of_Students') || '0', 10),
      comments: decodeXmlEntities(extractChild(g, 'Comments') || ''),
    }));
    return {
      name: decodeXmlEntities(extractChild(y, 'Name') || ''),
      longName: decodeXmlEntities(extractChild(y, 'Long_Name') || ''),
      code: decodeXmlEntities(extractChild(y, 'Code') || ''),
      numberOfStudents: parseInt(extractChild(y, 'Number_of_Students') || '0', 10),
      comments: decodeXmlEntities(extractChild(y, 'Comments') || ''),
      groups,
    };
  });
  const totalGroups = data.years.reduce((sum, y) => sum + y.groups.length, 0);
  console.log(`   Années: ${data.years.length}, Groupes: ${totalGroups}`);


  // ============================================
  // Activités (Affectations)
  // ============================================
  const activitiesSection = extractTagContent(xmlContent, 'Activities_List') || '';
  const activityFragments = extractAllTags(activitiesSection, 'Activity');
  data.activities = activityFragments.map(a => {
    const students = extractAllTags(a, 'Students').map(s => decodeXmlEntities(s)).filter(Boolean);
    return {
      teacher: decodeXmlEntities(extractChild(a, 'Teacher') || ''),
      subject: decodeXmlEntities(extractChild(a, 'Subject') || ''),
      activityTag: decodeXmlEntities(extractChild(a, 'Activity_Tag') || ''),
      students,
      duration: parseInt(extractChild(a, 'Duration') || '0', 10),
      totalDuration: parseInt(extractChild(a, 'Total_Duration') || '0', 10),
      id: parseInt(extractChild(a, 'Id') || '0', 10),
      activityGroupId: parseInt(extractChild(a, 'Activity_Group_Id') || '0', 10),
      active: extractChild(a, 'Active') !== 'false',
      comments: decodeXmlEntities(extractChild(a, 'Comments') || ''),
    };
  });
  console.log(`   Activités: ${data.activities.length}`);


  // ============================================
  // Salles
  // ============================================
  const roomsSection = extractTagContent(xmlContent, 'Rooms_List') || '';
  const roomFragments = extractAllTags(roomsSection, 'Room');
  data.rooms = roomFragments.map(r => ({
    name: decodeXmlEntities(extractChild(r, 'Name') || ''),
    longName: decodeXmlEntities(extractChild(r, 'Long_Name') || ''),
    code: decodeXmlEntities(extractChild(r, 'Code') || ''),
    building: decodeXmlEntities(extractChild(r, 'Building') || ''),
    capacity: parseInt(extractChild(r, 'Capacity') || '0', 10),
    virtual: extractChild(r, 'Virtual') === 'true',
    comments: decodeXmlEntities(extractChild(r, 'Comments') || ''),
  }));
  console.log(`   Salles: ${data.rooms.length}`);


  // ============================================
  // Écriture du fichier de sortie
  // ============================================
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`\n✅ Données extraites vers ${OUTPUT_FILE}`);

  console.log('\n📊 Résumé des données extraites :');
  console.log(`   Institution: ${data.institution}`);
  console.log(`   Jours: ${data.days.length}`);
  console.log(`   Créneaux: ${data.hours.length}`);
  console.log(`   Sujets: ${data.subjects.length}`);
  console.log(`   Activity tags: ${data.activityTags.length}`);
  console.log(`   Enseignants: ${data.teachers.length}`);
  console.log(`   Années: ${data.years.length}`);
  console.log(`   Groupes: ${totalGroups}`);
  console.log(`   Activités: ${data.activities.length}`);
  console.log(`   Salles: ${data.rooms.length}`);

  console.log('\n⚠️  Points d\'attention :');
  const roomsWithZeroCap = data.rooms.filter((r) => r.capacity === 0 || r.capacity === 30000);
  console.log(`   Salles avec capacité placeholder (0 ou 30000): ${roomsWithZeroCap.length}`);
  const teachersWithoutSubjects = data.teachers.filter((t) => t.qualifiedSubjects.length === 0);
  console.log(`   Enseignants sans matières qualifiées: ${teachersWithoutSubjects.length}`);
  const subjectsWithoutCode = data.subjects.filter((s) => !s.code);
  console.log(`   Sujets sans code: ${subjectsWithoutCode.length}`);
}

try {
  main();
} catch (e) {
  console.error('❌ Erreur lors de l\'extraction:', e);
  process.exit(1);
}

