const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/deadlines
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data: deadlines, error } = await supabase
      .from('deadlines')
      .select('*')
      .order('data_limite', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formatted = deadlines.map(d => ({
      id: d.id,
      programa: d.programa,
      descricao: d.descricao,
      data: new Date(d.data_limite).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      dias: Math.ceil((new Date(d.data_limite) - new Date()) / (1000 * 60 * 60 * 24)),
      url: d.source_url || '#'
    }));

    res.json({
      deadlines: formatted
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
