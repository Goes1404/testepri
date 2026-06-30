const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../db');

const SYSTEM_PROMPT = `Você é a Etapa, mentora de carreira especializada em bolsas universitárias brasileiras (ProUni, SISU, FIES).
Ajude estudantes a entender programas de bolsas, requisitos, prazos e estratégias.
Seja direta, amigável e use exemplos concretos. Responda sempre em português brasileiro.
Limite respostas a 3 parágrafos curtos. Quando relevante, mencione notas de corte, percentuais de bolsa e prazos.`;

// POST /api/chat
router.post('/', requireAuth, async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'message required (max 1000 chars)' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback mock reply when API key not configured
    const reply = buildFallbackReply(message);
    return res.json({ reply });
  }

  try {
    const messages = [
      ...history.slice(-6).map(m => ({ role: m.who === 'me' ? 'user' : 'assistant', content: m.text })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.json({ reply: buildFallbackReply(message) });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || buildFallbackReply(message);

    // Optionally log activity
    supabase.from('activity_log').insert({
      user_id: req.user.id,
      tipo: 'chat_message',
      dados: { message: message.slice(0, 100) }
    }).catch(() => {});

    res.json({ reply });
  } catch (e) {
    console.error('POST /api/chat', e);
    res.json({ reply: buildFallbackReply(message) });
  }
});

function buildFallbackReply(msg) {
  const t = msg.toLowerCase();
  if (/bolsa|proun|sisu|fies/i.test(t)) {
    return 'Para ProUni você precisa de nota ENEM acima de 450 e renda familiar de até 1,5 salário mínimo per capita (bolsa integral). Com nota 650+ suas chances são excelentes. Quer que eu liste as bolsas disponíveis para seu perfil?';
  }
  if (/nota|enem|corte/i.test(t)) {
    return 'As notas de corte variam por curso e universidade. Design Gráfico geralmente pede 580-620, Medicina pode exigir 780+. A sua nota atual abre ótimas oportunidades — quer ver um comparativo?';
  }
  if (/prazo|inscri|data/i.test(t)) {
    return 'O ProUni 2026 tem inscrições abertas com prazo em 30 de junho. O SISU usa a nota do ENEM 2025 e abre em janeiro. Recomendo garantir sua inscrição o quanto antes pois as vagas são limitadas.';
  }
  if (/document|rg|cpf|histor/i.test(t)) {
    return 'Os documentos obrigatórios para ProUni são: RG, CPF, histórico escolar do ensino médio, comprovante de renda familiar e boletim do ENEM. Digitalize tudo com boa resolução e envie pelo portal MEC.';
  }
  if (/compar|diferença|qual melhor/i.test(t)) {
    return 'ProUni é doação direta (não paga de volta), FIES é financiamento com pagamento pós-formatura. SISU acessa universidades públicas gratuitas. Para renda baixa, ProUni integral é a melhor opção quando disponível.';
  }
  return 'Entendido! Posso ajudar com informações sobre bolsas ProUni, SISU e FIES, notas de corte, documentos necessários e estratégias para aumentar suas chances. O que você gostaria de saber?';
}

module.exports = router;
