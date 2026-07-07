const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

const DEFAULT_FAQS = [
  {
    id: 1,
    question: "Posso me inscrever no ProUni ainda no 3º ano?",
    answer: "Sim. Você concorre assim que tiver a nota do ENEM. Como você cursou escola pública, já cumpre o pré-requisito principal — faça o ENEM 2026 e use a nota na inscrição de janeiro.",
    views: 124,
    tags: ["prouni", "inscricao", "escola publica"]
  },
  {
    id: 2,
    question: "Qual a diferença entre ProUni, SISU e FIES?",
    answer: "ProUni dá bolsa (50% ou 100%) em faculdade particular. SISU é vaga gratuita em faculdade pública. FIES é financiamento que você paga depois de formado. Pelo seu perfil, ProUni integral é o de maior chance.",
    views: 98,
    tags: ["geral", "sisu", "fies", "prouni"]
  },
  {
    id: 3,
    question: "Preciso pagar alguma coisa no ProUni?",
    answer: "Não há mensalidade na bolsa integral. Você só arca com custos do dia a dia (transporte, material). Veja o total estimado na ferramenta Custo real.",
    views: 85,
    tags: ["prouni", "mensalidade", "custos"]
  },
  {
    id: 4,
    question: "E se minha renda mudar depois de ganhar a bolsa?",
    answer: "Você deve declarar a mudança em até 30 dias. Aumento dentro do limite mantém a bolsa; acima do teto pode exigir migração para bolsa parcial. Acompanhe na tela Renovação.",
    views: 64,
    tags: ["prouni", "renda", "renovacao"]
  },
  {
    id: 5,
    question: "Posso usar a nota do ENEM de anos anteriores?",
    answer: "No ProUni e SISU vale a nota da edição mais recente do ENEM. Notas antigas não são aceitas — por isso vale repetir a prova se a sua melhorou.",
    views: 52,
    tags: ["enem", "nota", "edicao"]
  },
  {
    id: 6,
    question: "Como funciona a comprovação de informações da cota?",
    answer: "Para cotas de escola pública, basta apresentar o histórico escolar completo do ensino médio. Para cota de renda, holerite, extrato ou declaração de próprio punho. Para cota racial, haverá uma banca de heteroidentificação da própria faculdade.",
    views: 40,
    tags: ["cota", "documentos", "prouni"]
  }
];

const mockViews = {};

// GET /api/faq - Search FAQs
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { q } = req.query;

    let faqs = [];
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*');
      
      if (!error && data && data.length > 0) {
        faqs = data;
      } else {
        faqs = DEFAULT_FAQS;
      }
    } catch (e) {
      faqs = DEFAULT_FAQS;
    }

    faqs = faqs.map(f => ({
      ...f,
      views: (f.views || 0) + (mockViews[f.id] || 0)
    }));

    if (q) {
      const query = q.toLowerCase();
      faqs = faqs.filter(f => 
        f.question.toLowerCase().includes(query) || 
        f.answer.toLowerCase().includes(query) ||
        (f.tags && f.tags.some(t => t.toLowerCase().includes(query)))
      );
    }

    faqs.sort((a, b) => b.views - a.views);
    res.json(faqs);
  } catch (err) {
    next(err);
  }
});

// GET /api/faq/popular - Get popular FAQs
router.get('/popular', requireAuth, async (req, res, next) => {
  try {
    let faqs = [];
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*');
      
      if (!error && data && data.length > 0) {
        faqs = data;
      } else {
        faqs = DEFAULT_FAQS;
      }
    } catch (e) {
      faqs = DEFAULT_FAQS;
    }

    faqs = faqs.map(f => ({
      ...f,
      views: (f.views || 0) + (mockViews[f.id] || 0)
    }));

    faqs.sort((a, b) => b.views - a.views);
    res.json(faqs.slice(0, 4));
  } catch (err) {
    next(err);
  }
});

// POST /api/faq/:id/click - Increment view count
router.post('/:id/click', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    mockViews[numericId] = (mockViews[numericId] || 0) + 1;

    try {
      const { data: faqItem } = await supabase
        .from('faqs')
        .select('views')
        .eq('id', numericId)
        .maybeSingle();

      if (faqItem) {
        await supabase
          .from('faqs')
          .update({ views: (faqItem.views || 0) + 1 })
          .eq('id', numericId);
      }
    } catch (e) {
      // ignore
    }

    res.json({ success: true, views: (mockViews[numericId] || 0) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
