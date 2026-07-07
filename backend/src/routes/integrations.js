const express = require('express');
const { integrationStatus } = require('../services/integrations');

const router = express.Router();

const SOURCES = {
  'mec-prouni': 'MEC_PROUNI_API_URL',
  'inep-sisu': 'INEP_SISU_API_URL',
  'fnde-fies': 'FNDE_FIES_API_URL',
  'inep-enem': 'INEP_ENEM_API_URL'
};

async function fetchSource(source) {
  const envName = SOURCES[source];
  const url = process.env[envName];

  if (!url) {
    return {
      source,
      configured: false,
      message: `${envName} is not configured.`
    };
  }

  const response = await fetch(url, {
    headers: process.env.GOV_API_TOKEN
      ? { Authorization: `Bearer ${process.env.GOV_API_TOKEN}` }
      : {}
  });

  if (!response.ok) {
    throw new Error(`${source} responded with ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  return {
    source,
    configured: true,
    syncedAt: new Date().toISOString(),
    payload
  };
}

// GET /api/integrations/status
router.get('/status', (req, res) => {
  res.json({
    status: integrationStatus(),
    sources: Object.keys(SOURCES),
    checkedAt: new Date().toISOString()
  });
});

// POST /api/integrations/sync/:source
router.post('/sync/:source', async (req, res) => {
  const { source } = req.params;

  if (!SOURCES[source]) {
    return res.status(404).json({ error: 'Unknown integration source.' });
  }

  try {
    const result = await fetchSource(source);
    res.json(result);
  } catch (err) {
    res.status(502).json({
      source,
      configured: true,
      error: err.message
    });
  }
});

module.exports = router;
