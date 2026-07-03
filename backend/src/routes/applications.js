const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../db');

const STATUS_PIPELINE = ['Inscrito', 'Documentos Pendentes', 'Em Análise', 'Convocado', 'Matrícula', 'Aprovado'];
const DEFAULT_DOC_TYPES = ['rg', 'cpf', 'historico_escolar', 'comprovante_enem', 'comprovante_renda'];

// GET /api/applications
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        scholarships (
          id, curso_nome, programa, percentual, prazo_inscricao,
          universities ( nome, sigla )
        ),
        documents ( id, tipo, status, uploaded_at )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const applications = (data || []).map(a => {
      const stepIdx = STATUS_PIPELINE.indexOf(a.status);
      const docs = a.documents || [];
      const pendingDocs = docs.filter(d => d.status === 'pendente');
      const uni = a.scholarships?.universities;
      const prazoDate = a.scholarships?.prazo_inscricao ? new Date(a.scholarships.prazo_inscricao) : null;
      const dias = prazoDate ? Math.max(0, Math.ceil((prazoDate - Date.now()) / 86400000)) : null;
      return {
        ...a,
        sigla: uni?.sigla || '',
        curso: a.scholarships?.curso_nome || '',
        uni: uni?.nome || '',
        pct: a.scholarships?.percentual ? a.scholarships.percentual + '%' : '',
        programa: a.scholarships?.programa || '',
        stepIdx: Math.max(0, stepIdx),
        dias,
        urgente: dias !== null && dias <= 5,
        pendente: pendingDocs.length > 0
          ? 'Enviar ' + (pendingDocs[0].tipo || 'documento').replace('_', ' ')
          : 'Aguardando análise',
      };
    });

    res.json({ applications });
  } catch (e) {
    console.error('GET /api/applications', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/applications
router.post('/', requireAuth, async (req, res) => {
  try {
    const { scholarship_id } = req.body;
    if (!scholarship_id) return res.status(400).json({ error: 'scholarship_id required' });

    // Idempotent — return existing if already applied
    const { data: existing } = await supabase
      .from('applications')
      .select('id, status')
      .eq('user_id', req.user.id)
      .eq('scholarship_id', scholarship_id)
      .maybeSingle();

    if (existing) return res.json({ application: existing, already_exists: true });

    const { data, error } = await supabase
      .from('applications')
      .insert({ user_id: req.user.id, scholarship_id, status: 'Inscrito' })
      .select()
      .single();

    if (error) throw error;

    // Seed default document slots
    await supabase.from('documents').insert(
      DEFAULT_DOC_TYPES.map(tipo => ({ application_id: data.id, tipo, status: 'pending' }))
    );

    res.status(201).json({ application: data });
  } catch (e) {
    console.error('POST /api/applications', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/applications/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        scholarships (
          id, curso_nome, programa, percentual, prazo_inscricao,
          universities ( nome, sigla )
        ),
        documents (*)
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json({ application: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/applications/:id/documents
router.get('/:id/documents', requireAuth, async (req, res) => {
  try {
    // Verify ownership
    const { data: app } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!app) return res.status(404).json({ error: 'Not found' });

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', req.params.id)
      .order('tipo');

    if (error) throw error;
    res.json({ documents: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/applications/:id/documents/:docId
router.patch('/:id/documents/:docId', requireAuth, async (req, res) => {
  try {
    const { status, file_url } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });

    const updates = { status, uploaded_at: new Date().toISOString() };
    if (file_url) updates.file_url = file_url;

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', req.params.docId)
      .select()
      .single();

    if (error) throw error;
    res.json({ document: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/applications/:id/renewals
router.get('/:id/renewals', requireAuth, async (req, res) => {
  try {
    const { data: app } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!app) return res.status(404).json({ error: 'Not found' });

    const { data, error } = await supabase
      .from('renewals')
      .select('*')
      .eq('application_id', req.params.id)
      .order('semestre', { ascending: false });

    if (error) throw error;
    res.json({ renewals: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/applications/:id/renewals
router.post('/:id/renewals', requireAuth, async (req, res) => {
  try {
    const { data: app } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!app) return res.status(404).json({ error: 'Not found' });

    const { semestre, ira, frequencia, observacao } = req.body;
    if (!semestre || ira === undefined || frequencia === undefined) {
      return res.status(400).json({ error: 'semestre, ira, frequencia required' });
    }

    const iraNum = parseFloat(ira);
    const freqNum = parseFloat(frequencia);
    if (isNaN(iraNum) || iraNum < 0 || iraNum > 10) return res.status(400).json({ error: 'ira must be 0-10' });
    if (isNaN(freqNum) || freqNum < 0 || freqNum > 100) return res.status(400).json({ error: 'frequencia must be 0-100' });

    const situacao = iraNum >= 7 && freqNum >= 75 ? 'aprovado' : 'reprovado';

    const { data, error } = await supabase
      .from('renewals')
      .insert({ application_id: req.params.id, semestre, ira: iraNum, frequencia: freqNum, situacao, observacao })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ renewal: data, situacao });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/applications/:id — cancel application
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { data: app } = await supabase
      .from('applications')
      .select('id, status, user_id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!app) return res.status(404).json({ error: 'Candidatura não encontrada' });

    const nonCancellable = ['Aprovado', 'Matrícula'];
    if (nonCancellable.includes(app.status)) {
      return res.status(409).json({ error: `Candidatura com status "${app.status}" não pode ser cancelada` });
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
