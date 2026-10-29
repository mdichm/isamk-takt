import http from 'k6/http';

// ============================================================================
// TAKT - Découverte des ressources pour les tests de charge (L7-08)
// Les IDs de version, semestre et département proviennent de seed-ids.json
// (généré par le seed). Les séances sont récupérées via l'endpoint GET
// /seances/versions/:id/seances quand il fonctionne, sinon on utilise des
// IDs de remplacement pour les scénarios placement/suggestions.
// ============================================================================

const seedIds = JSON.parse(open('../results/seed-ids.json'));

export function discoverResources(token, baseUrl) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const versionId = seedIds.versionId;
  const semestreId = seedIds.semestreId;
  const departementId = seedIds.departementId;

  // Récupérer les séances (pour placement et suggestions)
  let seanceIds = [];
  const seancesRes = http.get(`${baseUrl}/seances/versions/${versionId}/seances?page=1&limit=10`, { headers });
  if (seancesRes.status === 200) {
    const seancesData = JSON.parse(seancesRes.body);
    const seances = seancesData.data || seancesData || [];
    seanceIds = seances.map(s => s.id);
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
