const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendEmail, sendPush } = require('../services/integrations');

// GET /api/alerts - List all alerts for current user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('ultima_notificacao', { ascending: false, nullsFirst: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ alerts: alerts || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts - Create a new alert
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { curso, cidade, minPct, canal, scholarship_id } = req.body;

    if (!curso || !cidade) {
      return res.status(400).json({ error: 'curso and cidade are required fields.' });
    }

    const criterios = {
      curso,
      cidade,
      minPct: parseInt(minPct, 10) || 0
    };
    if (scholarship_id) {
      criterios.scholarship_id = scholarship_id;
    }

    const { data: newAlert, error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        criterios,
        canal: canal || 'email',
        ativo: true
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(newAlert);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alerts/:id - Toggle alert active state
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { ativo } = req.body;

    if (ativo === undefined) {
      return res.status(400).json({ error: 'ativo boolean is required.' });
    }

    const { data: updatedAlert, error } = await supabase
      .from('alerts')
      .update({ ativo })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json(updatedAlert);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alerts/:id - Remove alert
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Alerta removido com sucesso.' });
  } catch (err) {
    next(err);
  }
});

// Sync function to match active alerts with available scholarships
async function syncAlerts() {
  try {
    console.log('Running syncAlerts job...');
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('ativo', true);

    if (alertsError) throw alertsError;
    if (!alerts || alerts.length === 0) return { count: 0, matches: 0 };

    let matchesCount = 0;

    for (const alert of alerts) {
      const { curso, cidade, minPct } = alert.criterios;

      // Query active scholarships matching percentage
      let query = supabase
        .from('scholarships')
        .select('*, university:universities(*)')
        .eq('ativo', true);

      if (minPct) {
        query = query.gte('percentual', minPct);
      }

      const { data: scholarships, error: scholError } = await query;
      if (scholError) continue;

      const matches = scholarships.filter(s => {
        if (alert.criterios.scholarship_id) {
          return parseInt(s.id, 10) === parseInt(alert.criterios.scholarship_id, 10);
        }
        const matchesCurso = s.curso_nome.toLowerCase().includes(curso.toLowerCase());
        const matchesCidade = s.university && s.university.estados && s.university.estados.some(e => e.toLowerCase().includes(cidade.toLowerCase())) || 
                              s.university && s.university.nome.toLowerCase().includes(cidade.toLowerCase());
        
        return matchesCurso && (cidade === 'Qualquer' || matchesCidade);
      });

      if (matches.length > 0) {
        const now = new Date();
        const lastNotif = alert.ultima_notificacao ? new Date(alert.ultima_notificacao) : null;
        
        // For demo/dev purposes, allow notifying if last notification was > 2 minutes ago
        const thresholdMs = 2 * 60 * 1000; 
        if (!lastNotif || (now - lastNotif) > thresholdMs) {
          const s = matches[0];
          
          await supabase
            .from('notifications')
            .insert({
              user_id: alert.user_id,
              tipo: 'Alerta',
              titulo: 'Nova Bolsa Encontrada! 🎉',
              corpo: `Uma nova vaga para ${s.curso_nome} (${Math.round(s.percentual)}% de bolsa) na ${s.university.sigla} foi aberta em ${cidade}.`
            });

          const { data: user } = await supabase
            .from('users')
            .select('email')
            .eq('id', alert.user_id)
            .maybeSingle();

          const title = 'Nova Bolsa Encontrada!';
          const body = `Uma nova vaga para ${s.curso_nome} na ${s.university.sigla} combina com seu alerta.`;

          await sendEmail({
            to: user?.email,
            subject: title,
            text: body
          });

          // Envia push para todos os dispositivos registrados do usuário (tabela push_tokens)
          const { data: tokens } = await supabase
            .from('push_tokens')
            .select('token')
            .eq('user_id', alert.user_id);

          const pushTokens = (tokens || []).map(t => t.token);
          const legacyToken = alert.push_token || alert.criterios?.push_token;
          if (legacyToken) pushTokens.push(legacyToken);

          for (const token of pushTokens) {
            await sendPush({
              token,
              title,
              body,
              data: { scholarship_id: String(s.id), alert_id: String(alert.id) }
            }).catch(() => {});
          }

          await supabase
            .from('alerts')
            .update({ ultima_notificacao: now.toISOString() })
            .eq('id', alert.id);

          matchesCount++;
        }
      }
    }
    
    return { count: alerts.length, matches: matchesCount };
  } catch (err) {
    console.error('Error in syncAlerts job:', err);
    return { error: err.message };
  }
}

// POST /api/alerts/sync - Manually trigger sync job
router.post('/sync', async (req, res, next) => {
  try {
    const result = await syncAlerts();
    res.json({ message: 'Sincronização concluída com sucesso.', result });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, syncAlerts };
