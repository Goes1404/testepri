const express = require('express');
const router = express.Router();

// Static curated articles — extend with a CMS table later
const ARTICLES = [
  { id: 1, tag: 'Bolsas',  titulo: 'Guia completo do ProUni e FIES em 2026',          tempo: '8 min', destaque: true,  body: 'O ProUni oferece bolsas integrais (100%) e parciais (50%) em instituições particulares. Para concorrer você precisa ter feito o ENEM, ter renda familiar de até 1,5 salário mínimo per capita (bolsa integral) ou 3 SM (parcial) e ter cursado todo o ensino médio em escola pública ou em particular com bolsa integral.' },
  { id: 2, tag: 'Carreira', titulo: 'Design ou Arquitetura? Como decidir sem medo',    tempo: '4 min', destaque: false, body: 'As duas carreiras compartilham raciocínio espacial e criatividade, mas diferem no campo de atuação. Design tem saída rápida no mercado digital e remoto; Arquitetura exige mais anos de estudo (5 anos + estágio + CAU-BR) e tem renda maior no topo. Se você se identifica com UX e tecnologia, Design é o caminho.' },
  { id: 3, tag: 'ENEM',    titulo: 'Como sua nota vira bolsa de 100% no ProUni',      tempo: '6 min', destaque: false, body: 'O cálculo de elegibilidade cruza sua nota do ENEM com a nota de corte da bolsa. A nota de corte varia por curso, instituição e turno. Geralmente noturno tem corte menor. Comece filtrando cursos no turno noturno e municípios menores — as chances aumentam bastante.' },
  { id: 4, tag: 'Bolsas',  titulo: 'ProUni 2026: calendário e notas de corte',         tempo: '5 min', destaque: false, body: 'O ProUni costuma abrir inscrições em janeiro, logo após a divulgação das notas do ENEM. Fique atento ao site do MEC (prouni.mec.gov.br). A 1ª chamada costuma sair em fevereiro; a 2ª em março. Se não for chamado, há a lista de espera em abril.' },
  { id: 5, tag: 'Carreira', titulo: '5 profissões criativas em alta para 2027',         tempo: '7 min', destaque: false, body: 'UX Designer, Motion Designer, Arquiteto de Interiores, Diretor de Arte e Designer de Moda são as profissões criativas com maior crescimento previsto até 2027, segundo dados do LinkedIn e IBGE.' },
  { id: 6, tag: 'Mercado', titulo: 'Salários de quem entrou pela bolsa universitária',  tempo: '5 min', destaque: false, body: 'Pesquisa do MEC indica que 67% dos beneficiários do ProUni trabalham na área de formação. A mediana salarial 5 anos após a graduação é de R$ 4.200, chegando a R$ 8.000 em TI e Engenharia.' },
  { id: 7, tag: 'ENEM',    titulo: 'Redação nota 1000: o que os corretores procuram',  tempo: '9 min', destaque: false, body: 'Os cinco critérios são: domínio da norma culta, compreensão do tema, seleção de repertório, coesão e proposta de intervenção. A intervenção precisa ter agente, ação, modo/meio e efeito — quatro elementos obrigatórios para sair da faixa dos 900.' },
  { id: 8, tag: 'Mercado', titulo: 'Estágio durante a faculdade: vale a pena?',         tempo: '4 min', destaque: false, body: 'Sim. Quem estagia nos 2 últimos anos da graduação tem 40% mais chance de emprego formal em até 6 meses após a formatura, segundo o CIEE. A bolsa-estágio também ajuda a custear o próprio curso.' },
];

// GET /api/conteudo?tag=ENEM&limit=10
router.get('/', (req, res) => {
  const { tag, limit = 20 } = req.query;
  let result = ARTICLES;
  if (tag && tag !== 'Tudo') result = result.filter(a => a.tag === tag);
  res.json({
    articles: result.slice(0, parseInt(limit) || 20).map(({ body, ...a }) => a),
    destaque: ARTICLES.find(a => a.destaque) || ARTICLES[0],
  });
});

// GET /api/conteudo/:id
router.get('/:id', (req, res) => {
  const article = ARTICLES.find(a => a.id === parseInt(req.params.id));
  if (!article) return res.status(404).json({ error: 'Not found' });
  res.json({ article });
});

module.exports = router;
