const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

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

module.exports = router;
