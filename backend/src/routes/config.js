const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// GET /api/config/salario-minimo
router.get('/salario-minimo', (req, res) => {
  res.json({
    valor: 1412.00,
    formatted: 'R$ 1.412,00',
    vigencia: '2024'
  });
});

// GET /api/config/fies-taxa
router.get('/fies-taxa', (req, res) => {
  res.json({
    taxa: 0.068, // 6.8%
    formatted: '6,8% a.a.'
  });
});

module.exports = router;
