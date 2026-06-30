const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../db');

const ICON_MAP = {
  Prazo:       { cor: '#4B2DA3', path: 'M3 4h18v17H3zM3 9h18M8 2v4M16 2v4' },
  Candidatura: { cor: '#8A5CF0', path: 'M20 6L9 17l-5-5' },
  Alerta:      { cor: '#C44DD9', path: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a1.94 1.94 0 0 1-3.4 0' },
  Documento:   { cor: '#5B7BF0', path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6' },
};

function ageLabel(createdAt) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return 'agora';
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + ' dias';
}

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const hoje = [];
    const semana = [];
    const agora = Date.now();

    for (const n of data || []) {
      const icon = ICON_MAP[n.tipo] || ICON_MAP.Candidatura;
      const ageMs = agora - new Date(n.created_at).getTime();
      const item = {
        id: n.id,
        cor: icon.cor,
        path: icon.path,
        tit: n.titulo,
        sub: n.corpo,
        t: ageLabel(n.created_at),
        lida: !!n.read_at,
      };
      if (ageMs < 86400000) hoje.push(item);
      else if (ageMs < 604800000) semana.push(item);
    }

    const grupos = [];
    if (hoje.length) grupos.push({ grupo: 'Hoje', itens: hoje });
    if (semana.length) grupos.push({ grupo: 'Esta semana', itens: semana });

    const all = [...hoje, ...semana];
    res.json({ notifications: grupos, total: all.length, unread: all.filter(n => !n.lida).length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .is('read_at', null);

    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
