const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/nps - Register a beta NPS response (Roadmap Final - Fase 4, item 7)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { score, comentario } = req.body;
    const numericScore = parseInt(score, 10);

    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      return res.status(400).json({ error: 'score deve ser um numero entre 0 e 10.' });
    }

    const ciclo = process.env.NPS_CICLO || 'beta-2026';
    let { data: response, error } = await supabase
      .from('nps_responses')
      .insert({ user_id: userId, score: numericScore, comentario: comentario || null, ciclo })
      .select()
      .single();

    // Banco ainda sem a coluna ciclo (upgrade_producao.sql não aplicado): grava sem ela
    if (error && /ciclo/i.test(error.message || '')) {
      ({ data: response, error } = await supabase
        .from('nps_responses')
        .insert({ user_id: userId, score: numericScore, comentario: comentario || null })
        .select()
        .single());
    }

    if (error) {
      // 23505 = unique_violation: usuário já respondeu neste ciclo (ROADMAP Hub J)
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Você já enviou seu feedback neste ciclo de avaliação. Obrigado!' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Resposta registrada. Obrigado pelo feedback!', response });
  } catch (err) {
    next(err);
  }
});

// GET /api/nps/summary - Aggregate NPS score across all beta responses
router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const { data: responses, error } = await supabase
      .from('nps_responses')
      .select('score, comentario, created_at');

    if (error) return res.status(500).json({ error: error.message });

    const total = responses.length;
    if (total === 0) {
      return res.json({ total: 0, nps: null, average: null, promoters: 0, passives: 0, detractors: 0 });
    }

    const promoters = responses.filter(r => r.score >= 9).length;
    const detractors = responses.filter(r => r.score <= 6).length;
    const passives = total - promoters - detractors;
    const nps = Math.round(((promoters - detractors) / total) * 100);
    const average = Math.round((responses.reduce((sum, r) => sum + r.score, 0) / total) * 10) / 10;

    res.json({ total, nps, average, promoters, passives, detractors });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
