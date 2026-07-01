const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../db');

// GET /api/plano/streak — current streak + last 7 days activity
router.get('/streak', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch last 60 days of study log
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const { data, error } = await supabase
      .from('study_log')
      .select('study_date, minutes, materia')
      .eq('user_id', userId)
      .gte('study_date', since.toISOString().split('T')[0])
      .order('study_date', { ascending: false });

    if (error) throw error;

    const logByDate = {};
    (data || []).forEach(r => { logByDate[r.study_date] = r; });

    // Calculate current streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (logByDate[key]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Build last-7-days view
    const week = [];
    const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const MATS = { 1: 'Mat.', 2: 'Lin.', 3: 'Mat.', 4: 'Hum.', 5: 'Nat.', 6: 'Red.', 0: 'Rev.' };
    const CORES = { 1: '#4B2DA3', 2: '#7B4FE0', 3: '#4B2DA3', 4: '#A24DE0', 5: '#C44DD9', 6: '#1F8A5B', 0: '#9C93B3' };
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dow = d.getDay();
      const estudou = !!logByDate[key];
      week.push({
        label: DIAS[dow],
        mat: MATS[dow],
        cor: CORES[dow],
        dow,
        hoje: i === 0,
        estudou,
        minutes: logByDate[key]?.minutes || 0,
      });
    }

    res.json({ streak, week, totalDays: (data || []).length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/plano/log — register today's study session
router.post('/log', requireAuth, async (req, res) => {
  try {
    const { minutes = 30, materia } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('study_log')
      .upsert(
        { user_id: req.user.id, study_date: today, minutes, materia },
        { onConflict: 'user_id,study_date' }
      )
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ log: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
