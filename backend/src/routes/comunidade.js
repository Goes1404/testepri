const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../db');

// GET /api/comunidade/posts?tipo=historia|duvida
router.get('/posts', async (req, res) => {
  try {
    const { tipo, limit = 20 } = req.query;
    let query = supabase
      .from('community_posts')
      .select(`
        id, user_id, tipo, titulo, corpo, likes, created_at,
        users ( nome_completo )
      `)
      .eq('aprovado', true)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit) || 20);

    if (tipo) query = query.eq('tipo', tipo);

    const { data, error } = await query;
    if (error) throw error;

    const posts = (data || []).map(p => {
      const nome = p.users?.nome_completo || 'Anônimo';
      const ini = nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
      const cores = ['#4B2DA3', '#C25BA0', '#1F8A5B', '#E07800', '#5B7BF0'];
      const cor = cores[nome.charCodeAt(0) % cores.length];
      const ago = Math.floor((Date.now() - new Date(p.created_at)) / 60000);
      const tempo = ago < 60 ? ago + ' min' : ago < 1440 ? Math.floor(ago / 60) + 'h' : Math.floor(ago / 1440) + ' dias';
      return {
        id: p.id, tipo: p.tipo, titulo: p.titulo, corpo: p.corpo,
        likes: p.likes || 0, nome, ini, cor, tempo,
      };
    });

    res.json({ posts });
  } catch (e) {
    console.error('GET /api/comunidade/posts', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/comunidade/posts
router.post('/posts', requireAuth, async (req, res) => {
  try {
    const { tipo, titulo, corpo } = req.body;
    if (!tipo || !titulo || !corpo) return res.status(400).json({ error: 'tipo, titulo, corpo required' });
    if (!['historia', 'duvida'].includes(tipo)) return res.status(400).json({ error: 'tipo must be historia or duvida' });

    const { data, error } = await supabase
      .from('community_posts')
      .insert({ user_id: req.user.id, tipo, titulo, corpo, aprovado: false })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ post: data, pending: true });
  } catch (e) {
    console.error('POST /api/comunidade/posts', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/comunidade/posts/:id/answers
router.get('/posts/:id/answers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('community_answers')
      .select(`
        id, corpo, votos, created_at,
        users ( nome_completo )
      `)
      .eq('post_id', req.params.id)
      .order('votos', { ascending: false });

    if (error) throw error;

    const answers = (data || []).map(a => ({
      id: a.id,
      corpo: a.corpo,
      votos: a.votos || 0,
      nome: a.users?.nome_completo || 'Anônimo',
      created_at: a.created_at,
    }));

    res.json({ answers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/comunidade/posts/:id/answers
router.post('/posts/:id/answers', requireAuth, async (req, res) => {
  try {
    const { corpo } = req.body;
    if (!corpo) return res.status(400).json({ error: 'corpo required' });

    const { data, error } = await supabase
      .from('community_answers')
      .insert({ post_id: req.params.id, user_id: req.user.id, corpo })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ answer: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/comunidade/posts/:id/like
router.post('/posts/:id/like', requireAuth, async (req, res) => {
  try {
    const { data: post, error: fetchErr } = await supabase
      .from('community_posts')
      .select('likes')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !post) return res.status(404).json({ error: 'Not found' });

    const { data, error } = await supabase
      .from('community_posts')
      .update({ likes: (post.likes || 0) + 1 })
      .eq('id', req.params.id)
      .select('likes')
      .single();

    if (error) throw error;
    res.json({ likes: data.likes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
