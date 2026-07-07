const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// ─── Achievement definitions ────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  {
    tipo: 'primeira_candidatura',
    titulo: 'Primeira Candidatura',
    descricao: 'Criou a primeira candidatura a uma bolsa.',
    icone: '🎯',
    criterio: 'Criar a primeira candidatura'
  },
  {
    tipo: 'perfil_completo',
    titulo: 'Perfil Completo',
    descricao: 'Preencheu 100% do perfil do aluno.',
    icone: '✨',
    criterio: 'Preencher todos os campos do perfil'
  },
  {
    tipo: 'streak_7dias',
    titulo: '7 Dias Seguidos',
    descricao: 'Acessou o portal 7 dias consecutivos.',
    icone: '🔥',
    criterio: 'Streak de 7 dias de acesso'
  },
  {
    tipo: 'simulador_guru',
    titulo: 'Simulador Guru',
    descricao: 'Realizou 10 simulações no Mini-Vestibular.',
    icone: '🧠',
    criterio: '10 quiz sessions completados'
  },
  {
    tipo: 'comunidade',
    titulo: 'Voz da Comunidade',
    descricao: 'Publicou uma história ou respondeu uma dúvida.',
    icone: '💬',
    criterio: '1 post ou resposta na comunidade'
  },
  {
    tipo: 'aprovado',
    titulo: 'Aprovado!',
    descricao: 'Recebeu aprovação em uma candidatura de bolsa.',
    icone: '🏆',
    criterio: 'Candidatura com status "Aprovado"'
  }
];

// ─── In-memory user achievements ─────────────────────────────────
// userId → { tipo → { unlocked: boolean, unlockedAt: string, progress: number, target: number } }
const userAchievements = {};

function getUserAchievements(userId) {
  if (!userAchievements[userId]) {
    // Seed with some initial unlocks for demo user
    userAchievements[userId] = {
      primeira_candidatura: { unlocked: true, unlockedAt: '2026-06-20T14:30:00Z', progress: 1, target: 1 },
      perfil_completo: { unlocked: true, unlockedAt: '2026-06-18T10:00:00Z', progress: 100, target: 100 },
      streak_7dias: { unlocked: false, unlockedAt: null, progress: 4, target: 7 },
      simulador_guru: { unlocked: false, unlockedAt: null, progress: 3, target: 10 },
      comunidade: { unlocked: false, unlockedAt: null, progress: 0, target: 1 },
      aprovado: { unlocked: false, unlockedAt: null, progress: 0, target: 1 }
    };
  }
  return userAchievements[userId];
}

// GET /api/achievements — list user achievements
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || 'demo-user';
    const userAch = getUserAchievements(userId);

    const achievements = ACHIEVEMENT_DEFS.map(def => {
      const state = userAch[def.tipo] || { unlocked: false, progress: 0, target: 1 };
      return {
        tipo: def.tipo,
        titulo: def.titulo,
        descricao: def.descricao,
        icone: def.icone,
        criterio: def.criterio,
        unlocked: state.unlocked,
        unlockedAt: state.unlockedAt,
        progress: state.progress,
        target: state.target,
        progressLabel: state.unlocked
          ? 'Desbloqueado'
          : `${state.progress}/${state.target}`
      };
    });

    const done = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;

    res.json({
      achievements,
      done,
      total,
      percentComplete: Math.round((done / total) * 100)
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar conquistas.' });
  }
});

// POST /api/achievements/check — check and unlock achievements based on action
router.post('/check', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || 'demo-user';
    const { action, data } = req.body; // action: 'candidatura_criada', 'perfil_atualizado', 'quiz_completado', 'post_criado', 'candidatura_aprovada', 'acesso_diario'
    const userAch = getUserAchievements(userId);
    const newlyUnlocked = [];

    switch (action) {
      case 'candidatura_criada':
        if (!userAch.primeira_candidatura.unlocked) {
          userAch.primeira_candidatura.progress = 1;
          userAch.primeira_candidatura.unlocked = true;
          userAch.primeira_candidatura.unlockedAt = new Date().toISOString();
          newlyUnlocked.push('Primeira Candidatura');
        }
        break;

      case 'perfil_atualizado':
        const pct = data?.percentComplete || 100;
        userAch.perfil_completo.progress = pct;
        if (pct >= 100 && !userAch.perfil_completo.unlocked) {
          userAch.perfil_completo.unlocked = true;
          userAch.perfil_completo.unlockedAt = new Date().toISOString();
          newlyUnlocked.push('Perfil Completo');
        }
        break;

      case 'acesso_diario':
        userAch.streak_7dias.progress = Math.min(
          userAch.streak_7dias.progress + 1,
          userAch.streak_7dias.target
        );
        if (userAch.streak_7dias.progress >= 7 && !userAch.streak_7dias.unlocked) {
          userAch.streak_7dias.unlocked = true;
          userAch.streak_7dias.unlockedAt = new Date().toISOString();
          newlyUnlocked.push('7 Dias Seguidos');
        }
        break;

      case 'quiz_completado':
        userAch.simulador_guru.progress = Math.min(
          userAch.simulador_guru.progress + 1,
          userAch.simulador_guru.target
        );
        if (userAch.simulador_guru.progress >= 10 && !userAch.simulador_guru.unlocked) {
          userAch.simulador_guru.unlocked = true;
          userAch.simulador_guru.unlockedAt = new Date().toISOString();
          newlyUnlocked.push('Simulador Guru');
        }
        break;

      case 'post_criado':
        if (!userAch.comunidade.unlocked) {
          userAch.comunidade.progress = 1;
          userAch.comunidade.unlocked = true;
          userAch.comunidade.unlockedAt = new Date().toISOString();
          newlyUnlocked.push('Voz da Comunidade');
        }
        break;

      case 'candidatura_aprovada':
        if (!userAch.aprovado.unlocked) {
          userAch.aprovado.progress = 1;
          userAch.aprovado.unlocked = true;
          userAch.aprovado.unlockedAt = new Date().toISOString();
          newlyUnlocked.push('Aprovado!');
        }
        break;

      default:
        return res.status(400).json({ error: `Ação desconhecida: ${action}` });
    }

    res.json({
      success: true,
      newlyUnlocked,
      totalUnlocked: Object.values(userAch).filter(a => a.unlocked).length,
      totalAchievements: ACHIEVEMENT_DEFS.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao verificar conquistas.' });
  }
});

module.exports = router;
