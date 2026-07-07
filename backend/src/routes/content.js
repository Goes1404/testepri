const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// ─── In-memory content articles ──────────────────────────────────
let articlesDb = [
  {
    id: 'art-1',
    tag: 'Carreira',
    titulo: 'Design ou Arquitetura? Como decidir sem medo',
    resumo: 'Entenda as diferenças salariais, de mercado e de rotina entre as duas áreas mais procuradas por perfis criativos.',
    corpo: `## Design vs Arquitetura: Guia Completo

**Design** e **Arquitetura** são duas carreiras que atraem perfis criativos, mas têm diferenças importantes que podem definir sua satisfação profissional.

### Mercado de Trabalho
- **Design (UX/UI):** Mercado aquecido com crescimento de 25% ao ano. Salário médio júnior: R$ 3.800. Possibilidade de trabalho remoto.
- **Arquitetura:** Mercado estável, ligado à construção civil. Salário médio júnior: R$ 3.200. Trabalho mais presencial.

### Formação
- Design: 4 anos (bacharelado) ou 2 anos (tecnólogo em Design Gráfico)
- Arquitetura: 5 anos (bacharelado) + estágio obrigatório

### Rotina
- Designer: computador, reuniões com clientes, prototipagem digital
- Arquiteto: escritório + visitas a obras, cálculos estruturais, AutoCAD

### Dica da Etapa
Se você gosta de resolver problemas visuais no digital, Design é mais indicado. Se prefere projetos físicos e espaciais, Arquitetura combina mais.`,
    autor: 'Equipe Etapa',
    tempo_leitura: '4 min',
    views: 234,
    created_at: '2026-06-15'
  },
  {
    id: 'art-2',
    tag: 'ENEM',
    titulo: 'Como sua nota vira bolsa de 100% no ProUni',
    resumo: 'Passo a passo de como o MEC calcula a nota de corte e como maximizar suas chances de bolsa integral.',
    corpo: `## De Nota do ENEM a Bolsa Integral

O ProUni usa a **média das 5 provas do ENEM** (incluindo redação) para ranquear os candidatos. Veja como funciona:

### Cálculo da Nota
1. Linguagens + Matemática + Ciências Humanas + Ciências da Natureza + Redação
2. Soma ÷ 5 = Sua média ProUni
3. **Mínimo obrigatório:** 450 pontos (sem zerar redação)

### Notas de Corte 2025/2026
| Curso | Bolsa 100% | Bolsa 50% |
|-------|-----------|-----------|
| Medicina | 780+ | 720+ |
| Direito | 680+ | 620+ |
| Engenharia | 650+ | 590+ |
| Design | 580+ | 530+ |
| Pedagogia | 500+ | 460+ |

### Como Maximizar
- **Redação:** Vale 1/5 da nota. Uma redação 900+ pode compensar notas medianas.
- **Matemática:** Maior peso em cursos de exatas.
- **Escola pública:** Dá acesso a cotas exclusivas com notas de corte menores.

### Dica da Etapa
Use o simulador do Portal para calcular exatamente qual nota você precisa para cada bolsa.`,
    autor: 'Equipe Etapa',
    tempo_leitura: '6 min',
    views: 567,
    created_at: '2026-06-20'
  },
  {
    id: 'art-3',
    tag: 'Mercado',
    titulo: 'Quanto ganha um UX Designer júnior em 2026',
    resumo: 'Pesquisa salarial atualizada com dados do IBGE e Glassdoor para designers que estão começando.',
    corpo: `## Salários de UX Designer Júnior em 2026

Dados compilados de Glassdoor, IBGE CAGED e LinkedIn Salary.

### Faixas Salariais por Região
| Região | Presencial | Remoto |
|--------|-----------|--------|
| São Paulo | R$ 3.500 – 5.200 | R$ 4.000 – 6.500 |
| Rio de Janeiro | R$ 3.000 – 4.800 | R$ 3.800 – 6.000 |
| Minas Gerais | R$ 2.800 – 4.200 | R$ 3.500 – 5.500 |
| Sul | R$ 2.600 – 4.000 | R$ 3.200 – 5.200 |
| Nordeste | R$ 2.200 – 3.500 | R$ 3.000 – 5.000 |

### Progressão de Carreira
- **Júnior (0-2 anos):** R$ 3.500 – 5.200
- **Pleno (2-5 anos):** R$ 6.000 – 9.500
- **Sênior (5+ anos):** R$ 10.000 – 16.000
- **Lead/Manager:** R$ 14.000 – 22.000

### Skills que Aumentam o Salário
1. Figma avançado (+15%)
2. Design System (+20%)
3. Research & Analytics (+18%)
4. Inglês fluente (+25%)`,
    autor: 'Equipe Etapa',
    tempo_leitura: '3 min',
    views: 189,
    created_at: '2026-06-25'
  },
  {
    id: 'art-4',
    tag: 'Finanças',
    titulo: 'Bolsista pode trabalhar? Regras do ProUni e FIES',
    resumo: 'Tudo sobre trabalho, estágio e renda enquanto você é bolsista. O que pode e o que não pode.',
    corpo: `## Trabalhar Sendo Bolsista: Regras Claras

### ProUni
- **Pode trabalhar?** SIM, sem restrições de horário ou salário.
- **Atenção:** Sua renda familiar per capita é verificada na renovação semestral.
- Se ultrapassar 1,5 salário mínimo (bolsa 100%) ou 3 salários mínimos (bolsa 50%), pode perder a bolsa.

### FIES
- Pode trabalhar normalmente durante o curso.
- O pagamento do financiamento começa após a formatura.

### Estágio
- Bolsistas ProUni têm **prioridade** em estágios da própria universidade.
- Bolsa-estágio NÃO conta como renda para fins de renovação ProUni.

### Dica da Etapa
Registre todos os seus rendimentos. Na renovação, tenha contracheques e declarações prontos para comprovar que segue dentro do limite.`,
    autor: 'Equipe Etapa',
    tempo_leitura: '5 min',
    views: 412,
    created_at: '2026-07-01'
  },
  {
    id: 'art-5',
    tag: 'Documentação',
    titulo: 'Checklist completo de documentos para o ProUni',
    resumo: 'Lista definitiva de tudo que você precisa reunir antes de se candidatar. Não perca a vaga por falta de papel.',
    corpo: `## Documentos ProUni — Checklist Completo

### Documentos Pessoais
- [ ] RG e CPF (do candidato e de todos os membros da família)
- [ ] Certidão de nascimento ou casamento
- [ ] Comprovante de residência atualizado (últimos 3 meses)
- [ ] Foto 3x4 recente

### Comprovantes de Renda
- [ ] Contracheques dos últimos 3 meses (para assalariados)
- [ ] Declaração de Imposto de Renda (se declarante)
- [ ] Declaração de próprio punho (para informais)
- [ ] Extrato bancário dos últimos 3 meses
- [ ] CTPS (página de identificação + último contrato)

### Comprovantes Acadêmicos
- [ ] Histórico escolar do Ensino Médio completo
- [ ] Certificado de conclusão do Ensino Médio
- [ ] Boletim do ENEM com nota detalhada

### Documentos Extras (se aplicável)
- [ ] Laudo médico (para cotas PcD)
- [ ] Autodeclaração étnico-racial (para cotas raciais)
- [ ] Declaração de escola pública

### Dica da Etapa
Digitalize TUDO em PDF. A maioria das universidades aceita documentos digitais na primeira fase.`,
    autor: 'Equipe Etapa',
    tempo_leitura: '4 min',
    views: 891,
    created_at: '2026-07-03'
  },
  {
    id: 'art-6',
    tag: 'ENEM',
    titulo: '5 erros que derrubam sua redação do ENEM',
    resumo: 'Professores corretores revelam os erros mais comuns e como evitá-los para garantir nota 800+.',
    corpo: `## 5 Erros Fatais na Redação do ENEM

### 1. Fuga ao Tema
- O ENEM pede uma **proposta de intervenção** para um problema social.
- Se você apenas descreve o problema sem propor solução, perde até 200 pontos.

### 2. Repertório Genérico
- "Como dizia o filósofo..." sem citar quem — evite frases vagas.
- Use dados concretos: "Segundo o IBGE (2024), 11% dos jovens..."

### 3. Proposta de Intervenção Incompleta
A proposta precisa ter 5 elementos:
1. **Agente** (quem vai fazer)
2. **Ação** (o que vai ser feito)
3. **Meio** (como)
4. **Finalidade** (para quê)
5. **Detalhamento** (onde, quando, quanto)

### 4. Parágrafos sem Conectivos
Use: "Além disso", "Em contrapartida", "Nesse sentido", "Portanto"

### 5. Não Respeitar os Direitos Humanos
Qualquer proposta que viole direitos humanos = nota ZERO na competência 5.

### Dica da Etapa
Escreva 2 redações por semana e peça feedback. Use o simulador do Portal para treinar.`,
    autor: 'Equipe Etapa',
    tempo_leitura: '5 min',
    views: 723,
    created_at: '2026-07-04'
  },
  {
    id: 'art-7',
    tag: 'Carreira',
    titulo: 'Profissões em alta para 2027: onde estão as bolsas',
    resumo: 'As áreas com mais vagas de emprego e mais bolsas ProUni/FIES disponíveis para o próximo ciclo.',
    corpo: `## Profissões em Alta para 2027

### Top 5 com Mais Bolsas ProUni
1. **Enfermagem** — 12.400 bolsas (integral + parcial)
2. **Administração** — 10.800 bolsas
3. **Pedagogia** — 9.200 bolsas
4. **Direito** — 8.900 bolsas
5. **Engenharia Civil** — 7.100 bolsas

### Top 5 Salários Iniciais
1. **Medicina** — R$ 12.000
2. **Engenharia de Software** — R$ 8.500
3. **Ciência de Dados** — R$ 7.800
4. **Direito (concurso)** — R$ 7.200
5. **Farmácia** — R$ 5.500

### Áreas em Crescimento
- **IA & Machine Learning** — crescimento de 40% ao ano
- **Saúde Mental** — psicologia em alta demanda pós-pandemia
- **Energias Renováveis** — engenheiros ambientais cada vez mais requisitados

### Dica da Etapa
Combine o resultado do seu teste vocacional com essas tendências para fazer a melhor escolha.`,
    autor: 'Equipe Etapa',
    tempo_leitura: '4 min',
    views: 445,
    created_at: '2026-07-05'
  },
  {
    id: 'art-8',
    tag: 'Finanças',
    titulo: 'Custo real de uma faculdade: além da mensalidade',
    resumo: 'Transporte, alimentação, material — calcule o custo total antes de escolher sua bolsa.',
    corpo: `## O Custo Real da Faculdade

A mensalidade é só uma parte. Veja os custos ocultos:

### Custos Mensais Médios (São Paulo)
| Item | Valor Médio |
|------|------------|
| Transporte (2 passagens/dia) | R$ 440 |
| Alimentação (almoço) | R$ 350 |
| Material didático | R$ 80 |
| Xerox e impressões | R$ 40 |
| Internet (se não tiver) | R$ 100 |
| **Total extra/mês** | **R$ 1.010** |

### Custo Total em 4 Anos
- Mensalidade R$ 0 (bolsa 100%): **R$ 48.480** em custos extras
- Mensalidade R$ 800 (bolsa 50%): **R$ 86.880** total

### Como Economizar
1. Escolha campus perto de casa (use o Mapa do Portal)
2. Restaurante universitário (R$ 2-5 a refeição)
3. Biblioteca ao invés de comprar livros
4. Transporte: vale-transporte do estágio ajuda

### Dica da Etapa
Use a calculadora de Custo Real do Portal para simular os gastos reais da sua bolsa.`,
    autor: 'Equipe Etapa',
    tempo_leitura: '5 min',
    views: 334,
    created_at: '2026-07-06'
  }
];

// GET /api/content — list articles with optional tag filter
router.get('/', async (req, res) => {
  try {
    const { tag, q, page = 1, limit = 10 } = req.query;
    let filtered = [...articlesDb];

    if (tag) {
      filtered = filtered.filter(a => a.tag.toLowerCase() === tag.toLowerCase());
    }
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(a =>
        a.titulo.toLowerCase().includes(query) ||
        a.resumo.toLowerCase().includes(query) ||
        a.tag.toLowerCase().includes(query)
      );
    }

    // Sort by most recent
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paged = filtered.slice(offset, offset + parseInt(limit));

    // Return without corpo for list view (lighter payload)
    res.json({
      articles: paged.map(({ corpo, ...rest }) => rest),
      total: filtered.length,
      page: parseInt(page),
      totalPages: Math.ceil(filtered.length / parseInt(limit)),
      tags: [...new Set(articlesDb.map(a => a.tag))]
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar conteúdos.' });
  }
});

// GET /api/content/:id — single article with full body
router.get('/:id', async (req, res) => {
  const article = articlesDb.find(a => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: 'Artigo não encontrado.' });

  res.json(article);
});

// POST /api/content/:id/view — register a view
router.post('/:id/view', async (req, res) => {
  const article = articlesDb.find(a => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: 'Artigo não encontrado.' });

  article.views += 1;
  res.json({ success: true, views: article.views });
});

module.exports = router;
