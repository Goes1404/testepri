const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { scanBuffer } = require('../services/virusScan');
const { uploadDocument, createSignedDownloadUrl } = require('../services/storage');

// Simple matching logic helper (sync with bolsas.js)
function checkEligibility(b, userEnem, userIncome, userSchool) {
  const isSisu = b.programa === 'SISU';
  const isFies = b.programa === 'FIES';
  const isProUni = b.programa === 'ProUni';

  let eligible = true;
  let reason = '';

  if (isProUni) {
    if (b.percentual === 100 && (userIncome === '2-3' || userIncome === '3+')) {
      eligible = false;
      reason = 'Renda per capita excede 1,5 salário mínimo para bolsa integral.';
    } else if (b.percentual === 50 && userIncome === '3+') {
      eligible = false;
      reason = 'Renda per capita excede 3 salários mínimos para bolsa parcial.';
    }
    if (userSchool === 'privada') {
      eligible = false;
      reason = 'ProUni exige ensino médio em escola pública ou bolsista integral em escola privada.';
    }
  }

  if (isFies) {
    if (userEnem < 450) {
      eligible = false;
      reason = 'FIES exige nota mínima de 450 pontos e redação maior que zero.';
    }
    if (userIncome === '3+') {
      eligible = false;
      reason = 'FIES exige renda per capita familiar de até 3 salários mínimos.';
    }
  }

  return { eligible, reason };
}

// Helper to get required document list based on program
function getRequiredDocumentTypes(programa) {
  if (programa === 'ProUni') {
    return [
      { tipo: 'rg', label: 'RG ou CNH', sub: 'Documento com foto', status: 'ai' },
      { tipo: 'cpf', label: 'CPF', sub: 'Cadastro de Pessoa Física', status: 'ai' },
      { tipo: 'historico', label: 'Histórico escolar', sub: 'Original ou cópia autenticada', status: 'pending' },
      { tipo: 'enem', label: 'Comprovante do ENEM', sub: 'Gabarito oficial ou declaração', status: 'ai' },
      { tipo: 'renda', label: 'Comprovante de renda', sub: 'Últimos 3 meses da família', status: 'pending' }
    ];
  } else if (programa === 'SISU') {
    return [
      { tipo: 'rg', label: 'RG ou CNH', sub: 'Documento com foto', status: 'ai' },
      { tipo: 'cpf', label: 'CPF', sub: 'Cadastro de Pessoa Física', status: 'ai' },
      { tipo: 'historico', label: 'Histórico escolar', sub: 'Original ou cópia autenticada', status: 'pending' },
      { tipo: 'enem', label: 'Comprovante do ENEM', sub: 'Gabarito oficial ou declaração', status: 'ai' }
    ];
  } else if (programa === 'FIES') {
    return [
      { tipo: 'rg', label: 'RG ou CNH', sub: 'Documento com foto', status: 'ai' },
      { tipo: 'cpf', label: 'CPF', sub: 'Cadastro de Pessoa Física', status: 'ai' },
      { tipo: 'enem', label: 'Comprovante do ENEM', sub: 'Gabarito oficial ou declaração', status: 'ai' },
      { tipo: 'renda', label: 'Comprovante de renda', sub: 'Últimos 3 meses da família', status: 'pending' }
    ];
  } else {
    return [
      { tipo: 'rg', label: 'RG ou CNH', sub: 'Documento com foto', status: 'ai' },
      { tipo: 'cpf', label: 'CPF', sub: 'Cadastro de Pessoa Física', status: 'ai' }
    ];
  }
}

const STATUS_PIPELINE = ['Inscrito', 'Documentos', 'Em análise', 'Convocado', 'Matrícula', 'Aprovado'];

function normalizeStatus(status) {
  const value = status || 'Inscrito';
  const normalized = {
    'Em Analise': 'Em análise',
    'Em analise': 'Em análise',
    'Documentos Pendentes': 'Documentos',
    'Documentos pendentes': 'Documentos',
    'Reprovado': 'Reprovado'
  };
  return normalized[value] || value;
}

function getStatusIndex(status) {
  const normalized = normalizeStatus(status);
  const index = STATUS_PIPELINE.indexOf(normalized);
  return index >= 0 ? index : 0;
}

function getPendingDocumentsForApplication(application, documents = []) {
  const programa = application.scholarships?.programa || application.programa;
  const labels = getRequiredDocumentTypes(programa);

  return labels
    .map(doc => {
      const dbDoc = documents.find(d => d.tipo === doc.tipo);
      return {
        tipo: doc.tipo,
        label: doc.label,
        status: dbDoc?.status || doc.status
      };
    })
    .filter(doc => doc.status === 'pending' || doc.status === 'rejected');
}

// GET /api/applications - List all applications for current user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        scholarships (
          curso_nome,
          programa,
          percentual,
          valor_mensalidade,
          prazo_inscricao,
          universities (
            nome,
            sigla
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const applicationIds = (applications || []).map(app => app.id);
    let documents = [];

    if (applicationIds.length > 0) {
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .in('application_id', applicationIds);

      if (docsError) return res.status(500).json({ error: docsError.message });
      documents = docsData || [];
    }

    const enrichedApplications = (applications || []).map(app => {
      const appDocs = documents.filter(doc => doc.application_id === app.id);
      const pendingDocuments = getPendingDocumentsForApplication(app, appDocs);
      const statusLabel = pendingDocuments.length > 0 && normalizeStatus(app.status) === 'Inscrito'
        ? 'Documentos'
        : normalizeStatus(app.status);

      return {
        ...app,
        status: statusLabel,
        stepIdx: getStatusIndex(statusLabel),
        pendingDocuments,
        pendingDocumentsCount: pendingDocuments.length,
        nextAction: pendingDocuments.length > 0
          ? `Enviar ${pendingDocuments[0].label.toLowerCase()}`
          : 'Acompanhar análise da instituição'
      };
    });

    res.json({ applications: enrichedApplications });
  } catch (err) {
    next(err);
  }
});

// POST /api/applications - Create a new application
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { scholarship_id } = req.body;

    if (!scholarship_id) {
      return res.status(400).json({ error: 'scholarship_id is required.' });
    }

    // 1. Fetch user profile
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('nota_enem, renda_familiar, tipo_escola')
      .eq('user_id', userId)
      .single();

    if (profileErr) return res.status(404).json({ error: 'User profile not found.' });

    // 2. Fetch scholarship
    const { data: scholarship, error: schErr } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', scholarship_id)
      .single();

    if (schErr || !scholarship) {
      return res.status(404).json({ error: 'Scholarship not found.' });
    }

    // 3. Verify eligibility
    const userEnem = profile.nota_enem || 600;
    const userIncome = profile.renda_familiar || '2-3';
    const userSchool = profile.tipo_escola || 'publica';

    const { eligible, reason } = checkEligibility(scholarship, userEnem, userIncome, userSchool);
    if (!eligible) {
      return res.status(400).json({
        error: 'Você não atende aos critérios de elegibilidade para esta bolsa.',
        reason
      });
    }

    // 4. Check if application already exists
    const { data: existing, error: existErr } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('scholarship_id', scholarship_id)
      .maybeSingle();

    if (existing) {
      return res.json(existing);
    }

    // 5. Create application record
    const { data: newApp, error: createErr } = await supabase
      .from('applications')
      .insert({
        user_id: userId,
        scholarship_id,
        status: 'Inscrito'
      })
      .select()
      .single();

    if (createErr) return res.status(500).json({ error: createErr.message });

    // 6. Pre-populate documents list
    const docsToCreate = getRequiredDocumentTypes(scholarship.programa).map(d => ({
      application_id: newApp.id,
      tipo: d.tipo,
      status: d.status
    }));

    const { error: docsErr } = await supabase
      .from('documents')
      .insert(docsToCreate);

    if (docsErr) {
      console.error('Error pre-populating documents:', docsErr.message);
    }

    res.status(201).json(newApp);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id - Get detailed application status
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        scholarships (
          curso_nome,
          programa,
          percentual,
          valor_mensalidade,
          prazo_inscricao,
          universities (
            nome,
            sigla
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !application) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    res.json(application);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id/timeline - Status pipeline and history for an application
router.get('/:id/timeline', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        scholarships (
          curso_nome,
          programa,
          universities (
            nome
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !application) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    const { data: documents, error: docsErr } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', id);

    if (docsErr) return res.status(500).json({ error: docsErr.message });

    const pendingDocuments = getPendingDocumentsForApplication(application, documents || []);
    const currentStatus = pendingDocuments.length > 0 && normalizeStatus(application.status) === 'Inscrito'
      ? 'Documentos'
      : normalizeStatus(application.status);
    const currentStep = getStatusIndex(currentStatus);

    const steps = STATUS_PIPELINE.map((label, index) => ({
      label,
      done: index < currentStep,
      current: index === currentStep,
      reachedAt: index === 0
        ? application.created_at
        : (index <= currentStep ? application.updated_at : null)
    }));

    res.json({
      applicationId: application.id,
      currentStatus,
      currentStep,
      steps,
      pendingDocuments,
      history: steps.filter(step => step.done || step.current)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id/required-documents - Get documents checklist status
router.get('/:id/required-documents', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify application ownership
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('id, user_id, scholarships(programa)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    // Fetch existing documents from DB
    const { data: documents, error: docsErr } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', id);

    if (docsErr) return res.status(500).json({ error: docsErr.message });

    const requiredDocs = getRequiredDocumentTypes(app.scholarships.programa);

    // Map DB status to output format
    const results = requiredDocs.map(reqDoc => {
      const dbDoc = documents.find(d => d.tipo === reqDoc.tipo);
      return {
        tipo: reqDoc.tipo,
        label: reqDoc.label,
        sub: reqDoc.sub,
        status: dbDoc ? dbDoc.status : reqDoc.status,
        file_url: dbDoc ? dbDoc.file_url : null
      };
    });

    res.json({ documents: results });
  } catch (err) {
    next(err);
  }
});

// POST /api/applications/:id/documents - Upload document to private Storage bucket
router.post('/:id/documents', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { tipo, file_name, mime_type = 'application/pdf', file_base64 } = req.body;
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    if (!tipo) {
      return res.status(400).json({ error: 'tipo (document type) is required.' });
    }

    if (!file_base64) {
      return res.status(400).json({ error: 'file_base64 (document content) is required.' });
    }

    if (!allowedMimeTypes.includes(mime_type)) {
      return res.status(400).json({
        error: 'Tipo de arquivo inválido.',
        allowedMimeTypes
      });
    }

    // Verify application ownership
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    let buffer;
    try {
      buffer = Buffer.from(file_base64, 'base64');
    } catch {
      return res.status(400).json({ error: 'file_base64 invalido.' });
    }

    if (buffer.length === 0 || buffer.length > maxSizeBytes) {
      return res.status(400).json({ error: 'Arquivo vazio ou maior que 10MB.' });
    }

    const scanResult = await scanBuffer(buffer);

    if (!scanResult.clean) {
      const { data: rejected, error: rejectErr } = await supabase
        .from('documents')
        .upsert({
          application_id: id,
          tipo,
          status: 'rejected',
          file_url: null,
          metadata: { scan: scanResult, rejected_at: new Date().toISOString() },
          uploaded_at: new Date().toISOString()
        }, { onConflict: 'application_id,tipo' })
        .select()
        .single();

      if (rejectErr) return res.status(500).json({ error: rejectErr.message });

      return res.status(422).json({
        error: 'Arquivo rejeitado: ameaça detectada pelo scan de segurança.',
        document: rejected
      });
    }

    const storagePath = await uploadDocument({
      userId,
      applicationId: id,
      tipo,
      fileName: file_name,
      mimeType: mime_type,
      buffer
    });

    // Upsert document record
    const { data: document, error: docErr } = await supabase
      .from('documents')
      .upsert({
        application_id: id,
        tipo,
        status: 'sent',
        file_url: storagePath,
        metadata: { scan: scanResult },
        uploaded_at: new Date().toISOString()
      }, { onConflict: 'application_id,tipo' })
      .select()
      .single();

    if (docErr) return res.status(500).json({ error: docErr.message });

    // Update application status to "Documentos" if any are pending
    await supabase
      .from('applications')
      .update({ status: 'Documentos', updated_at: new Date().toISOString() })
      .eq('id', id);

    res.json({
      message: 'Documento registrado com sucesso.',
      document
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id/documents/:documentId/download - Signed URL for own document
router.get('/:id/documents/:documentId/download', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id, documentId } = req.params;

    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    const { data: document, error: docErr } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('application_id', id)
      .single();

    if (docErr || !document || !document.file_url) {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    const signedUrl = await createSignedDownloadUrl(document.file_url);
    res.json({ signedUrl, expiresInSeconds: 600 });
  } catch (err) {
    next(err);
  }
});

// POST /api/applications/:id/submit - Finalize application
router.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify application ownership
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select(`
        id,
        scholarship_id,
        scholarships (
          curso_nome,
          universities (
            nome
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    // Update application status to "Em análise"
    const { data: updatedApp, error: updateErr } = await supabase
      .from('applications')
      .update({
        status: 'Em análise',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    // Create confirmation notification
    const curso = app.scholarships.curso_nome;
    const uni = app.scholarships.universities?.nome || 'universidade';

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        tipo: 'Candidatura',
        titulo: 'Candidatura enviada!',
        corpo: `Sua inscrição para ${curso} na ${uni} foi registrada com sucesso sob análise.`
      });

    res.json({
      message: 'Candidatura finalizada com sucesso.',
      application: updatedApp
    });
  } catch (err) {
    next(err);
  }
});

const fs = require('fs');
const path = require('path');
const { encryptText } = require('../services/crypto');

const getStorageDir = () => {
  const dir = path.join(__dirname, '..', '..', 'storage');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// POST /api/applications/:id/declaration - Generate and save income declaration
router.post('/:id/declaration', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { nome, cpf, endereco, ocupacao, renda, familia } = req.body;

    if (!nome || !cpf || !endereco || !ocupacao || !renda || !familia) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    const rendaNum = parseFloat(renda) || 0;
    const familiaInt = parseInt(familia, 10) || 1;
    const rpc = familiaInt > 0 ? (rendaNum / familiaInt) : 0;
    const cpf_encrypted = encryptText(cpf);

    const declarationText = `DECLARAÇÃO DE RENDIMENTOS - TRABALHO AUTÔNOMO / INFORMAL

Eu, ${nome}, portador(a) do CPF ${cpf}, residente no endereço ${endereco}, declaro para os devidos fins de comprovação de renda para o ProUni/MEC que exerço a atividade de ${ocupacao}, auferindo renda média mensal de R$ ${rendaNum.toLocaleString('pt-BR', {minimumFractionDigits: 2})}.

Declaro ainda que o grupo familiar sob minha responsabilidade é composto por ${familiaInt} pessoa(s), resultando em uma renda familiar per capita de R$ ${rpc.toLocaleString('pt-BR', {minimumFractionDigits: 2})}.

Sob as penas da lei, declaro que as informações acima são verdadeiras e assumo total responsabilidade civil e criminal pelo seu conteúdo.

Declarante: ${nome}
CPF: ${cpf}
Data: ${new Date().toLocaleDateString('pt-BR')}
Assinatura Digital: ASSINADO ELETRO-DIGITALMENTE (IP MOCK)`;

    const storageDir = getStorageDir();
    const filePath = path.join(storageDir, `declaration-${id}.txt`);
    fs.writeFileSync(filePath, declarationText, 'utf8');

    const fileUrl = `/api/applications/${id}/declaration/download`;
    
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('application_id', id)
      .eq('tipo', 'renda')
      .maybeSingle();

    if (existingDoc) {
      await supabase
        .from('documents')
        .update({
          status: 'sent',
          file_url: fileUrl,
          metadata: { cpf_encrypted },
          uploaded_at: new Date().toISOString()
        })
        .eq('id', existingDoc.id);
    } else {
      await supabase
        .from('documents')
        .insert({
          application_id: id,
          tipo: 'renda',
          status: 'sent',
          file_url: fileUrl,
          metadata: { cpf_encrypted }
        });
    }

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        tipo: 'Documento',
        titulo: 'Declaração de Renda assinada! 📝',
        corpo: 'Sua autodeclaração foi gerada com sucesso e associada à sua candidatura.'
      });

    res.json({ success: true, file_url: fileUrl });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id/declaration/download - Download income declaration file
router.get('/:id/declaration/download', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    const storageDir = getStorageDir();
    const filePath = path.join(storageDir, `declaration-${id}.txt`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Documento não gerado ainda.' });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=declaracao-renda-${id}.txt`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/applications/:id/appeal - Generate and save appeal letter
router.post('/:id/appeal', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { motivo, descricao } = req.body;

    if (!motivo) {
      return res.status(400).json({ error: 'motivo is required.' });
    }

    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select(`
        *,
        scholarships (
          curso_nome,
          percentual,
          universities (
            nome,
            sigla
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nota_enem, user:users(nome_completo, email)')
      .eq('user_id', userId)
      .single();

    const userName = profile?.user?.nome_completo || 'Marina Alves';
    const userCpf = '000.000.000-00'; 
    const courseName = app.scholarships.curso_nome;
    const universityName = app.scholarships.universities?.nome || 'Instituição';
    const percentual = app.scholarships.percentual;

    const appealText = `TERMO DE RECURSO ADMINISTRATIVO - PROUNI

À Comissão Local do ProUni / Setor de Bolsas
Instituição: ${universityName}
Curso: ${courseName} - Bolsa de ${Math.round(percentual)}%

Eu, ${userName}, portador(a) do CPF ${userCpf}, candidato(a) pré-selecionado(a) no processo seletivo do ProUni, venho por meio deste apresentar RECURSO contra a decisão de indeferimento de minha inscrição, com base nos seguintes fatos:

Motivo do Recurso: ${motivo}
Detalhamento: ${descricao || 'Solicito a reavaliação documental tendo em vista a consistência das declarações de renda familiar per capita no limite legal do programa.'}

Solicito a reanálise dos documentos anexos e a revisão do parecer, garantindo o direito à conclusão da bolsa de estudos.

Atenciosamente,
${userName}
CPF: ${userCpf}
Data: ${new Date().toLocaleDateString('pt-BR')}
Assinatura: ___________________________`;

    const storageDir = getStorageDir();
    const filePath = path.join(storageDir, `appeal-${id}.txt`);
    fs.writeFileSync(filePath, appealText, 'utf8');

    const fileUrl = `/api/applications/${id}/appeal/download`;

    await supabase
      .from('documents')
      .insert({
        application_id: id,
        tipo: 'recurso',
        status: 'sent',
        file_url: fileUrl
      });

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        tipo: 'Candidatura',
        titulo: 'Recurso gerado com sucesso! ⚖️',
        corpo: `Carta de recurso para ${courseName} foi anexada aos seus arquivos.`
      });

    res.json({ success: true, text: appealText, file_url: fileUrl });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id/appeal/download - Download appeal letter file
router.get('/:id/appeal/download', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    const storageDir = getStorageDir();
    const filePath = path.join(storageDir, `appeal-${id}.txt`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Recurso não gerado ainda.' });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=recurso-prouni-${id}.txt`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id/interview-checklist - Custom interview checklist for application
router.get('/:id/interview-checklist', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Fetch application with scholarship and university details
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select(`
        *,
        scholarships (
          curso_nome,
          programa,
          university_id,
          universities (
            nome,
            sigla
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (appErr || !app) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    const sigla = app.scholarships.universities?.sigla || 'IES';
    const uniName = app.scholarships.universities?.nome || 'Instituição';
    const programa = app.scholarships.programa;

    // Base ProUni checklist
    const checklist = [
      {
        tipo: 'renda',
        titulo: 'Comprovante de renda de todos da casa',
        desc: 'Holerite, extrato ou declaração de cada pessoa que mora com você nos últimos 3 meses. É o item que mais reprova candidatos.',
        dica: 'Sem renda formal? Use a Declaração de Próprio Punho — modelo dentro do app.',
        critical: true
      },
      {
        tipo: 'historico',
        titulo: 'Histórico escolar do ensino médio',
        desc: 'Comprova que você cursou todo o EM em escola pública — seu principal critério de cota no ProUni.',
        dica: 'Peça à secretaria da escola com 1 semana de antecedência.',
        critical: true
      },
      {
        tipo: 'rg_cpf',
        titulo: 'RG, CPF e comprovante de residência',
        desc: 'De você e de todos do grupo familiar. O endereço precisa bater com o da inscrição.',
        dica: 'Conta de luz ou água dos últimos 90 dias serve como comprovante.',
        critical: false
      },
      {
        tipo: 'certidao',
        titulo: 'Certidão de nascimento ou casamento',
        desc: 'Para comprovar a composição do grupo familiar declarado na inscrição.',
        dica: 'Divergência no nº de pessoas é o erro nº1 — confira antes de enviar.',
        critical: false
      }
    ];

    // IES Specific extra documents
    let extras = [];
    let editalUrl = 'https://prouni.mec.gov.br';

    if (sigla.toUpperCase() === 'PUC') {
      extras = [
        {
          tipo: 'puc_socioeco',
          titulo: 'Ficha Socioeconômica Simplificada PUC',
          desc: 'Formulário interno da PUC Campinas obrigatório para análise de perfil de bolsista.',
          dica: 'Baixe no portal do candidato PUC, preencha à tinta azul e assine.',
          critical: true
        }
      ];
      editalUrl = 'https://www.puccampinas.edu.br/prouni';
    } else if (sigla.toUpperCase() === 'AM' || sigla.toUpperCase() === 'ANHEMBI') {
      extras = [
        {
          tipo: 'anhembi_decl',
          titulo: 'Formulário de Renda Grupo Familiar Anhembi',
          desc: 'Anexo de declaração interna do grupo Anhembi Morumbi para validação de cotas ProUni.',
          dica: 'Disponível no link de editais da Anhembi. Preencha todos os membros.',
          critical: true
        }
      ];
      editalUrl = 'https://portal.anhembi.br/prouni';
    } else {
      extras = [
        {
          tipo: 'declaracao_cotista',
          titulo: `Ficha de Cadastro de Bolsista ${sigla}`,
          desc: `Ficha cadastral da secretaria da ${uniName} para validação de dados da matrícula.`,
          dica: 'Você pode retirar na secretaria de atendimento ao aluno ou no site oficial.',
          critical: false
        }
      ];
    }

    res.json({
      university: {
        nome: uniName,
        sigla: sigla,
        edital_url: editalUrl
      },
      programa,
      checklist: [...checklist, ...extras]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
