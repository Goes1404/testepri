const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

// In-memory seed database fallback for offline demo resilience
let communityPosts = [
  {
    id: 'post-1',
    type: 'story',
    nome: 'Mariana Santos',
    ini: 'MS',
    curso: 'Design Gráfico (ProUni 100%)',
    texto: 'Consegui minha bolsa integral na Anhembi Morumbi com nota 648! A dica de preparação de documentação do Portal foi essencial para passar na entrevista de primeira. Não desistam!',
    curtidas: 14,
    nota: 648,
    tempo: '2 dias atrás',
    liked: false,
    aprovado: true,
    comments: [],
    created_at: '2026-07-04T10:00:00Z'
  },
  {
    id: 'post-2',
    type: 'story',
    nome: 'Gabriel P.',
    ini: 'GP',
    curso: 'Sistemas de Informação (ProUni 50%)',
    texto: 'Minha nota foi 610 e consegui o ProUni parcial. A documentação foi analisada no portal do aluno da faculdade e com 3 dias me ligaram aprovando. Esse guia me salvou!',
    curtidas: 8,
    nota: 610,
    tempo: '4 dias atrás',
    liked: false,
    aprovado: true,
    comments: [],
    created_at: '2026-07-02T14:00:00Z'
  },
  {
    id: 'post-3',
    type: 'story',
    nome: 'Letícia M.',
    ini: 'LM',
    curso: 'Medicina (ProUni 100%)',
    texto: 'Estudei 2 anos seguidos para o ENEM, fiz nota 812 e consegui ProUni integral em Medicina na Uninove. O teste vocacional do Portal confirmou que eu estava no caminho certo. Hoje estou no 3º semestre e amo cada dia!',
    curtidas: 42,
    nota: 812,
    tempo: '1 semana',
    liked: false,
    aprovado: true,
    comments: [],
    created_at: '2026-06-29T08:00:00Z'
  },
  {
    id: 'post-4',
    type: 'story',
    nome: 'Rafael A.',
    ini: 'RA',
    curso: 'Engenharia Civil (FIES 100%)',
    texto: 'Não consegui ProUni mas o FIES me salvou. Financiei 100% na Universidade Cruzeiro do Sul. O simulador de custos do Portal me mostrou que valeria a pena. Formei em 2025 e já estou trabalhando!',
    curtidas: 19,
    nota: 580,
    tempo: '2 semanas',
    liked: false,
    aprovado: true,
    comments: [],
    created_at: '2026-06-22T12:00:00Z'
  },
  {
    id: 'post-10',
    type: 'question',
    nome: 'João P.',
    ini: 'JP',
    pergunta: 'Posso fazer ProUni se minha mãe tem ensino superior?',
    texto: 'Posso fazer ProUni se minha mãe tem ensino superior?',
    respostas: 2,
    curtidas: 5,
    tempo: '1h atrás',
    respondida: true,
    aprovado: true,
    comments: [
      { id: 'com-1', nome: 'Ana K.', texto: 'Sim! O ProUni avalia o seu perfil de escola pública e renda per capita, independente da escolaridade dos seus pais.', tempo: '45min atrás', votos: 8, isMentora: false },
      { id: 'com-2', nome: 'Etapa Mentora', texto: 'Correto João. O critério principal é renda familiar menor que 1.5 ou 3 salários mínimos per capita, mais ter cursado escola pública.', tempo: '30min atrás', votos: 15, isMentora: true }
    ],
    created_at: '2026-07-06T18:00:00Z'
  },
  {
    id: 'post-11',
    type: 'question',
    nome: 'Camila F.',
    ini: 'CF',
    pergunta: 'FIES cobre pós-graduação?',
    texto: 'FIES cobre pós-graduação?',
    respostas: 1,
    curtidas: 3,
    tempo: '3h atrás',
    respondida: true,
    aprovado: true,
    comments: [
      { id: 'com-3', nome: 'Pedro G.', texto: 'O FIES de graduação regular não cobre pós-graduação. Há um programa específico de FIES de pós, mas abre menos vagas.', tempo: '2h atrás', votos: 6, isMentora: false }
    ],
    created_at: '2026-07-06T16:00:00Z'
  },
  {
    id: 'post-12',
    type: 'question',
    nome: 'Lucas T.',
    ini: 'LT',
    pergunta: 'Qual a diferença entre ProUni e FIES?',
    texto: 'Qual a diferença entre ProUni e FIES?',
    respostas: 1,
    curtidas: 12,
    tempo: '5h atrás',
    respondida: true,
    aprovado: true,
    comments: [
      { id: 'com-4', nome: 'Etapa Mentora', texto: 'O ProUni é uma bolsa (parcial ou integral) — você não paga. O FIES é um financiamento — você paga após se formar, com juros baixos. Ambos exigem nota do ENEM e renda dentro do limite.', tempo: '4h atrás', votos: 22, isMentora: true }
    ],
    created_at: '2026-07-06T14:00:00Z'
  },
  {
    id: 'post-13',
    type: 'question',
    nome: 'Isabela R.',
    ini: 'IR',
    pergunta: 'Perco a bolsa se reprovar em uma matéria?',
    texto: 'Perco a bolsa se reprovar em uma matéria?',
    respostas: 2,
    curtidas: 7,
    tempo: '1 dia',
    respondida: true,
    aprovado: true,
    comments: [
      { id: 'com-5', nome: 'Amanda S.', texto: 'Não necessariamente. O ProUni exige aprovação em pelo menos 75% das disciplinas no semestre. Se reprovar só uma matéria de 6, por exemplo, tudo bem.', tempo: '22h atrás', votos: 11, isMentora: false },
      { id: 'com-6', nome: 'Etapa Mentora', texto: 'Amanda está correta. A regra é 75% de aproveitamento no semestre. Além disso, não pode ter reprovação por falta. Mantenha presença acima de 75% em cada disciplina.', tempo: '20h atrás', votos: 18, isMentora: true }
    ],
    created_at: '2026-07-05T10:00:00Z'
  }
];

// GET /api/community/posts — with pagination, type filter, and search
router.get('/posts', async (req, res) => {
  const { type, q, page = 1, limit = 10 } = req.query;
  let filtered = communityPosts.filter(p => p.aprovado !== false);

  if (type) {
    filtered = filtered.filter(p => p.type === type);
  }
  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(p => {
      const searchable = (p.texto || '') + (p.pergunta || '') + (p.nome || '') + (p.curso || '');
      return searchable.toLowerCase().includes(query);
    });
  }

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const paged = filtered.slice(offset, offset + parseInt(limit));

  res.json({
    posts: paged,
    total: filtered.length,
    page: parseInt(page),
    totalPages: Math.ceil(filtered.length / parseInt(limit))
  });
});

// GET /api/community/stories — approved student stories
router.get('/stories', async (req, res) => {
  req.query.type = 'story';
  const { q, page = 1, limit = 10 } = req.query;
  let filtered = communityPosts.filter(p => p.aprovado !== false && p.type === 'story');

  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(p => {
      const searchable = (p.texto || '') + (p.nome || '') + (p.curso || '');
      return searchable.toLowerCase().includes(query);
    });
  }

  filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const offset = (parseInt(page) - 1) * parseInt(limit);

  res.json({
    stories: filtered.slice(offset, offset + parseInt(limit)),
    total: filtered.length,
    page: parseInt(page),
    totalPages: Math.ceil(filtered.length / parseInt(limit))
  });
});

// GET /api/community/questions — questions feed with search
router.get('/questions', async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  let filtered = communityPosts.filter(p => p.aprovado !== false && p.type === 'question');

  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(p => {
      const searchable = (p.texto || '') + (p.pergunta || '') + (p.nome || '');
      return searchable.toLowerCase().includes(query);
    });
  }

  filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const offset = (parseInt(page) - 1) * parseInt(limit);

  res.json({
    questions: filtered.slice(offset, offset + parseInt(limit)),
    total: filtered.length,
    page: parseInt(page),
    totalPages: Math.ceil(filtered.length / parseInt(limit))
  });
});

// POST /api/community/posts
router.post('/posts', requireAuth, async (req, res, next) => {
  try {
    const { type, title, texto, curso, nota } = req.body;
    const nome = req.user.nome || 'Aluno Anônimo';
    const ini = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    if (!texto) {
      return res.status(400).json({ error: 'Conteúdo do post é obrigatório.' });
    }

    const newPost = {
      id: 'post-' + Date.now(),
      type: type || 'question',
      nome,
      ini,
      curso: curso || 'Estudante',
      texto,
      pergunta: type === 'question' ? texto : undefined,
      curtidas: 0,
      nota: nota || 600,
      tempo: 'Agora mesmo',
      liked: false,
      aprovado: true, // Auto-approve for demo; in production would be false for moderation
      respostas: 0,
      comments: [],
      created_at: new Date().toISOString()
    };

    communityPosts.unshift(newPost);
    res.json({ success: true, post: newPost });
  } catch (err) {
    next(err);
  }
});

// POST /api/community/stories
router.post('/stories', requireAuth, async (req, res, next) => {
  try {
    const { texto, curso, nota } = req.body;
    const nome = req.user.nome || 'Aluno Anonimo';
    const ini = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    if (!texto) return res.status(400).json({ error: 'Conteudo do post e obrigatorio.' });

    const newPost = {
      id: 'post-' + Date.now(),
      type: 'story',
      nome,
      ini,
      curso: curso || 'Estudante',
      texto,
      curtidas: 0,
      nota: nota || 600,
      tempo: 'Agora mesmo',
      liked: false,
      aprovado: true,
      respostas: 0,
      comments: [],
      created_at: new Date().toISOString()
    };

    communityPosts.unshift(newPost);
    res.json({ success: true, post: newPost });
  } catch (err) {
    next(err);
  }
});

// POST /api/community/questions
router.post('/questions', requireAuth, async (req, res, next) => {
  try {
    const { texto } = req.body;
    const nome = req.user.nome || 'Aluno Anonimo';
    const ini = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    if (!texto) return res.status(400).json({ error: 'Conteudo da pergunta e obrigatorio.' });

    const newPost = {
      id: 'post-' + Date.now(),
      type: 'question',
      nome,
      ini,
      curso: 'Estudante',
      texto,
      pergunta: texto,
      curtidas: 0,
      nota: 600,
      tempo: 'Agora mesmo',
      liked: false,
      aprovado: true,
      respondida: false,
      respostas: 0,
      comments: [],
      created_at: new Date().toISOString()
    };

    communityPosts.unshift(newPost);
    res.json({ success: true, question: newPost });
  } catch (err) {
    next(err);
  }
});

// POST /api/community/posts/:id/like
router.post('/posts/:id/like', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = communityPosts.find(p => p.id === id);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    if (post.liked) {
      post.curtidas = Math.max(0, post.curtidas - 1);
      post.liked = false;
    } else {
      post.curtidas += 1;
      post.liked = true;
    }

    res.json({ success: true, curtidas: post.curtidas, liked: post.liked });
  } catch (err) {
    next(err);
  }
});

// POST /api/community/stories/:id/like
router.post('/stories/:id/like', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = communityPosts.find(p => p.id === id && p.type === 'story');
    if (!post) return res.status(404).json({ error: 'Historia nao encontrada.' });

    if (post.liked) {
      post.curtidas = Math.max(0, post.curtidas - 1);
      post.liked = false;
    } else {
      post.curtidas += 1;
      post.liked = true;
    }

    res.json({ success: true, curtidas: post.curtidas, liked: post.liked });
  } catch (err) {
    next(err);
  }
});

// POST /api/community/posts/:id/comments
router.post('/posts/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { texto } = req.body;
    const nome = req.user.nome || 'Aluno Anônimo';

    if (!texto) {
      return res.status(400).json({ error: 'Texto do comentário é obrigatório.' });
    }

    const post = communityPosts.find(p => p.id === id);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    const newComment = {
      id: 'com-' + Date.now(),
      nome,
      texto,
      tempo: 'Agora mesmo',
      votos: 0,
      isMentora: false
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    post.respostas = post.comments.length;
    post.respondida = true;

    res.json({ success: true, comments: post.comments });
  } catch (err) {
    next(err);
  }
});

// POST /api/community/questions/:id/answers
router.post('/questions/:id/answers', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { texto, isMentora = false } = req.body;
    const nome = req.user.nome || 'Aluno Anonimo';

    if (!texto) return res.status(400).json({ error: 'Texto da resposta e obrigatorio.' });

    const post = communityPosts.find(p => p.id === id && p.type === 'question');
    if (!post) return res.status(404).json({ error: 'Pergunta nao encontrada.' });

    const newComment = {
      id: 'com-' + Date.now(),
      nome,
      texto,
      tempo: 'Agora mesmo',
      votos: 0,
      isMentora: Boolean(isMentora)
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    post.respostas = post.comments.length;
    post.respondida = true;

    res.json({ success: true, answer: newComment, comments: post.comments });
  } catch (err) {
    next(err);
  }
});

// POST /api/community/posts/:id/comments/:commentId/vote — vote on answer
router.post('/posts/:id/comments/:commentId/vote', requireAuth, async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    const post = communityPosts.find(p => p.id === id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });

    const comment = (post.comments || []).find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comentário não encontrado.' });

    if (direction === 'up') {
      comment.votos = (comment.votos || 0) + 1;
    } else if (direction === 'down') {
      comment.votos = Math.max(0, (comment.votos || 0) - 1);
    }

    // Sort comments by votes descending (best answer first)
    post.comments.sort((a, b) => (b.votos || 0) - (a.votos || 0));

    res.json({ success: true, votos: comment.votos, comments: post.comments });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
