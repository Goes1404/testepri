const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// ─── In-memory renewal status ────────────────────────────────────
// userId → { status, bolsa, semestre, checklist, historico }
const renewalData = {};

function getUserRenewal(userId) {
  if (!renewalData[userId]) {
    renewalData[userId] = {
      status: 'pendente', // 'pendente', 'em_analise', 'aprovada', 'reprovada'
      bolsa: {
        curso: 'Design Gráfico',
        universidade: 'Anhembi Morumbi',
        programa: 'ProUni',
        tipo: '100%',
        semestre_atual: '2º semestre 2026'
      },
      prazo: '2026-08-15',
      semestre_renovacao: '1º semestre 2027',
      checklist: [
        {
          id: 'ren-doc-1',
          titulo: 'Comprovante de Matrícula',
          descricao: 'Declaração de matrícula ativa do semestre atual emitida pela secretaria.',
          obrigatorio: true,
          status: 'pendente', // 'pendente', 'enviado', 'aprovado'
          dica: 'Solicite no portal da universidade, seção "Declarações".'
        },
        {
          id: 'ren-doc-2',
          titulo: 'Histórico Acadêmico Atualizado',
          descricao: 'Histórico com todas as notas do semestre atual. Mínimo 75% de aproveitamento.',
          obrigatorio: true,
          status: 'pendente',
          dica: 'O ProUni exige aprovação em 75% das disciplinas. Se reprovar mais de 25%, pode perder a bolsa.'
        },
        {
          id: 'ren-doc-3',
          titulo: 'Comprovante de Renda Atualizado',
          descricao: 'Contracheques dos últimos 3 meses de todos os membros da família.',
          obrigatorio: true,
          status: 'pendente',
          dica: 'Se a renda mudou, declare a mudança. Aumento acima do limite pode gerar perda de bolsa.'
        },
        {
          id: 'ren-doc-4',
          titulo: 'Declaração de Imposto de Renda',
          descricao: 'IRPF do último exercício. Se não declarar, apresente Declaração de Isento.',
          obrigatorio: true,
          status: 'pendente',
          dica: 'A declaração é obrigatória mesmo para quem é isento. Solicite na Receita Federal.'
        },
        {
          id: 'ren-doc-5',
          titulo: 'Declaração de Próprio Punho',
          descricao: 'Atualização da declaração de renda com assinatura do responsável.',
          obrigatorio: false,
          status: 'pendente',
          dica: 'Necessário apenas se algum membro da família trabalha informalmente.'
        },
        {
          id: 'ren-doc-6',
          titulo: 'Atualização Cadastral',
          descricao: 'Formulário de atualização de dados pessoais (endereço, telefone, email).',
          obrigatorio: false,
          status: 'pendente',
          dica: 'Preencha no Portal do ProUni ou diretamente com o coordenador de bolsas da IES.'
        }
      ],
      historico_renovacoes: [
        {
          semestre: '1º semestre 2026',
          status: 'aprovada',
          data_aprovacao: '2026-01-20',
          observacao: 'Documentação completa. Bolsa renovada sem pendências.'
        }
      ]
    };
  }
  return renewalData[userId];
}

// GET /api/renewal/status — renewal status overview
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || 'demo-user';
    const renewal = getUserRenewal(userId);

    const totalDocs = renewal.checklist.length;
    const docsSent = renewal.checklist.filter(d => d.status !== 'pendente').length;
    const docsRequired = renewal.checklist.filter(d => d.obrigatorio).length;
    const docsRequiredSent = renewal.checklist.filter(d => d.obrigatorio && d.status !== 'pendente').length;

    // Calculate days remaining
    const hoje = new Date();
    const prazo = new Date(renewal.prazo);
    const diasRestantes = Math.max(0, Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24)));

    res.json({
      status: renewal.status,
      bolsa: renewal.bolsa,
      prazo: renewal.prazo,
      diasRestantes,
      semestre_renovacao: renewal.semestre_renovacao,
      progresso: {
        total: totalDocs,
        enviados: docsSent,
        obrigatorios: docsRequired,
        obrigatoriosEnviados: docsRequiredSent,
        percentComplete: Math.round((docsSent / totalDocs) * 100)
      },
      historico: renewal.historico_renovacoes
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar status de renovação.' });
  }
});

// GET /api/renewal/checklist — detailed checklist
router.get('/checklist', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || 'demo-user';
    const renewal = getUserRenewal(userId);

    res.json({
      checklist: renewal.checklist,
      prazo: renewal.prazo,
      semestre: renewal.semestre_renovacao,
      bolsa: renewal.bolsa
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar checklist de renovação.' });
  }
});

// POST /api/renewal/checklist/:docId/upload — mark document as sent
router.post('/checklist/:docId/upload', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || 'demo-user';
    const renewal = getUserRenewal(userId);
    const doc = renewal.checklist.find(d => d.id === req.params.docId);

    if (!doc) return res.status(404).json({ error: 'Documento não encontrado.' });

    doc.status = 'enviado';

    res.json({
      success: true,
      message: `Documento "${doc.titulo}" marcado como enviado.`,
      checklist: renewal.checklist
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar documento.' });
  }
});

// POST /api/renewal/submit — submit renewal request
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || 'demo-user';
    const renewal = getUserRenewal(userId);

    // Check if all required docs are sent
    const missingRequired = renewal.checklist.filter(d => d.obrigatorio && d.status === 'pendente');
    if (missingRequired.length > 0) {
      return res.status(400).json({
        error: 'Documentos obrigatórios pendentes.',
        missing: missingRequired.map(d => d.titulo)
      });
    }

    renewal.status = 'em_analise';

    res.json({
      success: true,
      message: 'Solicitação de renovação enviada com sucesso! A análise leva até 15 dias úteis.',
      protocolo: 'REN-' + Date.now().toString(36).toUpperCase(),
      status: 'em_analise'
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao submeter renovação.' });
  }
});

module.exports = router;
