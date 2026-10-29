import http from 'k6/http';

// ============================================================================
// TAKT - Découverte des ressources via l'API pour les tests de charge (L7-08)
// Les scénarios appellent ces fonctions en phase d'initialisation pour obtenir
// les IDs de version, séances, département et semestre à utiliser.
// ============================================================================

export function discoverResources(token, baseUrl) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 1. Récupérer les versions pour en choisir une (pour séances et génération)
  const versionsRes = http.get(`${baseUrl}/versions`, { headers });
  if (versionsRes.status !== 200) {
    throw new Error(`Impossible de lister les versions (${versionsRes.status})`);
  }
  const versions = JSON.parse(versionsRes.body);
  if (!versions || versions.length === 0) {
    throw new Error('Aucune version trouvée dans la base de données');
  }
  const versionId = versions[0].id;

  // 2. Récupérer les séances de cette version (pour placement et suggestions)
  const seancesRes = http.get(`${baseUrl}/versions/${versionId}/seances?limit=100`, { headers });
  if (seancesRes.status !== 200) {
    throw new Error(`Impossible de lister les séances (${seancesRes.status})`);
  }
  const seancesData = JSON.parse(seancesRes.body);
  const seances = seancesData.data || seancesData || [];
  if (seances.length === 0) {
    throw new Error('Aucune séance trouvée dans la version');
  }
  const seanceIds = seances.map(s => s.id);

  // 3. Récupérer un département (pour charges) via /structure/departements
  const departementsRes = http.get(`${baseUrl}/structure/departements?limit=10`, { headers });
  let departementId = null;
  if (departementsRes.status === 200) {
    const departements = JSON.parse(departementsRes.body);
    const deps = departements.data || departements || [];
    if (deps.length > 0) {
      departementId = deps[0].id;
    }
  }

  // 4. Récupérer le semestre (pour tableau de bord) via /annees/{id}/semestres
  let semestreId = null;
  const anneesRes = http.get(`${baseUrl}/annees?limit=10`, { headers });
  if (anneesRes.status === 200) {
    const annees = JSON.parse(anneesRes.body);
    const anneesList = annees.data || annees || [];
    if (anneesList.length > 0) {
      const anneeId = anneesList[0].id;
      const semestresRes = http.get(`${baseUrl}/annees/${anneeId}/semestres?limit=10`, { headers });
      if (semestresRes.status === 200) {
        const semestres = JSON.parse(semestresRes.body);
        const semestresList = semestres.data || semestres || [];
        if (semestresList.length > 0) {
          semestreId = semestresList[0].id;
        }
      }
    }
  }

  // 5. Récupérer des salles (pour déplacement de séance)
  const sallesRes = http.get(`${baseUrl}/salles?limit=10`, { headers });
  let salleIds = [];
  if (sallesRes.status === 200) {
    const salles = JSON.parse(sallesRes.body);
    const sallesList = salles.data || salles || [];
    salleIds = sallesList.map(s => s.id);
  }

  // 6. Récupérer des créneaux (pour déplacement de séance)
  const creneauxRes = http.get(`${baseUrl}/creneaux?limit=10`, { headers });
  let creneauIds = [];
  if (creneauxRes.status === 200) {
    const creneaux = JSON.parse(creneauxRes.body);
    const creneauxList = creneaux.data || creneaux || [];
    creneauIds = creneauxList.map(c => c.id);
  }

  return {
    versionId,
    seanceIds,
    departementId,
    semestreId,
    salleIds,
    creneauIds,
  };
}
