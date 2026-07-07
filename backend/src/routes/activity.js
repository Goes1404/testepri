const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// ─── In-memory activity log ─────────────────────────────────────
// userId → [{ id, tipo, titulo, descricao, dados, created_at }]
const activityLogs = {};

function getUserActivity(userId) {
  if (!activityLogs[userId]) {
    // Seed with demo data
    activityLogs[userId] = [
      {
        id: 'act-1',
        tipo: 'candidatura',
        titulo: 'Candidatura criada',
        descricao: 'Você se candidatou à bolsa de Design Gráfico na Anhembi Morumbi (ProUni 100%).',
        icone: '📋',
        created_at: '2026-07-06T14:30:00Z'
      },
      {
        id: 'act-2',
        tipo: 'documento',
        titulo: 'Documento enviado',
        descricao: 'Comprovante de renda enviado para a candidatura de Design Gráfico.',
        icone: '📄',
        created_at: '2026-07-06T15:10:00Z'
      },
      {
        id: 'act-3',
        tipo: 'simulacao',
        titulo: 'Mini-Vestibular realizado',
        descricao: 'Você completou um simulado ENEM com nota 672/1000. Parabéns!',
        icone: '📝',
        created_at: '2026-07-05T20:00:00Z'
      },
      {
        id: 'act-4',
        tipo: 'vocacional',
        titulo: 'Teste Vocacional concluído',
        descricao: 'Perfil RIASEC: Artístico · Investigativo. 3 profissões recomendadas.',
        icone: '🧭',
        created_at: '2026-07-05T18:30:00Z'
      },
      {
        id: 'act-5',
        tipo: 'chat',
        titulo: 'Conversa com a Mentora',
        descricao: 'Você perguntou sobre bolsas de Design e recebeu 3 recomendações personalizadas.',
        icone: '💬',
        created_at: '2026-07-05T17:00:00Z'
      },
      {
        id: 'act-6',
        tipo: 'evento',
        titulo: 'Inscrito em evento',
        descricao: 'Você se inscreveu no evento "Portas Abertas USP" dia 28/jun.',
        icone: '🎓',
        created_at: '2026-07-04T10:00:00Z'
      },
      {
        id: 'act-7',
        tipo: 'perfil',
        titulo: 'Perfil atualizado',
        descricao: 'Nota do ENEM atualizada para 682. Novas bolsas agora disponíveis.',
        icone: '👤',
        created_at: '2026-07-03T16:00:00Z'
      },
      {
        id: 'act-8',
        tipo: 'conquista',
        titulo: 'Conquista desbloqueada',
        descricao: 'Você desbloqueou a conquista "Primeira Candidatura". Continue assim!',
        icone: '🏆',
        created_at: '2026-07-03T14:30:00Z'
      },
      {
        id: 'act-9',
        tipo: 'alerta',
        titulo: 'Alerta disparado',
        descricao: 'Nova bolsa de Design com nota de corte 590 disponível na ESPM.',
        icone: '🔔',
        created_at: '2026-07-02T09:00:00Z'
      },
      {
        id: 'act-10',
        tipo: 'comunidade',
        titulo: 'Post na comunidade',
        descricao: 'Você curtiu a história de Mariana Santos sobre Design na Anhembi.',
        icone: '❤️',
        created_at: '2026-07-01T22:00:00Z'
      }
    ];
  }
  return activityLogs[userId];
}

// GET /api/activity — paginated activity log with optional type filter
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || 'demo-user';
    const { tipo, page = 1, limit = 10 } = req.query;
    let activities = getUserActivity(userId);

    if (tipo && tipo !== 'all') {
      activities = activities.filter(a => a.tipo === tipo);
    }

    // Sort by newest first
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paged = activities.slice(offset, offset + parseInt(limit));

    // Group by date
    const grouped = {};
    paged.forEach(act => {
      const date = new Date(act.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label;
      if (date.toDateString() === today.toDateString()) {
        label = 'Hoje';
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = 'Ontem';
      } else {
        const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
        label = diff <= 7 ? `${diff} dias atrás` : date.toLocaleDateString('pt-BR');
      }

      if (!grouped[label]) grouped[label] = [];
      grouped[label].push({
        ...act,
        hora: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    });

    const tipos = [...new Set(getUserActivity(userId).map(a => a.tipo))];

    res.json({
      activities: paged,
      grouped,
      total: activities.length,
      page: parseInt(page),
      totalPages: Math.ceil(activities.length / parseInt(limit)),
      tiposDisponiveis: tipos
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico de atividades.' });
  }
});

// POST /api/activity/log — register a new activity
router.post('/log', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || 'demo-user';
    const { tipo, titulo, descricao } = req.body;

    if (!tipo || !titulo) {
      return res.status(400).json({ error: 'Tipo e título são obrigatórios.' });
    }

    const ICON_MAP = {
      candidatura: '📋', documento: '📄', simulacao: '📝',
      vocacional: '🧭', chat: '💬', evento: '🎓',
      perfil: '👤', conquista: '🏆', alerta: '🔔', comunidade: '❤️'
    };

    const newActivity = {
      id: 'act-' + Date.now(),
      tipo,
      titulo,
      descricao: descricao || '',
      icone: ICON_MAP[tipo] || '📌',
      created_at: new Date().toISOString()
    };

    const activities = getUserActivity(userId);
    activities.unshift(newActivity);

    res.json({ success: true, activity: newActivity });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar atividade.' });
  }
});

module.exports = router;
