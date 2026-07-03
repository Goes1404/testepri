const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../db');

// GET /api/universidades — list universities for the map, filtered by user's state
router.get('/', requireAuth, async (req, res) => {
  try {
    const { estado, limit = 20 } = req.query;

    // Fetch user profile to get their state if not provided
    let filterEstado = estado;
    if (!filterEstado) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('estado')
        .eq('user_id', req.user.id)
        .single();
      filterEstado = profile?.estado || null;
    }

    let query = supabase
      .from('universities')
      .select('id, nome, sigla, tipo, estados, ranking_mec')
      .order('ranking_mec', { ascending: true })
      .limit(parseInt(limit) || 20);

    if (filterEstado && filterEstado !== 'todos') {
      query = query.contains('estados', [filterEstado]);
    }

    const { data, error } = await query;
    if (error) throw error;

    // For each university, get best available scholarship
    const uniIds = (data || []).map(u => u.id);
    const { data: bolsas } = await supabase
      .from('scholarships')
      .select('university_id, programa, percentual, nota_corte, vagas_disponiveis')
      .in('university_id', uniIds)
      .eq('ativo', true)
      .order('percentual', { ascending: false });

    const bolsasByUni = {};
    (bolsas || []).forEach(b => {
      if (!bolsasByUni[b.university_id]) bolsasByUni[b.university_id] = b;
    });

    // Positions for map pins (spread across the canvas)
    const positions = [
      {t:22,l:30},{t:38,l:62},{t:55,l:22},{t:30,l:72},{t:62,l:48},
      {t:18,l:52},{t:48,l:36},{t:70,l:32},{t:42,l:80},{t:65,l:68},
      {t:25,l:18},{t:58,l:80},{t:72,l:14},{t:35,l:45},{t:15,l:75},
      {t:80,l:55},{t:45,l:10},{t:82,l:38},{t:10,l:40},{t:75,l:82},
    ];

    const universidades = (data || []).map((u, i) => {
      const melhorBolsa = bolsasByUni[u.id];
      const pos = positions[i % positions.length];
      return {
        id: u.id,
        nome: u.nome,
        sigla: u.sigla,
        tipo: u.tipo,
        estados: u.estados || [],
        ranking: u.ranking_mec,
        melhorPrograma: melhorBolsa?.programa || null,
        melhorPct: melhorBolsa?.percentual || null,
        notaCorte: melhorBolsa?.nota_corte || null,
        vagasDisp: melhorBolsa?.vagas_disponiveis || 0,
        top: pos.t + '%',
        left: pos.l + '%',
      };
    });

    res.json({ universidades, total: universidades.length, estado: filterEstado });
  } catch (e) {
    console.error('GET /api/universidades', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
