const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Validation schema for profile update
const profileSchema = z.object({
  nota_enem: z.number().min(0).max(1000).optional().nullable(),
  renda_familiar: z.string().optional().nullable(),
  tipo_escola: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  cotas: z.record(z.any()).optional(),
  score_riasec: z.record(z.any()).optional(),
  cursos_interesse: z.array(z.string()).optional()
});

// GET /api/user/profile
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user public profile and profile details
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('nome_completo, email, avatar_url')
      .eq('id', userId)
      .single();

    if (userError) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { data: profileRecord, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    res.json({
      ...userRecord,
      profile: profileRecord || {}
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/profile
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const body = profileSchema.parse(req.body);

    const { data, error } = await supabase
      .from('user_profiles')
      .update(body)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: data
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: err.errors });
    }
    next(err);
  }
});

// POST /api/user/vocacional — save vocational test result
router.post('/vocacional', requireAuth, async (req, res) => {
  try {
    const { score_riasec, areas_recomendadas } = req.body;
    if (!score_riasec) return res.status(400).json({ error: 'score_riasec required' });

    const { data, error } = await supabase
      .from('vocational_results')
      .insert({ user_id: req.user.id, score_riasec, areas_recomendadas: areas_recomendadas || [] })
      .select()
      .single();

    if (error) throw error;

    // Also update user_profiles with latest riasec score
    await supabase.from('user_profiles')
      .update({ score_riasec, cursos_interesse: areas_recomendadas || [] })
      .eq('user_id', req.user.id);

    res.status(201).json({ result: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/user/quiz — save quiz session (mini-vestibular)
router.post('/quiz', requireAuth, async (req, res) => {
  try {
    const { tipo, respostas, score } = req.body;
    if (!tipo || !respostas) return res.status(400).json({ error: 'tipo, respostas required' });

    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({ user_id: req.user.id, tipo, respostas, score: score || 0 })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ session: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/user/quiz-history — past vestibular quiz scores
router.get('/quiz-history', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('id, score, created_at')
      .eq('user_id', req.user.id)
      .eq('tipo', 'vestibular')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const sessions = (data || []).map(s => ({
      id: s.id,
      score: s.score,
      date: new Date(s.created_at).toLocaleDateString('pt-BR'),
      created_at: s.created_at,
    }));

    const best = sessions.length ? Math.max(...sessions.map(s => s.score)) : null;
    const previous = sessions.length > 1 ? sessions[1].score : null;

    res.json({ sessions, best, previous });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/user/achievements — list user's unlocked achievements
router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('id, tipo, desbloqueado_em')
      .eq('user_id', req.user.id)
      .order('desbloqueado_em', { ascending: false });

    if (error) throw error;
    res.json({ achievements: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/user/achievements — unlock an achievement (idempotent)
router.post('/achievements', requireAuth, async (req, res) => {
  try {
    const { tipo } = req.body;
    if (!tipo) return res.status(400).json({ error: 'tipo required' });

    // Idempotent — return existing if already unlocked
    const { data: existing } = await supabase
      .from('achievements')
      .select('id, tipo, desbloqueado_em')
      .eq('user_id', req.user.id)
      .eq('tipo', tipo)
      .maybeSingle();

    if (existing) return res.json({ achievement: existing, already_unlocked: true });

    const { data, error } = await supabase
      .from('achievements')
      .insert({ user_id: req.user.id, tipo })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ achievement: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
