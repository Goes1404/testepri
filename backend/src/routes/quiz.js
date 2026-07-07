const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

const QUESTIONS_ENEM = [
  {
    area: 'Linguagens',
    q: 'No romance "Dom Casmurro", de Machado de Assis, a ambiguidade da narrativa em torno da fidelidade de Capitu constitui um recurso literário que visa:',
    opts: [
      'Provocar no leitor o mesmo estado de dúvida e ciúme obsessivo do narrador Bento Santiago.',
      'Comprovar cientificamente o adultério de Capitu sob a ótica do Naturalismo oitocentista.',
      'Explicar o processo jurídico de separação matrimonial na sociedade burguesa do Rio de Janeiro.',
      'Ironizar a hipocrisia das famílias tradicionais que não aceitavam divórcios consensuais.'
    ],
    correct: 0,
    explicacao: 'A narrativa em primeira pessoa transfere para o leitor o ciúme obsessivo de Bentinho, tornando a dúvida sobre Capitu a própria essência literária da obra.'
  },
  {
    area: 'Matemática',
    q: 'Uma pessoa aplica um capital de R$ 10.000,00 sob regime de juros simples com taxa de 1% ao mês por 5 meses. Qual o montante total resgatado ao final da aplicação?',
    opts: [
      'R$ 10.500,00',
      'R$ 10.050,00',
      'R$ 11.000,00',
      'R$ 10.100,00'
    ],
    correct: 0,
    explicacao: 'Juros simples: J = C * i * t = 10000 * 0.01 * 5 = R$ 500. Montante = C + J = R$ 10.500,00.'
  },
  {
    area: 'Ciências Humanas',
    q: 'A chamada "Era Vargas" (1930-1945) promoveu profundas transformações econômicas e sociais no Brasil, sendo a principal marca do seu modelo de desenvolvimento:',
    opts: [
      'A industrialização por substituição de importações e a criação de leis trabalhistas (CLT).',
      'A privatização de estatais de mineração e o foco exclusivo na exportação cafeeira.',
      'A abertura irrestrita a capitais estrangeiros e a desregulamentação absoluta do mercado.',
      'A reforma agrária radical em todo o território nacional com expropriação de latifúndios.'
    ],
    correct: 0,
    explicacao: 'Getúlio Vargas liderou o processo de industrialização interna de base e instituiu a Consolidação das Leis do Trabalho (CLT).'
  },
  {
    area: 'Ciências da Natureza',
    q: 'As plantas clorofiladas produzem matéria orgânica e oxigênio molecular na fotossíntese. O oxigênio liberado na atmosfera provém diretamente de qual dessas substâncias?',
    opts: [
      'Da fotólise da água (H₂O).',
      'Da quebra do gás carbônico (CO₂).',
      'Da respiração celular mitocondrial.',
      'Da degradação enzimática da glicose.'
    ],
    correct: 0,
    explicacao: 'Na fase clara da fotossíntese, ocorre a fotólise da água, processo no qual o oxigênio é gerado a partir do desprendimento das moléculas de água.'
  },
  {
    area: 'Redação',
    q: 'Na estrutura da redação dissertativo-argumentativa do ENEM, a proposta de intervenção social é avaliada na competência 5 e deve, obrigatoriamente, conter:',
    opts: [
      'Agente, Ação, Meio/Modo, Efeito e Detalhamento de um dos elementos.',
      'Apenas uma sugestão subjetiva sem especificações de executor ou resultados.',
      'Citações históricas obrigatórias e referências filosóficas diretas.',
      'Vocabulário rebuscado e proposição de alteração na Constituição Federal.'
    ],
    correct: 0,
    explicacao: 'A competência 5 do ENEM pontua até 200 pontos com base na presença completa dos 5 elementos de intervenção social.'
  }
];

// Load questions from the quiz_questions table (see supabase/upgrade_producao.sql).
// Falls back to the static array when the table is unavailable (local dev without DB).
// Cache de 5 minutos: evita uma query por request e latência alta quando o banco
// está indisponível (timeout de conexão a cada chamada).
let questionsCache = { data: null, fetchedAt: 0 };
const QUESTIONS_CACHE_TTL_MS = 5 * 60 * 1000;

async function loadQuestions() {
  const now = Date.now();
  if (questionsCache.data && now - questionsCache.fetchedAt < QUESTIONS_CACHE_TTL_MS) {
    return questionsCache.data;
  }

  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('area, enunciado, alternativas, correta, explicacao')
      .eq('ativo', true)
      .order('id', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      questionsCache = {
        data: data.map(q => ({
          area: q.area,
          q: q.enunciado,
          opts: q.alternativas,
          correct: q.correta,
          explicacao: q.explicacao
        })),
        fetchedAt: now
      };
      return questionsCache.data;
    }
  } catch (e) {
    // fall through to static fallback
  }

  // Cacheia o fallback também (evita marteladas no banco indisponível)
  questionsCache = { data: QUESTIONS_ENEM, fetchedAt: now };
  return QUESTIONS_ENEM;
}

// GET /api/quiz/questions
router.get('/questions', async (req, res) => {
  const questions = await loadQuestions();
  res.json(questions);
});

// POST /api/quiz/submit
router.post('/submit', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { answers } = req.body; // array of indexes, e.g. [0, 1, 2, 0, 1]

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Respostas inválidas.' });
    }

    const questions = await loadQuestions();
    let correctCount = 0;
    const results = questions.map((q, idx) => {
      const selected = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = selected === q.correct;
      if (isCorrect) correctCount++;
      return {
        area: q.area,
        selected,
        correct: q.correct,
        isCorrect,
        explicacao: q.explicacao
      };
    });

    // Score equivalent calculation (base 450 + 70 points per correct answer)
    const score = 450 + (correctCount * 70);

    // Save/update user profile ENEM score if this score is higher
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('nota_enem')
        .eq('user_id', userId)
        .maybeSingle();

      const currentEnem = profile ? profile.nota_enem : 0;
      if (score > currentEnem) {
        await supabase
          .from('user_profiles')
          .update({ nota_enem: score })
          .eq('user_id', userId);
      }
    } catch (e) {
      // Ignore
    }

    // Persist the attempt for history/achievements (best effort)
    try {
      await supabase.from('quiz_sessions').insert({
        user_id: userId,
        tipo: 'vestibular',
        respostas: answers,
        score
      });
    } catch (e) {
      // Ignore
    }

    res.json({
      score,
      correctCount,
      totalCount: questions.length,
      results
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
