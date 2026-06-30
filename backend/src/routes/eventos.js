const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../db');

// GET /api/eventos
router.get('/', async (req, res) => {
  try {
    const { estado, limit = 20 } = req.query;
    let query = supabase
      .from('events')
      .select(`
        id, titulo, data, vagas, cidade, estado,
        universities ( nome, sigla )
      `)
      .gte('data', new Date().toISOString())
      .order('data', { ascending: true })
      .limit(parseInt(limit) || 20);

    if (estado) query = query.eq('estado', estado);

    const { data, error } = await query;
    if (error) throw error;

    const eventos = (data || []).map(e => {
      const d = new Date(e.data);
      const dataFmt = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return {
        id: e.id,
        titulo: e.titulo,
        data: dataFmt,
        dataISO: e.data,
        local: e.cidade + ' · ' + e.estado,
        vagas: e.vagas,
        cidade: e.cidade,
        estado: e.estado,
        uni: e.universities?.nome || '',
        sigla: e.universities?.sigla || '',
        lotado: e.vagas <= 0,
        vagasLabel: e.vagas <= 0 ? 'Lotado' : e.vagas + ' vagas',
        tagBg: e.vagas <= 0 ? '#9C93B3' : (e.vagas <= 10 ? '#C25BA0' : '#4B2DA3'),
      };
    });

    res.json({ eventos });
  } catch (e) {
    console.error('GET /api/eventos', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/eventos/:id/registrar
router.post('/:id/registrar', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    if (!eventId) return res.status(400).json({ error: 'invalid event id' });

    // Check event exists and has vacancies
    const { data: ev, error: evErr } = await supabase
      .from('events')
      .select('id, vagas, titulo')
      .eq('id', eventId)
      .single();

    if (evErr || !ev) return res.status(404).json({ error: 'Event not found' });
    if (ev.vagas <= 0) return res.status(409).json({ error: 'No vacancies available' });

    // Idempotent — return existing registration
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (existing) return res.json({ registration: existing, already_registered: true });

    // Insert registration and decrement vacancies
    const { data: reg, error: regErr } = await supabase
      .from('event_registrations')
      .insert({ event_id: eventId, user_id: req.user.id })
      .select()
      .single();

    if (regErr) throw regErr;

    await supabase.from('events').update({ vagas: ev.vagas - 1 }).eq('id', eventId);

    res.status(201).json({ registration: reg, event_titulo: ev.titulo });
  } catch (e) {
    console.error('POST /api/eventos/:id/registrar', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/eventos/:id/registrar
router.delete('/:id/registrar', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', req.user.id);

    if (error) throw error;

    // Restore vacancy
    const { data: ev } = await supabase.from('events').select('vagas').eq('id', eventId).single();
    if (ev) await supabase.from('events').update({ vagas: ev.vagas + 1 }).eq('id', eventId);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/eventos/minhas
router.get('/minhas', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        id, created_at,
        events ( id, titulo, data, cidade, estado, universities ( sigla ) )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const registrations = (data || []).map(r => ({
      registration_id: r.id,
      event_id: r.events?.id,
      titulo: r.events?.titulo || '',
      data: r.events?.data ? new Date(r.events.data).toLocaleDateString('pt-BR') : '',
      local: (r.events?.cidade || '') + (r.events?.estado ? ' · ' + r.events.estado : ''),
      sigla: r.events?.universities?.sigla || '',
    }));

    res.json({ registrations });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
