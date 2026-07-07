const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendEmail } = require('../services/integrations');

// Gera arquivo .ics (iCalendar) para o aluno salvar o evento no Google Calendar/Outlook (ROADMAP Hub G)
function buildIcs(event) {
  const start = new Date(`${event.data}T${event.horario || '09:00'}:00-03:00`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // duração padrão de 2h
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escapeText = value => String(value || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Portal do Aluno//Eventos//PT-BR',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@portal-do-aluno`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeText(event.titulo)}`,
    `DESCRIPTION:${escapeText(event.descricao)}`,
    `LOCATION:${escapeText(`${event.local} - ${event.cidade}/${event.estado}`)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

// Dispara e-mail de confirmação com anexo .ics (best effort — não bloqueia a inscrição)
async function sendRegistrationEmail(user, event) {
  if (!user?.email) return;
  try {
    await sendEmail({
      to: user.email,
      subject: `Inscrição confirmada: ${event.titulo}`,
      text: `Sua inscrição no evento "${event.titulo}" foi confirmada!\n\n` +
        `Data: ${event.data} às ${event.horario}\n` +
        `Local: ${event.local} - ${event.cidade}/${event.estado}\n` +
        `Instituição: ${event.universidade}\n\n` +
        `O convite de calendário (.ics) está anexado — abra-o para salvar o evento no Google Calendar ou Outlook.\n\n` +
        `Equipe Portal do Aluno`,
      attachments: [
        {
          filename: 'evento.ics',
          type: 'text/calendar',
          content: buildIcs(event)
        }
      ]
    });
  } catch (err) {
    console.error('Falha ao enviar e-mail de confirmação de evento:', err.message);
  }
}

// ─── In-memory seed events ───────────────────────────────────────
let eventsDb = [
  {
    id: 'evt-1',
    titulo: 'Portas Abertas USP',
    descricao: 'Visite o campus da Cidade Universitária, converse com estudantes bolsistas e conheça os laboratórios de perto. Haverá sessões de orientação vocacional e informações sobre ProUni e SISU.',
    data: '2026-07-28',
    horario: '09:00',
    local: 'Cidade Universitária',
    cidade: 'São Paulo',
    estado: 'SP',
    universidade: 'USP',
    vagas_total: 80,
    vagas_disponiveis: 32,
    tipo: 'presencial',
    tags: ['visita', 'orientação'],
    inscricoes: []
  },
  {
    id: 'evt-2',
    titulo: 'Dia do Vestibulando',
    descricao: 'Evento especial com simulados, palestras de ex-bolsistas ProUni e workshop de redação do ENEM. Traga caderno e caneta. Lanche incluso.',
    data: '2026-08-05',
    horario: '14:00',
    local: 'Campus Higienópolis',
    cidade: 'São Paulo',
    estado: 'SP',
    universidade: 'Mackenzie',
    vagas_total: 50,
    vagas_disponiveis: 8,
    tipo: 'presencial',
    tags: ['simulado', 'redação'],
    inscricoes: []
  },
  {
    id: 'evt-3',
    titulo: 'Visita Guiada FGV',
    descricao: 'Tour completo pela FGV com apresentação de cursos de Administração, Economia e Direito. Entenda como funciona o processo de bolsas institucionais.',
    data: '2026-08-12',
    horario: '10:00',
    local: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    universidade: 'FGV',
    vagas_total: 40,
    vagas_disponiveis: 0,
    tipo: 'presencial',
    tags: ['visita', 'bolsas'],
    inscricoes: []
  },
  {
    id: 'evt-4',
    titulo: 'Workshop ENEM Online',
    descricao: 'Aula online intensiva de Matemática e Ciências da Natureza com professores especialistas. Foco nas questões mais cobradas nos últimos 5 anos.',
    data: '2026-08-18',
    horario: '19:00',
    local: 'Online (Zoom)',
    cidade: 'Online',
    estado: 'ALL',
    universidade: 'ETAPA',
    vagas_total: 500,
    vagas_disponiveis: 347,
    tipo: 'online',
    tags: ['enem', 'matemática', 'online'],
    inscricoes: []
  },
  {
    id: 'evt-5',
    titulo: 'Feira de Bolsas PUC-Rio',
    descricao: 'Conheça todas as opções de bolsas da PUC-Rio, tire dúvidas sobre FIES e ProUni diretamente com a coordenação de admissão.',
    data: '2026-08-22',
    horario: '10:00',
    local: 'Campus Gávea',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    universidade: 'PUC-Rio',
    vagas_total: 120,
    vagas_disponiveis: 85,
    tipo: 'presencial',
    tags: ['bolsas', 'fies'],
    inscricoes: []
  },
  {
    id: 'evt-6',
    titulo: 'Mentoria ProUni — Bate-Papo',
    descricao: 'Sessão de mentoria coletiva com 3 bolsistas ProUni aprovados. Pergunte sobre documentação, entrevista e adaptação à universidade.',
    data: '2026-09-01',
    horario: '15:00',
    local: 'Online (Google Meet)',
    cidade: 'Online',
    estado: 'ALL',
    universidade: 'Portal do Aluno',
    vagas_total: 200,
    vagas_disponiveis: 163,
    tipo: 'online',
    tags: ['mentoria', 'prouni', 'online'],
    inscricoes: []
  },
  {
    id: 'evt-7',
    titulo: 'Semana de Engenharia UFMG',
    descricao: 'Visita técnica aos laboratórios de Engenharia da UFMG com palestras sobre carreira e estágio. Voltado para alunos interessados em bolsas da UFMG.',
    data: '2026-09-10',
    horario: '08:30',
    local: 'Campus Pampulha',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    universidade: 'UFMG',
    vagas_total: 60,
    vagas_disponiveis: 42,
    tipo: 'presencial',
    tags: ['engenharia', 'visita'],
    inscricoes: []
  }
];

// GET /api/events — list events with optional filters
router.get('/', async (req, res) => {
  try {
    const { estado, tipo, q, page = 1, limit = 10 } = req.query;
    let filtered = [...eventsDb];

    if (estado && estado !== 'ALL') {
      filtered = filtered.filter(e => e.estado === estado || e.estado === 'ALL');
    }
    if (tipo) {
      filtered = filtered.filter(e => e.tipo === tipo);
    }
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(e =>
        e.titulo.toLowerCase().includes(query) ||
        e.descricao.toLowerCase().includes(query) ||
        e.universidade.toLowerCase().includes(query)
      );
    }

    // Sort by date ascending
    filtered.sort((a, b) => new Date(a.data) - new Date(b.data));

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paged = filtered.slice(offset, offset + parseInt(limit));

    res.json({
      events: paged.map(e => ({
        ...e,
        lotado: e.vagas_disponiveis <= 0,
        inscricoes: undefined // don't leak user list
      })),
      total: filtered.length,
      page: parseInt(page),
      totalPages: Math.ceil(filtered.length / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar eventos.' });
  }
});

// GET /api/events/:id — single event detail
router.get('/:id', async (req, res) => {
  const event = eventsDb.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Evento não encontrado.' });

  res.json({
    ...event,
    lotado: event.vagas_disponiveis <= 0,
    inscricoes: undefined
  });
});

// POST /api/events/:id/register — register user for event
router.post('/:id/register', requireAuth, async (req, res) => {
  try {
    const event = eventsDb.find(e => e.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento não encontrado.' });

    const userId = req.user.id || 'demo-user';

    if (event.inscricoes.includes(userId)) {
      return res.status(400).json({ error: 'Você já está inscrito neste evento.' });
    }

    if (event.vagas_disponiveis <= 0) {
      return res.status(400).json({ error: 'Evento lotado. Não há vagas disponíveis.' });
    }

    event.inscricoes.push(userId);
    event.vagas_disponiveis -= 1;

    // Confirmação por e-mail com convite .ics (não bloqueia a resposta)
    sendRegistrationEmail(req.user, event).catch(() => {});

    res.json({
      success: true,
      message: `Inscrição confirmada no evento "${event.titulo}"!`,
      vagas_disponiveis: event.vagas_disponiveis
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar inscrição.' });
  }
});

// DELETE /api/events/:id/register — cancel registration
router.delete('/:id/register', requireAuth, async (req, res) => {
  try {
    const event = eventsDb.find(e => e.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento não encontrado.' });

    const userId = req.user.id || 'demo-user';
    const idx = event.inscricoes.indexOf(userId);

    if (idx === -1) {
      return res.status(400).json({ error: 'Você não está inscrito neste evento.' });
    }

    event.inscricoes.splice(idx, 1);
    event.vagas_disponiveis += 1;

    res.json({
      success: true,
      message: `Inscrição cancelada no evento "${event.titulo}".`,
      vagas_disponiveis: event.vagas_disponiveis
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cancelar inscrição.' });
  }
});

// GET /api/events/user/registrations — list user registrations
router.get('/user/registrations', requireAuth, async (req, res) => {
  const userId = req.user.id || 'demo-user';
  const registered = eventsDb.filter(e => e.inscricoes.includes(userId));
  res.json(registered.map(e => ({
    id: e.id,
    titulo: e.titulo,
    data: e.data,
    horario: e.horario,
    local: e.local,
    cidade: e.cidade,
    estado: e.estado,
    universidade: e.universidade,
    tipo: e.tipo
  })));
});

module.exports = router;
