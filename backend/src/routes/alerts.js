const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../db');

// GET /api/alerts
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const alerts = (data || []).map(a => ({
      id: a.id,
      curso: a.criterios?.curso || '',
      cidade: a.criterios?.cidade || '',
      minPct: a.criterios?.minPct || 0,
      canal: a.canal,
      ativo: a.ativo,
      ultima_notificacao: a.ultima_notificacao,
    }));

    res.json({ alerts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/alerts
router.post('/', requireAuth, async (req, res) => {
  try {
    const { curso, cidade = 'Qualquer', minPct = 50, canal = 'email' } = req.body;
    if (!curso) return res.status(400).json({ error: 'curso required' });

    const { data, error } = await supabase
      .from('alerts')
      .insert({ user_id: req.user.id, criterios: { curso, cidade, minPct }, canal })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ alert: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/alerts/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const updates = {};
    if (req.body.ativo !== undefined) updates.ativo = req.body.ativo;
    if (req.body.criterios !== undefined) updates.criterios = req.body.criterios;
    if (req.body.canal !== undefined) updates.canal = req.body.canal;

    const { data, error } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ alert: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
