const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

const RIASEC_MAP = {
  R: { label: 'Realista', area: 'Tecnologia & Engenharia', tag: 'Prático & Técnico', desc: 'Você prefere trabalhar com objetos, ferramentas, máquinas e atividades práticas que exigem coordenação motora e raciocínio técnico.' },
  I: { label: 'Investigativo', area: 'Ciências & Pesquisa', tag: 'Analítico & Investigativo', desc: 'Você gosta de observar, aprender, investigar, analisar, avaliar e resolver problemas teóricos ou científicos.' },
  A: { label: 'Artístico', area: 'Artes & Design', tag: 'Criativo & Expressivo', desc: 'Você possui grandes afinidades artísticas, literárias ou de design, valorizando a originalidade, autoexpressão e inovação estética.' },
  S: { label: 'Social', area: 'Ciências Sociais & Humanas', tag: 'Comunicativo & Social', desc: 'Você prefere trabalhar com pessoas para ensinar, curar, aconselhar, ajudar, desenvolver ou treinar.' },
  E: { label: 'Empreendedor', area: 'Negócios & Gestão', tag: 'Líder & Empreendedor', desc: 'Você gosta de liderar, influenciar, persuadir pessoas para alcançar metas organizacionais ou ganho econômico.' },
  C: { label: 'Convencional', area: 'Administração & Organização', tag: 'Organizado & Detalhista', desc: 'Você prefere trabalhar com dados, registros sistemáticos, regras claras, rotinas administrativas e tarefas numéricas.' }
};

// In-memory profiles database fallback for offline demo resilience
const userProfilesFallback = {};

// POST /api/vocational/submit - Submit answers and calculate RIASEC
router.post('/submit', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { answers } = req.body; // array of numbers, e.g. [0, 1, 2, 0, 1, 2]

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Respostas inválidas.' });
    }

    // Holland RIASEC Profile initialization
    const score = { R: 10, I: 10, A: 10, S: 10, E: 10, C: 10 };
    answers.forEach((ans, idx) => {
      if (ans === 0) { score.A += 20; score.I += 10; }
      else if (ans === 1) { score.R += 20; score.S += 10; }
      else if (ans === 2) { score.E += 20; score.C += 10; }
      else { score.S += 15; score.I += 15; }
    });

    // Find top personality traits
    const sortedTraits = Object.keys(score).sort((a, b) => score[b] - score[a]);
    const primary = sortedTraits[0];
    const secondary = sortedTraits[1];

    const riasecInfo = RIASEC_MAP[primary];

    const score_riasec = {
      score,
      primary,
      secondary,
      tag: riasecInfo.tag,
      area: riasecInfo.area
    };

    // Save in memory fallback first
    userProfilesFallback[userId] = { score_riasec };

    // Save result to profile in Supabase
    try {
      await supabase
        .from('user_profiles')
        .update({ score_riasec })
        .eq('user_id', userId);

      await supabase
        .from('vocational_results')
        .insert({
          user_id: userId,
          score_riasec: score,
          areas_recommended: [riasecInfo.area, RIASEC_MAP[secondary].area]
        });
    } catch (e) {
      // Ignore DB errors in demo mode
    }

    res.json({
      success: true,
      score,
      primary,
      secondary,
      info: riasecInfo
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/vocational/my-result - Get most recent result
router.get('/my-result', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    let profile = null;

    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('score_riasec')
        .eq('user_id', userId)
        .maybeSingle();
      profile = data;
    } catch (e) {
      // fallback
    }

    // Try in-memory fallback next
    if (!profile || !profile.score_riasec) {
      profile = userProfilesFallback[userId];
    }

    // If still no result, use default fallback for demo flow
    if (!profile || !profile.score_riasec) {
      profile = {
        score_riasec: {
          score: { R: 30, I: 92, A: 85, S: 64, E: 52, C: 38 },
          primary: 'I',
          secondary: 'A',
          tag: 'Analítico & Investigativo',
          area: 'Ciências & Pesquisa'
        }
      };
    }

    const { primary, score } = profile.score_riasec;
    res.json({
      score,
      primary,
      info: RIASEC_MAP[primary]
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/vocational/matched-scholarships - Get matching scholarships based on profile
router.get('/matched-scholarships', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    let profile = null;

    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('score_riasec')
        .eq('user_id', userId)
        .maybeSingle();
      profile = data;
    } catch (e) {
      // fallback
    }

    if (!profile || !profile.score_riasec) {
      profile = userProfilesFallback[userId];
    }

    if (!profile || !profile.score_riasec) {
      profile = {
        score_riasec: {
          score: { R: 30, I: 92, A: 85, S: 64, E: 52, C: 38 },
          primary: 'I',
          secondary: 'A',
          tag: 'Analítico & Investigativo',
          area: 'Ciências & Pesquisa'
        }
      };
    }

    const primary = profile.score_riasec.primary;

    // Filter query based on primary RIASEC personality
    let keywords = ['design', 'arquitetura', 'artes', 'comunicacao']; // Default Artístico
    if (primary === 'R') keywords = ['computacao', 'sistemas', 'engenharia', 'analise', 'tecnologia'];
    if (primary === 'I') keywords = ['ciencias', 'pesquisa', 'medicina', 'biologia', 'quimica'];
    if (primary === 'S') keywords = ['enfermagem', 'pedagogia', 'psicologia', 'direito', 'servico'];
    if (primary === 'E') keywords = ['administracao', 'gestao', 'negocios', 'economia', 'marketing'];
    if (primary === 'C') keywords = ['contabilidade', 'administracao', 'analise', 'direito'];

    let scholarships = null;
    try {
      const { data } = await supabase
        .from('scholarships')
        .select(`
          *,
          universities (
            nome,
            sigla
          )
        `)
        .eq('ativo', true);
      scholarships = data;
    } catch (e) {
      // fallback
    }

    // Default mock scholarships if Supabase is offline/empty
    if (!scholarships || scholarships.length === 0) {
      scholarships = [
        { id: 1, curso_nome: 'Design Gráfico', sigla: 'DG', curso: 'Design Gráfico', uni: 'Anhembi Morumbi', pct: '100%', val: 100, chance: 'Alta', chanceColor: '#1F8A5B', width: '88%', grad: 'linear-gradient(90deg,#23A06B,#147A4F)' },
        { id: 2, curso_nome: 'Arquitetura e Urbanismo', sigla: 'AU', curso: 'Arquitetura e Urbanismo', uni: 'PUC Campinas', pct: '50%', val: 50, chance: 'Média', chanceColor: '#7B4FE0', width: '64%', grad: 'linear-gradient(90deg,#7B4FE0,#4B2DA3)' },
        { id: 3, curso_nome: 'Análise de Sistemas', sigla: 'ADS', curso: 'Análise e Des. de Sistemas', uni: 'FIAP', pct: '100%', val: 100, chance: 'Alta', chanceColor: '#1F8A5B', width: '92%', grad: 'linear-gradient(90deg,#23A06B,#147A4F)' }
      ];
    }

    // Filter matching scholarships locally by keywords
    let matched = scholarships.filter(b => 
      keywords.some(kw => (b.curso_nome || b.curso || '').toLowerCase().includes(kw))
    );

    if (matched.length === 0) {
      matched = scholarships.slice(0, 3);
    }

    res.json({
      riasec: profile.score_riasec,
      matched: matched.slice(0, 4)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
