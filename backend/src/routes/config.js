const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { integrationStatus } = require('../services/integrations');

// GET /api/config/salario-minimo
router.get('/salario-minimo', (req, res) => {
  const valor = parseFloat(process.env.SALARIO_MINIMO || '1412.00');
  const vigencia = process.env.SALARIO_MINIMO_VIGENCIA || '2024';
  res.json({
    valor,
    formatted: 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    vigencia
  });
});

// GET /api/config/fies-taxa
router.get('/fies-taxa', (req, res) => {
  const taxa = parseFloat(process.env.FIES_TAXA || '0.068');
  const pct = Math.round(taxa * 1000) / 10;
  res.json({
    taxa,
    formatted: pct.toString().replace('.', ',') + '% a.a.'
  });
});

// GET /api/config/legal
router.get('/legal', (req, res) => {
  res.json({
    termsVersion: process.env.TERMS_VERSION || '2026-07-06',
    privacyVersion: process.env.PRIVACY_POLICY_VERSION || '2026-07-06',
    termsUrl: process.env.TERMS_URL || '/termos-de-uso',
    privacyUrl: process.env.PRIVACY_URL || '/politica-de-privacidade',
    support: {
      email: process.env.SUPPORT_EMAIL || 'suporte@portaldoaluno.com.br',
      whatsapp: process.env.SUPPORT_WHATSAPP || ''
    },
    dataProtection: {
      dpoEmail: process.env.DPO_EMAIL || '',
      retentionDaysAfterDeletion: 30
    },
    entity: {
      cnpj: process.env.CNPJ || '',
      razaoSocial: process.env.RAZAO_SOCIAL || ''
    }
  });
});

// GET /api/config/integrations
router.get('/integrations', (req, res) => {
  res.json({
    status: integrationStatus(),
    checkedAt: new Date().toISOString()
  });
});

module.exports = router;
