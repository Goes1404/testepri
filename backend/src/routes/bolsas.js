const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Simple matching logic helper
function calculateMatch(b, userEnem, userIncome, userSchool) {
  const isSisu = b.programa === 'SISU';
  const isFies = b.programa === 'FIES';
  const isProUni = b.programa === 'ProUni';

  // Base match value
  let matchValue = 50;

  if (userEnem >= b.nota_corte) {
    matchValue += Math.min(30, (userEnem - b.nota_corte) * 0.5);
  } else {
    matchValue -= Math.min(40, (b.nota_corte - userEnem) * 0.8);
  }

  // Eligibility rules check
  let eligible = true;
  let reason = '';

  if (isProUni) {
    if (b.percentual === 100 && (userIncome === '2-3' || userIncome === '3+')) {
      eligible = false;
      reason = 'Renda per capita excede 1,5 salário mínimo para bolsa integral.';
    } else if (b.percentual === 50 && userIncome === '3+') {
      eligible = false;
      reason = 'Renda per capita excede 3 salários mínimos para bolsa parcial.';
    }
    if (userSchool === 'privada') {
      eligible = false;
      reason = 'ProUni exige ensino médio em escola pública ou bolsista integral em escola privada.';
    }
  }

  if (isFies) {
    if (userEnem < 450) {
      eligible = false;
      reason = 'FIES exige nota mínima de 450 pontos e redação maior que zero.';
    }
    if (userIncome === '3+') {
      eligible = false;
      reason = 'FIES exige renda per capita familiar de até 3 salários mínimos.';
    }
  }

  let chanceStr = 'Média';
  if (!eligible) {
    matchValue = 10;
    chanceStr = 'Baixa';
  } else if (matchValue > 75) {
    chanceStr = 'Alta';
  } else if (matchValue < 45) {
    chanceStr = 'Baixa';
  }

  return {
    val: Math.max(0, Math.min(100, Math.round(matchValue))),
    chance: chanceStr,
    eligible,
    eligibilityReason: reason
  };
}

// GET /api/bolsas - List with query, state, minimum pct, minimum ENEM score
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { q, programa, pct_minimo, estado, nota } = req.query;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nota_enem, renda_familiar, tipo_escola')
      .eq('user_id', userId)
      .single();

    const userEnem = profile?.nota_enem || 600;
    const userIncome = profile?.renda_familiar || '2-3';
    const userSchool = profile?.tipo_escola || 'publica';

    // Start building query
    let query = supabase
      .from('scholarships')
      .select(`
        *,
        universities (
          nome,
          sigla,
          tipo,
          estados
        )
      `)
      .eq('ativo', true);

    if (programa && programa !== 'todos') {
      query = query.eq('programa', programa);
    }

    const { data: scholarships, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Map and filter programmatically for flexible calculations
    let results = scholarships.map(b => {
      const isSisu = b.programa === 'SISU';
      const isFies = b.programa === 'FIES';
      const pctNum = isSisu ? 100 : (isFies ? 100 : parseInt(b.percentual, 10) || 0);
      const match = calculateMatch(b, userEnem, userIncome, userSchool);

      return {
        id: b.id,
        sigla: b.universities?.sigla || 'IES',
        curso: b.curso_nome,
        uni: b.universities?.nome || 'Instituição',
        local: (b.universities?.estados?.[0] || 'SP') + ' · BR',
        modal: 'Presencial',
        programa: b.programa,
        pct: isSisu ? 'Gratuito' : b.percentual + '%',
        ingresso: isSisu ? 'SISU' : isFies ? 'FIES' : b.percentual === 100 ? 'ProUni Integral' : 'ProUni Parcial',
        mec: b.universities?.ranking_mec || 4,
        chance: match.chance,
        val: match.val,
        cheio: parseFloat(b.valor_mensalidade),
        corte: parseFloat(b.nota_corte),
        prazo: b.prazo_inscricao ? new Date(b.prazo_inscricao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '30 jun',
        dias: b.prazo_inscricao ? Math.ceil((new Date(b.prazo_inscricao) - new Date()) / (1000 * 60 * 60 * 24)) : 7,
        vagasRest: b.vagas_disponiveis,
        rendaMax: b.renda_maxima,
        eligible: match.eligible,
        eligibilityReason: match.eligibilityReason,
        pctNum
      };
    });

    // Apply client-side filters
    if (q) {
      const search = q.toLowerCase();
      results = results.filter(b => b.curso.toLowerCase().includes(search) || b.uni.toLowerCase().includes(search));
    }
    if (estado && estado !== 'todos') {
      results = results.filter(b => b.local.includes(estado));
    }
    if (pct_minimo) {
      const minPct = parseInt(pct_minimo, 10) || 0;
      results = results.filter(b => b.pctNum >= minPct);
    }
    if (nota) {
      const minNota = parseInt(nota, 10) || 0;
      results = results.filter(b => b.corte <= minNota);
    }

    res.json({
      bolsas: results
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/bolsas/recomendadas - backward compatibility
router.get('/recomendadas', requireAuth, async (req, res, next) => {
  res.redirect(307, '/api/bolsas');
});

// GET /api/bolsas/:id - Detail view
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: scholarship, error } = await supabase
      .from('scholarships')
      .select(`
        *,
        universities (
          nome,
          sigla,
          tipo,
          estados,
          ranking_mec
        )
      `)
      .eq('id', id)
      .single();

    if (error || !scholarship) {
      return res.status(404).json({ error: 'Scholarship not found.' });
    }

    // Fetch user profile to calculate match details
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nota_enem, renda_familiar, tipo_escola')
      .eq('user_id', userId)
      .single();

    const userEnem = profile?.nota_enem || 600;
    const userIncome = profile?.renda_familiar || '2-3';
    const userSchool = profile?.tipo_escola || 'publica';

    const match = calculateMatch(scholarship, userEnem, userIncome, userSchool);

    res.json({
      ...scholarship,
      matchVal: match.val,
      chance: match.chance,
      eligible: match.eligible,
      eligibilityReason: match.eligibilityReason
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/bolsas/:id/cut-score-history
router.get('/:id/cut-score-history', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: history, error } = await supabase
      .from('cut_score_history')
      .select('*')
      .eq('scholarship_id', id)
      .order('ano', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      history: history || []
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/bolsas/simulate - ENEM simulator
router.post('/simulate', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { simulatedEnem } = req.body;

    if (!simulatedEnem) {
      return res.status(400).json({ error: 'simulatedEnem value is required.' });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('renda_familiar, tipo_escola')
      .eq('user_id', userId)
      .single();

    const { data: scholarships } = await supabase
      .from('scholarships')
      .select(`
        *,
        universities (
          nome,
          sigla
        )
      `)
      .eq('ativo', true);

    const userIncome = profile?.renda_familiar || '2-3';
    const userSchool = profile?.tipo_escola || 'publica';

    const simulation = scholarships.map(b => {
      const match = calculateMatch(b, simulatedEnem, userIncome, userSchool);
      return {
        id: b.id,
        curso: b.curso_nome,
        uni: b.universities?.sigla || 'IES',
        programa: b.programa,
        pct: b.programa === 'SISU' ? 'Gratuito' : b.percentual + '%',
        notaCorte: b.nota_corte,
        chance: match.chance,
        val: match.val,
        eligible: match.eligible
      };
    });

    res.json({
      simulation
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/bolsas/cotas/calculate - Quotas calculations
router.post('/cotas/calculate', requireAuth, async (req, res, next) => {
  try {
    const { cotaType } = req.body; // e.g., publica, racial, etc.
    const userId = req.user.id;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nota_enem, renda_familiar, tipo_escola')
      .eq('user_id', userId)
      .single();

    const baseEnem = profile?.nota_enem || 600;
    // Apply quota boost: e.g., +15 points for public school cota (escola publica)
    let boostedEnem = baseEnem;
    if (cotaType === 'publica') boostedEnem += 15;
    else if (cotaType === 'racial') boostedEnem += 10;
    else if (cotaType === 'pcd') boostedEnem += 20;

    res.json({
      baseEnem,
      boostedEnem,
      boost: boostedEnem - baseEnem
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
