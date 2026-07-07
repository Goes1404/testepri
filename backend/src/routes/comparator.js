const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

const MARKET_DATA = {
  "design": {
    area: "Artes & Design",
    salario_medio: 3850.00,
    taxa_emprego: 84.5,
    crescimento: "+4.8%",
    inep_media: 610.00
  },
  "arquitetura": {
    area: "Engenharia & Construção",
    salario_medio: 4620.00,
    taxa_emprego: 79.2,
    crescimento: "+2.1%",
    inep_media: 645.00
  },
  "tecnologia": {
    area: "Tecnologia da Informação",
    salario_medio: 6200.00,
    taxa_emprego: 92.8,
    crescimento: "+12.4%",
    inep_media: 670.00
  },
  "saude": {
    area: "Ciências da Saúde",
    salario_medio: 5400.00,
    taxa_emprego: 88.3,
    crescimento: "+6.1%",
    inep_media: 710.00
  },
  "direito": {
    area: "Ciências Sociais Aplicadas",
    salario_medio: 4900.00,
    taxa_emprego: 75.0,
    crescimento: "+1.5%",
    inep_media: 660.00
  },
  "administracao": {
    area: "Gestão & Negócios",
    salario_medio: 4100.00,
    taxa_emprego: 81.0,
    crescimento: "+3.0%",
    inep_media: 605.00
  },
  "default": {
    area: "Geral",
    salario_medio: 3200.00,
    taxa_emprego: 78.0,
    crescimento: "+2.0%",
    inep_media: 580.00
  }
};

function getAreaForCourse(courseName) {
  const c = (courseName || '').toLowerCase();
  if (c.includes('design') || c.includes('comunica') || c.includes('art')) return 'design';
  if (c.includes('arq') || c.includes('civil') || c.includes('constru')) return 'arquitetura';
  if (c.includes('computa') || c.includes('sistemas') || c.includes('analise') || c.includes('tecnolog') || c.includes('software')) return 'tecnologia';
  if (c.includes('enferm') || c.includes('medicin') || c.includes('fisiot') || c.includes('odont') || c.includes('psicol')) return 'saude';
  if (c.includes('dir') || c.includes('lei')) return 'direito';
  if (c.includes('adm') || c.includes('contab') || c.includes('gest') || c.includes('negoc')) return 'administracao';
  return 'default';
}

// GET /api/comparator - Get comparison between courses
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'Nenhum curso especificado para comparação.' });
    }

    const idList = ids.split(',').map(id => {
      const parsed = parseInt(id.trim(), 10);
      return isNaN(parsed) ? null : parsed;
    }).filter(id => id !== null);

    if (idList.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs inválida.' });
    }

    // Query scholarships with university details
    const { data: scholarships, error } = await supabase
      .from('scholarships')
      .select(`
        *,
        universities (
          nome,
          sigla
        )
      `)
      .in('id', idList);

    if (error || !scholarships || scholarships.length === 0) {
      return res.status(404).json({ error: 'Nenhum curso correspondente encontrado.' });
    }

    const results = scholarships.map(b => {
      const areaKey = getAreaForCourse(b.curso_nome);
      const market = MARKET_DATA[areaKey];
      return {
        id: b.id,
        curso: b.curso_nome,
        uni: b.universities?.nome || 'Instituição',
        sigla: b.universities?.sigla || 'IES',
        percentual: b.percentual,
        valor_mensalidade: b.valor_mensalidade,
        nota_corte: b.nota_corte,
        programa: b.programa,
        prazo_inscricao: b.prazo_inscricao,
        market: {
          area: market.area,
          salario_medio: market.salario_medio,
          taxa_emprego: market.taxa_emprego,
          crescimento: market.crescimento,
          inep_media: market.inep_media
        }
      };
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/comparator/market-data/:area - Get raw market data for area
router.get('/market-data/:area', requireAuth, async (req, res, next) => {
  try {
    const { area } = req.params;
    const data = MARKET_DATA[area.toLowerCase()] || MARKET_DATA['default'];
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
