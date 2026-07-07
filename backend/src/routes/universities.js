const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

const STATE_COORDS = {
  SP: { lat: -23.5505, lng: -46.6333 },
  RJ: { lat: -22.9068, lng: -43.1729 },
  MG: { lat: -19.9167, lng: -43.9345 },
  RS: { lat: -30.0346, lng: -51.2177 },
  PR: { lat: -25.4284, lng: -49.2733 },
  SC: { lat: -27.5949, lng: -48.5482 },
  BA: { lat: -12.9777, lng: -38.5016 },
  PE: { lat: -8.0476, lng: -34.8770 },
  DF: { lat: -15.7939, lng: -47.8828 },
  GO: { lat: -16.6869, lng: -49.2648 },
  CE: { lat: -3.7319, lng: -38.5267 },
  ALL: { lat: -15.7801, lng: -47.9292 }
};

function toRadians(value) {
  return value * Math.PI / 180;
}

function distanceKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function stableOffset(seed, axis) {
  const text = `${seed}-${axis}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 1200) / 1000) - 0.6;
}

function coordinateForUniversity(university) {
  const state = university.estados?.[0] || 'SP';
  const base = STATE_COORDS[state] || STATE_COORDS.ALL;
  return {
    lat: base.lat + stableOffset(university.sigla || university.nome, 'lat'),
    lng: base.lng + stableOffset(university.sigla || university.nome, 'lng')
  };
}

function mapPosition(userCoords, uniCoords) {
  const latDelta = Math.max(-1, Math.min(1, (uniCoords.lat - userCoords.lat) / 1.2));
  const lngDelta = Math.max(-1, Math.min(1, (uniCoords.lng - userCoords.lng) / 1.2));

  return {
    top: `${Math.round(50 - latDelta * 32)}%`,
    left: `${Math.round(50 + lngDelta * 32)}%`
  };
}

// GET /api/universities/map?lat=-23.5&lng=-46.6&radius=50
router.get('/map', requireAuth, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius || req.query.radius_km || 80);
    const userCoords = {
      lat: Number.isFinite(lat) ? lat : -23.5505,
      lng: Number.isFinite(lng) ? lng : -46.6333
    };

    const { data: scholarships, error } = await supabase
      .from('scholarships')
      .select(`
        id,
        curso_nome,
        programa,
        percentual,
        vagas_disponiveis,
        ativo,
        universities (
          id,
          nome,
          sigla,
          estados,
          ranking_mec
        )
      `)
      .eq('ativo', true)
      .limit(120);

    if (error) return res.status(500).json({ error: error.message });

    const byUniversity = new Map();
    (scholarships || []).forEach(scholarship => {
      const university = scholarship.universities;
      if (!university) return;

      if (!byUniversity.has(university.id)) {
        byUniversity.set(university.id, {
          university,
          scholarships: []
        });
      }
      byUniversity.get(university.id).scholarships.push(scholarship);
    });

    const universities = [...byUniversity.values()]
      .map(({ university, scholarships: uniScholarships }) => {
        const coords = coordinateForUniversity(university);
        const distance = distanceKm(userCoords, coords);
        const best = uniScholarships
          .slice()
          .sort((a, b) => (b.percentual || 0) - (a.percentual || 0))[0];
        const position = mapPosition(userCoords, coords);

        return {
          id: university.id,
          sigla: university.sigla,
          nome: university.nome,
          estado: university.estados?.[0] || 'BR',
          lat: coords.lat,
          lng: coords.lng,
          top: position.top,
          left: position.left,
          distanceKm: Math.round(distance * 10) / 10,
          scholarshipsCount: uniScholarships.length,
          availableVacancies: uniScholarships.reduce((sum, item) => sum + (item.vagas_disponiveis || 0), 0),
          bestScholarship: best ? {
            id: best.id,
            curso: best.curso_nome,
            programa: best.programa,
            percentual: best.programa === 'SISU' ? 'Gratuito' : `${Math.round(best.percentual || 0)}%`
          } : null
        };
      })
      .filter(item => item.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 25);

    res.json({
      user: userCoords,
      radiusKm: radius,
      universities
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar universidades no mapa.' });
  }
});

module.exports = router;
