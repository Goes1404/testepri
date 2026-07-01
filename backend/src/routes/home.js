const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/home/dashboard
router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch active applications count
    const { count: applicationsCount, error: appError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (appError) console.warn('Dashboard error fetching applications:', appError.message);

    // 2. Fetch nearest deadline
    const { data: deadlines, error: deadlineError } = await supabase
      .from('deadlines')
      .select('*')
      .gt('data_limite', new Date().toISOString())
      .order('data_limite', { ascending: true })
      .limit(1);

    if (deadlineError) console.warn('Dashboard error fetching deadlines:', deadlineError.message);
    const nearestDeadline = deadlines && deadlines[0] ? deadlines[0] : null;

    // 3. Fetch upcoming events (preview)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        universities (
          sigla
        )
      `)
      .gt('data', new Date().toISOString())
      .order('data', { ascending: true })
      .limit(1);

    if (eventsError) console.warn('Dashboard error fetching events:', eventsError.message);
    const nextEvent = events && events[0] ? {
      titulo: events[0].titulo,
      data: new Date(events[0].data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' · ' + new Date(events[0].data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      local: events[0].cidade + ' · ' + events[0].estado,
      vagas: events[0].vagas,
      lotado: events[0].vagas === 0
    } : null;

    // 4. Fetch user profile context for matching
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nota_enem, renda_familiar, tipo_escola')
      .eq('user_id', userId)
      .single();

    let bestMatch = null;
    let bolsasCount = 0;
    let economiaTotal = 0;

    if (profile) {
      const userEnem = profile.nota_enem || 600;
      const userIncome = profile.renda_familiar || '2-3';
      const userSchool = profile.tipo_escola || 'publica';

      // Fetch active scholarships
      const { data: scholarships } = await supabase
        .from('scholarships')
        .select(`
          *,
          universities (
            nome,
            sigla
          )
        `)
        .eq('ativo', true);

      if (scholarships && scholarships.length > 0) {
        bolsasCount = scholarships.length;
        
        let highestPct = 0;
        let bestBolsa = null;

        const calculated = scholarships.map(b => {
          const isSisu = b.programa === 'SISU';
          const isFies = b.programa === 'FIES';
          const isProUni = b.programa === 'ProUni';

          let val = 50;
          if (userEnem >= b.nota_corte) {
            val += Math.min(30, (userEnem - b.nota_corte) * 0.5);
          } else {
            val -= Math.min(40, (b.nota_corte - userEnem) * 0.8);
          }

          let eligible = true;
          if (isProUni) {
            if (b.percentual === 100 && (userIncome === '2-3' || userIncome === '3+')) eligible = false;
            else if (b.percentual === 50 && userIncome === '3+') eligible = false;
            if (userSchool === 'privada') eligible = false;
          }
          if (isFies) {
            if (userEnem < 450 || userIncome === '3+') eligible = false;
          }

          if (!eligible) val = 10;
          const matchVal = Math.max(0, Math.min(100, Math.round(val)));

          // Accumulate economy
          if (eligible && !isSisu && !isFies) {
            economiaTotal += Math.round(parseFloat(b.valor_mensalidade) * (b.percentual / 100));
          }

          if (matchVal > highestPct) {
            highestPct = matchVal;
            bestBolsa = {
              curso: b.curso_nome,
              uni: b.universities?.sigla || 'IES',
              pct: isSisu ? 'Gratuito' : b.percentual + '%',
              programa: b.programa,
              matchVal
            };
          }
          return matchVal;
        });

        bestMatch = bestBolsa;
      }
    }

    const displayNome = req.user?.user_metadata?.nome_completo
      || req.user?.user_metadata?.name
      || req.user?.email?.split('@')[0]
      || 'Estudante';

    res.json({
      displayNome,
      bolsasCount,
      economiaTotal: economiaTotal > 0 ? 'R$ ' + economiaTotal.toLocaleString('pt-BR') : 'R$ 0',
      melhorMatch: bestMatch ? bestMatch.matchVal : 0,
      bestMatch,
      applicationsCount: applicationsCount || 0,
      nearestDeadline: nearestDeadline ? {
        programa: nearestDeadline.programa,
        descricao: nearestDeadline.descricao,
        data: new Date(nearestDeadline.data_limite).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        dias: Math.ceil((new Date(nearestDeadline.data_limite) - new Date()) / (1000 * 60 * 60 * 24))
      } : null,
      nextEvent
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
