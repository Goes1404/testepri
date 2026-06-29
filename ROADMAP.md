# Portal do Aluno — Roadmap de Produção

> **Gerenciado por:** Equipe de Produto  
> **Atualizado em:** 2026-06-29  
> Marque os itens com `[x]` conforme forem concluídos — os checkboxes são clicáveis no GitHub.

---

## Legenda de Status

| Ícone | Significado |
|-------|-------------|
| 🔴 | Mock-only — dados 100% hardcoded, sem backend |
| 🟡 | Parcial — lógica existe, mas dados são mockados |
| 🟢 | Funcional — conectado a dados reais |
| ⚫ | Não priorizado nesta fase |

---

## Status Geral das 45 Telas

| # | Tela | Status Atual | Fase Alvo | Prioridade |
|---|------|-------------|-----------|------------|
| 1 | Onboarding (4 etapas) | 🟢 | Fase 0 | 🔥 Crítica |
| 2 | Home / Início | 🟢 | Fase 1 | 🔥 Crítica |
| 3 | Bolsas — Listagem | 🟢 | Fase 1 | 🔥 Crítica |
| 4 | Detalhe da Bolsa | 🟢 | Fase 1 | 🔥 Crítica |
| 5 | Candidatura passo-a-passo | 🔴 | Fase 2 | 🔥 Crítica |
| 6 | Candidatura OK (sucesso) | 🔴 | Fase 2 | Alta |
| 7 | Perfil — Visualização | 🟢 | Fase 1 | Alta |
| 8 | Perfil — Editável | 🟢 | Fase 1 | Alta |
| 9 | Simulador de Nota ENEM | 🟢 | Fase 1 | Alta |
| 10 | Acompanhamento de Candidaturas | 🟡 | Fase 2 | Alta |
| 11 | Busca Avançada | 🟢 | Fase 1 | Alta |
| 12 | Configurações | 🟢 | Fase 0 | Alta |
| 13 | Alertas de Vagas | 🟡 | Fase 2 | Alta |
| 14 | Notificações | 🔴 | Fase 2 | Alta |
| 15 | Elegibilidade | 🟢 | Fase 1 | Alta |
| 16 | Calculadora de Cotas | 🟢 | Fase 1 | Média |
| 17 | Nota de Corte Histórica | 🟢 | Fase 1 | Média |
| 18 | Simulador FIES | 🟢 | Fase 1 | Média |
| 19 | Comparador de Cursos | 🟡 | Fase 2 | Média |
| 20 | Custo Real | 🟡 | Fase 2 | Média |
| 21 | Prazos | 🟢 | Fase 1 | Média |
| 22 | Renovação de Bolsa | 🔴 | Fase 3 | Média |
| 23 | Chat com IA | 🟡 | Fase 3 | 🔥 Crítica |
| 24 | Teste Vocacional | 🟡 | Fase 3 | Média |
| 25 | Vocacional → Bolsas | 🔴 | Fase 3 | Média |
| 26 | Mini-Vestibular | 🟡 | Fase 3 | Baixa |
| 27 | Plano de Estudos | 🔴 | Fase 3 | Baixa |
| 28 | FAQ Inteligente | 🟡 | Fase 2 | Baixa |
| 29 | Comunidade — Histórias | 🔴 | Fase 3 | Baixa |
| 30 | Comunidade — Dúvidas | 🔴 | Fase 3 | Baixa |
| 31 | Eventos — Listagem | 🔴 | Fase 3 | Baixa |
| 32 | Detalhe de Evento | 🟡 | Fase 3 | Baixa |
| 33 | Inscrição em Evento OK | 🔴 | Fase 3 | Baixa |
| 34 | Conquistas / Gamificação | 🔴 | Fase 4 | Baixa |
| 35 | Histórico de Atividades | 🔴 | Fase 4 | Baixa |
| 36 | Mapa de Universidades | 🔴 | Fase 3 | Baixa |
| 37 | Relatório Vocacional | 🟡 | Fase 3 | Baixa |
| 38 | Entrevista ProUni | 🟡 | Fase 2 | Baixa |
| 39 | Declaração Próprio Punho | 🟡 | Fase 2 | Baixa |
| 40 | Carta de Recorrência | 🟡 | Fase 2 | Baixa |
| 41 | Checklist Pós-Aprovação | 🟡 | Fase 2 | Baixa |
| 42 | Hub de Conteúdo | 🔴 | Fase 3 | Baixa |
| 43 | Alerta de Vagas — Detalhe | 🟡 | Fase 2 | Baixa |
| 44 | Resultado Mini-Vestibular | 🟡 | Fase 3 | Baixa |
| 45 | Processando (loading) | 🟢 | — | Feito |

---

## Arquitetura Alvo

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND                                                    │
│  Vite + React + TypeScript  →  Vercel                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API + Supabase Client
┌─────────────────────────▼───────────────────────────────────┐
│  BACKEND                                                     │
│  Supabase (PostgreSQL + Auth + Storage + Realtime)           │
│  Node.js API (Railway)  →  Supabase Edge Functions           │
└───┬───────────────────────────────────────────┬─────────────┘
    │                                           │
    ▼                                           ▼
APIs GOV                                    SERVIÇOS
MEC ProUni (bolsas)                         Claude API (chat IA)
INEP SISU/ENEM (notas de corte)             Firebase FCM (push)
FNDE FIES (financiamento)                   SendGrid (email)
                                            Google Maps (mapa)
```

---

## FASE 0 — Fundações (Meses 1–2)

> **Objetivo:** colocar o backend no ar e conectar auth. Nenhuma tela nova — só infraestrutura.

### Infraestrutura

- [x] Criar projeto Supabase (região South America — São Paulo)
- [x] Configurar tabelas no Supabase (ver Seção de Banco de Dados)
- [x] Ativar Row Level Security (RLS) em todas as tabelas
- [x] Configurar auth: Google OAuth + email/senha via Supabase Auth
- [x] Criar projeto no Railway para API Node.js
- [x] Setup GitHub Actions: test → build → deploy automático
- [x] Domínio próprio configurado (ex: portaldaluno.com.br)
- [x] SSL/HTTPS ativo (Vercel + Railway cuidam automaticamente)
- [x] Variáveis de ambiente em prod (nunca em código)
- [x] Seed do banco com dados iniciais de bolsas ProUni (~4.500 bolsas do MEC)

### Telas afetadas na Fase 0

- [x] **Onboarding:** conectar ao Supabase Auth (criar conta real)
- [x] **Configurações:** logout real via `supabase.auth.signOut()`

---

## FASE 1 — Core de Bolsas (Meses 2–4)

> **Objetivo:** o coração do produto funciona com dados reais — bolsas, perfil, simulador.

### Telas da Fase 1

---

### 🟢 1. Onboarding — 4 Etapas
**Status atual:** 🟢 Funcional  
**Problema:** dados salvos apenas no localStorage, sem criação real de conta

**O que precisa ser feito:**
- [x] Etapa 1 (boas-vindas): sem mudança
- [x] Etapa 2 (nome): salvar nome no profile Supabase após auth
- [x] Etapa 3 (contexto): salvar `renda`, `nota_enem`, `escola` no `user_profiles`
- [x] Etapa 4 (analisando): fazer chamada real à API de matching de bolsas
- [x] Após onboarding: redirecionar para Home com dados reais pré-carregados
- [x] Tratamento de erro: se API falhar, mostrar mensagem amigável (não tela em branco)

**APIs necessárias:**
- [x] `POST /auth/register` — criar conta (Supabase Auth já provê)
- [x] `PUT /user/profile` — salvar contexto do usuário
- [x] `GET /bolsas/recomendadas` — retornar top bolsas para o perfil

---

### 🟢 2. Home / Início
**Status atual:** 🟢 Funcional  
**Problemas:**
- Hero card sempre mostra "88% Design Gráfico Anhembi" (hardcoded)
- Contadores "{{ bolsasCount }}", "{{ economiaTotal }}", "{{ melhorMatch }}" são calculados em cima de array fixo de 4 bolsas
- "Candidaturas em andamento: 2" é hardcoded
- Prazo "encerra AMANHÃ · 25 de junho" é hardcoded

**O que precisa ser feito:**
- [x] Hero card: buscar melhor bolsa para o perfil do usuário via API
- [x] Contadores: calcular com base nas bolsas reais retornadas
- [x] Candidaturas: buscar candidaturas ativas do usuário no banco
- [x] Prazo urgente: buscar da tabela `deadlines` (sincronizada com MEC)
- [x] "O que fazer hoje": gerar baseado em estado real (documentos pendentes, prazos)
- [x] Eventos preview: buscar próximos 1–2 eventos reais

**APIs necessárias:**
- [x] `GET /home/dashboard` — retorna: melhor bolsa, candidaturas ativas, próximo prazo urgente, eventos
- [x] `GET /bolsas/top-matches?limit=2` — top 2 bolsas recomendadas para o perfil

---

### 🟢 3. Bolsas — Listagem
**Status atual:** 🟢 Funcional  
**Problemas:**
- Apenas 4 bolsas hardcoded (Anhembi, UNESP, FAM, Estácio) — deveriam ser 4.500+
- Filtros (ingresso, modal, pct) não filtram nada real — aplicados em array fixo
- Chances % são estáticas por bolsa (88%, 64%, 57%, 38%)
- Busca por texto não funciona
- Vagas restantes são números aleatórios

**O que precisa ser feito:**
- [x] Conectar listagem ao banco real de bolsas
- [x] Implementar filtros reais: programa (ProUni/SISU/FIES), modalidade (integral/parcial), nota mínima, %bolsa
- [x] Calcular chance% dinamicamente: comparar nota do usuário com histórico de corte da bolsa
- [x] Paginação: carregar 20 bolsas por vez com scroll infinito
- [x] Campo de busca: pesquisa por curso ou universidade (texto livre)
- [x] Ordenação: por maior chance, prazo mais próximo, economia
- [x] Mostrar vagas restantes reais (quando disponíveis via API MEC)
- [x] Indicador visual quando bolsa está prestes a fechar (últimas 48h)

**APIs necessárias:**
- [x] `GET /bolsas?programa=ProUni&pct_minimo=50&nota_minima=650&page=1` — listagem paginada com filtros
- [x] `GET /bolsas/search?q=design+grafico` — busca full-text
- [x] `GET /bolsas/count` — total de bolsas para o perfil do usuário

---

### 🟢 4. Detalhe da Bolsa
**Status atual:** 🟢 Funcional  
**Problemas:**
- Todos os dados (nota de corte, vagas, requisitos) são da bolsa selecionada no array fixo
- "Por que essa chance?" usa lógica real, mas com dados mockados
- Requisitos: ✓/✗ não são verificados com dados reais do usuário
- Histórico de nota de corte (gráfico) usa valores hardcoded

**O que precisa ser feito:**
- [x] Carregar bolsa pelo ID real (não pelo objeto selecionado localmente)
- [x] Requisitos: verificar automaticamente se usuário atende cada requisito
- [x] Gráfico de nota de corte: buscar histórico real dos últimos 4 anos (INEP)
- [x] Vagas: mostrar número real de vagas disponíveis (quando API MEC provê)
- [x] Nota MEC: mostrar avaliação real da instituição (e-MEC)
- [x] Botão "Quero me candidatar": validar elegibilidade antes de avançar

**APIs necessárias:**
- [x] `GET /bolsas/:id` — dados completos da bolsa
- [x] `GET /bolsas/:id/eligibility` — verificar se EU atendo os requisitos
- [x] `GET /bolsas/:id/cut-score-history` — histórico de notas de corte (INEP)
- [x] `GET /bolsas/:id/vacancy-count` — vagas disponíveis atuais

---

### 🟢 7. Perfil — Visualização
**Status atual:** 🟢 Funcional  
**Problemas:**
- Nome "Marina Alves" é hardcoded em múltiplos lugares
- RIASEC "Investigativo · Criativo" é decorativo (quiz não foi feito de verdade)
- DISC "Influência · Consciência" também decorativo
- Régua salarial "UX/Product Designer" não muda conforme vocacional

**O que precisa ser feito:**
- [x] Carregar nome real do usuário logado (Supabase Auth)
- [x] RIASEC/DISC: mostrar apenas se teste vocacional foi realizado (mostrar CTA para fazer se não)
### 🟢 9. Simulador de Nota ENEM
**Status atual:** 🟢 Funcional  
**Problemas:**
- Cálculo de chance funciona, mas usa notas de corte hardcoded (não históricas reais)
- "Bolsas melhoram" não especifica quais bolsas mudam de status
- Slider range: 400–950 (correto), mas referência é array de 4 bolsas fixas

**O que precisa ser feito:**
- [x] Simular sobre bolsas reais do banco (não as 4 fixas)
- [x] Notas de corte: usar histórico real do INEP (média dos últimos 3 anos)
- [x] Mostrar bolsas que "entram" e "saem" do alcance conforme nota muda
- [x] Salvar simulação no histórico do usuário
- [x] Recomendação: "Você precisa de +X pontos para alcançar mais Y bolsas"

**APIs necessárias:**
- [x] `POST /simulador/enem` — retornar bolsas alcançadas com a nota simulada
- [x] `POST /simulador/history` — salvar simulação para histórico

---

### 🟢 15. Elegibilidade
**Status atual:** 🟢 Funcional  
**Problemas:**
- Cálculo usa regras hardcoded: renda ≤ 1,5 SM = ProUni Integral, escola pública = elegível etc.
- Validação correta em lógica, mas os valores de salário mínimo ficam desatualizados

**O que precisa ser feito:**
- [x] Backend atualiza valor do Salário Mínimo mensalmente
- [x] Validar renda per capita com SM atualizado
- [x] Adicionar ProUni Parcial (50%): renda per capita até 3 SM
- [x] Link para o ProUni oficial: "Inscreva-se agora" → portal MEC

**APIs necessárias:**
- [x] `GET /eligibility` — calcula elegibilidade para ProUni, SISU, FIES com dados do perfil atual
- [x] `GET /config/salario-minimo` — valor atual do SM (atualizado mensalmente)

---

### 🟢 16. Calculadora de Cotas
**Status atual:** 🟢 Funcional  
**Problema:** boost por cota é sempre +15% (fixo), sem considerar regras reais por programa

**O que precisa ser feito:**
- [x] Backend calcula boost de cotas baseado em regras reais do ProUni
- [x] Validar cotas: escola pública, renda, PCD, racial (documentos necessários)
- [x] Mostrar quais programas aceitam cada tipo de cota
- [x] Informação sobre como comprovar cada cota

**APIs necessárias:**
- [x] `POST /cotas/calculate` — calcula nova chance considerando cotas selecionadas
- [x] `GET /cotas/requirements` — documentos necessários por tipo de cota

---

### 🟢 17. Nota de Corte Histórica
**Status atual:** 🟢 Funcional  
**Problema:** gráfico mostra dados completamente inventados (não histórico real INEP)

**O que precisa ser feito:**
- [x] Buscar histórico real de notas de corte por curso/universidade (INEP)
- [x] Labels no gráfico: anos reais (2022, 2023, 2024, 2025)
- [x] Linha "você" usa nota real do perfil do usuário
- [x] Cálculo de tendência: regressão linear sobre os últimos 4 anos
- [x] Alerta: se nota está subindo, mostrar por quanto e se preocupa

**APIs necessárias:**
- [x] `GET /bolsas/:id/cut-score-history` — histórico de notas por ano (INEP)
- [x] `GET /bolsas/:id/cut-score-trend` — tendência calculada

---

### 🟢 18. Simulador FIES
**Status atual:** 🟢 Funcional  
**Problema:** fórmula funciona, mas usa taxa de juros fixa (6,8%) que muda com Selic

**O que precisa ser feito:**
- [x] Backend atualiza taxa FIES mensalmente (FNDE API)
- [x] Validar elegibilidade FIES: renda per capita ≤ 3 SM, nota ENEM ≥ 450
- [x] Calcular tabela de amortização real (SAC ou Price, conforme FNDE)
- [x] Informação clara: "Esses valores são estimativas. Consulte o FNDE para valores exatos"

**APIs necessárias:**
- [x] `GET /config/fies-taxa` — taxa de juros atual do FIES
- [x] `POST /fies/simulate` — simulação completa com tabela de amortização
- [x] `GET /fies/eligibility` — validar elegibilidade real

---

### 🟢 21. Prazos
**Status atual:** 🟢 Funcional  
**Problema:** datas hardcoded que não atualizam ("25 jun", "10 jul" — desatualizadas)

**O que precisa ser feito:**
- [x] Sincronizar com calendário oficial MEC (crawler ou API)
- [x] Prazos por programa: ProUni, SISU, FIES — cada um tem ciclo diferente
- [x] Mostrar "X dias restantes" calculado dinamicamente
- [x] Botão de adicionar ao calendário (Google Calendar link)
- [x] Notificação push 7 dias e 1 dia antes de cada prazo

**APIs necessárias:**
- [x] `GET /deadlines` — lista de prazos oficiais dos programas (atualizada diariamente)
- [x] Job: crawler que atualiza prazos da página do MEC diariamente

---

### 🟢 11. Busca Avançada
**Status atual:** 🟢 Funcional  
**Problema:** filtros aplicados sobre array local de 4 bolsas, não em banco real

**O que precisa ser feito:**
- [x] Conectar busca ao banco real de bolsas
- [x] Slider de nota ENEM: range 400–800 (correto) aplicado via API
- [x] Campo de texto: busca por nome do curso ou universidade
- [x] Resultado mostra "X de Y bolsas" (total encontrado vs total disponível)
- [x] Filtro por estado/cidade

**APIs necessárias:**
- [x] `GET /bolsas?q=design&programa=ProUni&nota_min=650&pct_min=50&estado=SP&page=1` — busca paginada

---

### 🟢 12. Configurações
**Status atual:** 🟢 Funcional  
**Problemas:**
- Toggles salvam no estado local, não sincronizam com backend
- "Sair da conta" não faz logout real
- "Marina Alves · marina.alves@email.com" hardcoded

**O que precisa ser feito:**
- [x] Mostrar nome e email real do usuário logado
- [x] Toggles: ao mudar, enviar `PUT /user/preferences`
- [x] "Sair da conta": chamar `supabase.auth.signOut()` e redirecionar para login
- [x] "Privacidade e dados": abrir modal com política de privacidade
- [x] "Ajuda e suporte": abrir chat ou link de suporte real
- [x] "Reiniciar app": renomear para "Apagar dados e sair" com confirmação

**APIs necessárias:**
- [x] `PUT /user/preferences` — salvar preferências de notificação
- [x] `POST /auth/logout` — via Supabase Auth

---

### 🟢 11. Busca Avançada
**Status atual:** 🟢 Funcional  
**Problema:** filtros aplicados sobre array local de 4 bolsas, não em banco real

**O que precisa ser feito:**
- [x] Conectar busca ao banco real de bolsas
- [x] Slider de nota ENEM: range 400–800 (correto) aplicado via API
- [x] Campo de texto: busca por nome do curso ou universidade
- [x] Resultado mostra "X de Y bolsas" (total encontrado vs total disponível)
- [x] Filtro por estado/cidade

**APIs necessárias:**
- [x] `GET /bolsas?q=design&programa=ProUni&nota_min=650&pct_min=50&estado=SP&page=1` — busca paginada

---

## FASE 2 — Candidatura & Documentos (Meses 4–6)

> **Objetivo:** o usuário consegue se candidatar a uma bolsa de verdade, fazer upload de documentos e acompanhar o status.

---

### 🔴 5. Candidatura Passo-a-Passo
**Status atual:** 🔴 Mock-only  
**Problema:** vai direto para tela de sucesso sem coletar nada real, sem validação

**O que precisa ser feito:**
- [ ] Passo 1: Confirmar dados do perfil que serão enviados
- [ ] Passo 2: Checklist de documentos necessários (varia por bolsa/programa)
- [ ] Passo 3: Upload de documentos (RG, CPF, histórico escolar, comprovante de renda)
- [ ] Passo 4: Confirmação e envio
- [ ] Validar elegibilidade antes de permitir candidatura (evitar envio inelegível)
- [ ] Status de progresso real: Supabase salva cada passo
- [ ] Integração com portal ProUni (onde possível via API do MEC)

**APIs necessárias:**
- [ ] `POST /applications` — criar candidatura
- [ ] `GET /applications/:id/required-documents` — lista de documentos necessários para esta bolsa
- [ ] `POST /applications/:id/documents` — upload de documento (multipart, Supabase Storage)
- [ ] `POST /applications/:id/submit` — submeter candidatura final
- [ ] `GET /applications/:id` — status atual da candidatura

---

### 🔴 6. Candidatura OK — Tela de Sucesso
**Status atual:** 🔴 Mock-only  
**Problema:** tela aparece instantaneamente sem processamento real

**O que precisa ser feito:**
- [ ] Mostrar número de protocolo real (gerado pelo sistema)
- [ ] "Design Gráfico na Anhembi Morumbi" → nome real da bolsa candidatada
- [ ] Próximos passos personalizados por programa (ProUni vs FIES vs SISU)
- [ ] Botão "Adicionar ao calendário" → Google Calendar com prazo de documentação
- [ ] Enviar email de confirmação (SendGrid) com resumo da candidatura

**APIs necessárias:**
- [ ] `GET /applications/:id` — dados da candidatura criada (para exibir na tela de sucesso)

---

### 🟡 10. Acompanhamento de Candidaturas
**Status atual:** 🟡 Parcial  
**Problemas:**
- Pipeline visual (Inscrito → Aprovado) não reflete status real
- 2 candidaturas hardcoded (AM, PUC)
- Prazos "6 dias" e "21 dias" são fictícios

**O que precisa ser feito:**
- [ ] Buscar candidaturas reais do usuário no banco
- [ ] Status do pipeline atualiza conforme o andamento real
- [ ] Para cada candidatura: mostrar documentos pendentes
- [ ] Integração parcial com ProUni: verificar se status mudou no portal (scraper ou manual)
- [ ] Alertas: notificar quando status muda

**APIs necessárias:**
- [ ] `GET /applications` — todas as candidaturas do usuário com status atual
- [ ] `GET /applications/:id/timeline` — histórico de mudanças de status

---

### 🟡 13. Alertas de Vagas
**Status atual:** 🟡 Parcial  
**Problemas:**
- 2 alertas hardcoded (Design Gráfico SP, Arquitetura Brasil)
- "lastCheck" fictício ("2h", "1 dia")
- Não há monitoramento real de novas vagas

**O que precisa ser feito:**
- [ ] Listar alertas reais do usuário no banco
- [ ] Criar novos alertas (curso + cidade + % mínimo)
- [ ] Job que roda a cada hora: verifica novas bolsas que correspondem a alertas ativos
- [ ] Ao encontrar match: enviar push notification e email
- [ ] Pausar/ativar alertas deve persistir no banco

**APIs necessárias:**
- [ ] `GET /alerts` — alertas do usuário
- [ ] `POST /alerts` — criar alerta
- [ ] `PATCH /alerts/:id` — pausar/ativar alerta
- [ ] `DELETE /alerts/:id` — remover alerta
- [ ] Job: `sync_alerts` rodando a cada hora

---

### 🔴 14. Notificações
**Status atual:** 🔴 Mock-only  
**Problema:** 4 notificações hardcoded, sem sistema real

**O que precisa ser feito:**
- [ ] Sistema real: notificações criadas por jobs (prazo, candidatura, alerta)
- [ ] Marcar como lida (individual e todas)
- [ ] Tipos: Prazo Próximo, Status de Candidatura, Nova Vaga, Documento Pendente
- [ ] Push notification (Firebase FCM) ao mesmo tempo que insere no banco
- [ ] Email para notificações importantes (SendGrid)

**APIs necessárias:**
- [ ] `GET /notifications` — notificações do usuário (desc order, não lidas primeiro)
- [ ] `PATCH /notifications/:id/read` — marcar como lida
- [ ] `PATCH /notifications/read-all` — marcar todas como lidas
- [ ] Firebase FCM: configurar service worker no frontend

---

### 🟡 24. Entrevista ProUni
**Status atual:** 🟡 Parcial  
**Problema:** checklist com 4 documentos genéricos que não variam por IES

**O que precisa ser feito:**
- [ ] Checklist de documentos personalizados por IES (cada universidade pode pedir documentos extras)
- [ ] Dicas específicas por documento (não genéricas)
- [ ] Link para o edital específico da universidade
- [ ] Upload de cada documento direto desta tela (atalho para candidatura)

**APIs necessárias:**
- [ ] `GET /universities/:id/interview-checklist` — checklist da entrevista para esta IES

---

### 🟡 25. Declaração Próprio Punho
**Status atual:** 🟡 Parcial — template funciona  
**Problema:** sem assinatura digital, documento gerado não é enviado

**O que precisa ser feito:**
- [ ] Gerar PDF da declaração (com dados reais do usuário)
- [ ] Salvar PDF gerado no Supabase Storage
- [ ] Link de download do PDF
- [ ] Adicionar PDF como documento da candidatura

**APIs necessárias:**
- [ ] `POST /documents/generate/declaration` — gerar PDF com dados reais
- [ ] `GET /documents/:id/download` — URL assinada para download

---

### 🟡 26. Comparador de Cursos
**Status atual:** 🟡 Parcial  
**Problema:** dados salariais e empregabilidade são inventados

**O que precisa ser feito:**
- [ ] Salários reais: integrar com dados IBGE / RAIS
- [ ] Empregabilidade: integrar com dados de mercado (taxa de emprego por área)
- [ ] Picker de cursos: buscar da base de bolsas real (não picker hardcoded)
- [ ] Nota de corte: comparar com dados INEP reais

**APIs necessárias:**
- [ ] `GET /comparator?courseA=design&courseB=arq` — comparação com dados reais
- [ ] `GET /market-data/:area` — dados de mercado (IBGE/RAIS)

---

### 🟡 28. FAQ Inteligente
**Status atual:** 🟡 Parcial — 5 FAQs hardcoded  
**O que precisa ser feito:**
- [ ] Base de FAQs no banco (expansível pela equipe)
- [ ] Busca por texto: retornar FAQs mais relevantes
- [ ] Métricas: quais FAQs são mais acessadas
- [ ] "Não achei minha dúvida" → integrar com chat IA (Fase 3)

**APIs necessárias:**
- [ ] `GET /faq?q=prouni+renda` — busca de FAQs por texto
- [ ] `GET /faq/popular` — FAQs mais acessadas

---

### 🟡 38. Entrevista ProUni + Carta de Recorrência
**Status atual:** 🟡 Parcial  
**O que precisa ser feito:**
- [ ] Template da carta preenchido com dados reais do usuário e da bolsa
- [ ] Salvar rascunho (auto-save a cada 30s)
- [ ] Gerar PDF da carta

**APIs necessárias:**
- [ ] `POST /documents/generate/appeal-letter` — gerar PDF da carta
- [ ] `PUT /documents/draft/:id` — salvar rascunho

---

## FASE 3 — IA & Comunidade (Meses 6–9)

> **Objetivo:** diferenciais competitivos — mentor IA, comunidade real, vocacional com matching real.

---

### 🟡 23. Chat com IA (Mentor)
**Status atual:** 🟡 Parcial — 4 respostas hardcoded via regex  
**Problema:** não é IA real — responde sempre a mesma coisa para "bolsa"

**O que precisa ser feito:**
- [ ] Integrar Claude API (Anthropic) como backend do chat
- [ ] System prompt personalizado com contexto do usuário (nota, renda, escola, candidaturas)
- [ ] Histórico de conversa persistido no banco
- [ ] Capacidades do mentor: explicar bolsas, simular elegibilidade, recomendar cursos, tirar dúvidas de documentação
- [ ] Rate limiting: máx 20 mensagens por dia (free tier) / ilimitado (premium)
- [ ] Moderação: filtrar conteúdo inadequado

**APIs necessárias:**
- [ ] `POST /ai/chat` — enviar mensagem + receber resposta da Claude API
- [ ] `GET /ai/chat/history` — histórico de mensagens da sessão atual
- [ ] `DELETE /ai/chat/history` — iniciar nova conversa

---

### 🟡 19. Teste Vocacional
**Status atual:** 🟡 Parcial — quiz funciona, resultado decorativo  
**Problema:** resultado RIASEC não conecta com recomendação de cursos/bolsas

**O que precisa ser feito:**
- [ ] Salvar resultado do teste no `user_profiles.score_vocacional_riasec`
- [ ] Mapear resultados para áreas de curso (RIASEC → Cursos)
- [ ] Filtrar bolsas compatíveis com o perfil vocacional
- [ ] Permitir refazer o teste (com histórico dos resultados anteriores)
- [ ] Integrar resultado com a tela Perfil (RIASEC/DISC ficam reais)

**APIs necessárias:**
- [ ] `POST /vocational/submit` — submeter respostas e salvar resultado
- [ ] `GET /vocational/my-result` — resultado mais recente
- [ ] `GET /vocational/matched-scholarships` — bolsas compatíveis com meu perfil

---

### 🔴 25. Vocacional → Bolsas
**Status atual:** 🔴 Mock-only  
**O que precisa ser feito:**
- [ ] Usar resultado real do teste vocacional para filtrar bolsas
- [ ] Tag de perfil dinâmica (ex: "Criativo & Investigativo") vem do resultado real
- [ ] Botão "Refazer teste" abre teste vocacional novamente

**APIs necessárias:**
- [ ] `GET /bolsas/vocational-match` — bolsas filtradas pelo perfil vocacional do usuário

---

### 🟡 20. Mini-Vestibular
**Status atual:** 🟡 Parcial — 5 questões hardcoded  
**O que precisa ser feito:**
- [ ] Banco de questões reais do ENEM (questões de domínio público)
- [ ] Questões aleatórias a cada sessão
- [ ] Gabaritos com explicações
- [ ] Histórico de performance por área (Linguagens, Matemática, etc.)
- [ ] Comparar performance com média nacional (quando disponível)

**APIs necessárias:**
- [ ] `GET /quiz/questions?area=matematica&quantity=5` — questões aleatórias por área
- [ ] `POST /quiz/submit` — submeter respostas e receber score + gabarito

---

### 🔴 21. Plano de Estudos
**Status atual:** 🔴 Mock-only  
**Problema:** cronograma "Seg-Dom com matérias fictícias" é completamente inventado

**O que precisa ser feito:**
- [ ] Plano gerado baseado em: nota atual × nota de corte da bolsa desejada
- [ ] Calcular gap por área (Linguagens, Matemática, etc.)
- [ ] Gerar cronograma semanal personalizado
- [ ] Marcar dias estudados (gamificação: streak)
- [ ] Integração com plataformas de estudo (links externos): Estuda.com, Khan Academy BR

**APIs necessárias:**
- [ ] `POST /study-plan/generate` — gerar plano baseado no perfil e bolsa alvo
- [ ] `PUT /study-plan/progress` — atualizar progresso diário

---

### 🔴 29. Comunidade — Histórias
**Status atual:** 🔴 Mock-only — 3 histórias fixas

**O que precisa ser feito:**
- [ ] Backend de posts no Supabase (tabela `community_posts`)
- [ ] Feed paginado de histórias reais de usuários
- [ ] Curtidas (likes) com contagem real
- [ ] Formulário de envio de história
- [ ] Moderação: histórias passam por aprovação antes de publicar
- [ ] Compartilhamento em redes sociais

**APIs necessárias:**
- [ ] `GET /community/stories?page=1` — feed de histórias aprovadas
- [ ] `POST /community/stories` — submeter nova história
- [ ] `POST /community/stories/:id/like` — curtir

---

### 🔴 30. Comunidade — Dúvidas
**Status atual:** 🔴 Mock-only — 3 dúvidas fixas

**O que precisa ser feito:**
- [ ] Sistema Q&A no banco
- [ ] Perguntas com respostas aninhadas
- [ ] Votar em resposta "mais útil"
- [ ] Notificação quando pergunta é respondida
- [ ] Tag de "Respondida pelo ChatIA" para respostas do mentor

**APIs necessárias:**
- [ ] `GET /community/questions?q=prouni` — listar perguntas com busca
- [ ] `POST /community/questions` — criar nova pergunta
- [ ] `POST /community/questions/:id/answers` — responder pergunta

---

### 🔴 35. Eventos — Listagem
**Status atual:** 🔴 Mock-only — 3 eventos hardcoded

**O que precisa ser feito:**
- [ ] Banco de eventos alimentado pela equipe de conteúdo
- [ ] Filtro por estado/cidade
- [ ] Inscrição real com confirmação por email
- [ ] Vagas restantes decrementam ao inscrever
- [ ] Cancelar inscrição

**APIs necessárias:**
- [ ] `GET /events?estado=SP` — eventos disponíveis com filtro
- [ ] `POST /events/:id/register` — inscrever usuário
- [ ] `DELETE /events/:id/register` — cancelar inscrição

---

### 🔴 36. Mapa de Universidades
**Status atual:** 🔴 Mock-only — grid visual com posições fictícias

**O que precisa ser feito:**
- [ ] Google Maps API embed com marcadores reais das universidades
- [ ] Geolocalização do usuário (com permissão)
- [ ] Calcular distância real usuário → universidade
- [ ] Filtrar universidades com bolsas disponíveis para o perfil
- [ ] Clicar no marcador → ir para detalhe da bolsa

**APIs necessárias:**
- [ ] `GET /universities/map?lat=-23.5&lng=-46.6&radius=50km` — universidades por geolocalização
- [ ] Google Maps JavaScript API

---

## FASE 4 — Escala & Qualidade (Meses 9–12)

> **Objetivo:** produto robusto, escalável e pronto para crescimento.

---

### 🔴 34. Conquistas / Gamificação
**Status atual:** 🔴 Mock-only — 6 conquistas fixas, nenhuma se desbloqueia de verdade

**O que precisa ser feito:**
- [ ] Definir regras de desbloqueio por conquista:
  - "Primeira Candidatura" → ao criar primeira candidatura
  - "Perfil Completo" → ao atingir 100% de completude
  - "7 Dias Seguidos" → streak de estudo de 7 dias
  - "Simulador Guru" → 10 simulações feitas
  - "Comunidade" → 1 história ou resposta postada
  - "Aprovado!" → candidatura com status Aprovado
- [ ] Job que verifica conquistas após cada ação relevante
- [ ] Push notification ao desbloquear conquista
- [ ] Página de perfil público: mostrar conquistas (opcional)

**APIs necessárias:**
- [ ] `GET /achievements` — conquistas do usuário (desbloqueadas + em progresso)
- [ ] `POST /achievements/check` — verificar se nova conquista foi desbloqueada (chamado após ações)

---

### 🔴 35. Histórico de Atividades
**Status atual:** 🔴 Mock-only — 4 itens hardcoded

**O que precisa ser feito:**
- [ ] Logar todas as ações relevantes (candidatura criada, simulação feita, documento enviado)
- [ ] Feed cronológico de atividades
- [ ] Filtro por tipo de atividade
- [ ] Exportar histórico (PDF ou CSV) — LGPD: portabilidade de dados

**APIs necessárias:**
- [ ] `GET /activity?type=all&page=1` — histórico de atividades paginado

---

### Analytics & Monitoramento

- [ ] Posthog ou Mixpanel: rastrear funil (onboarding → bolsa → candidatura)
- [ ] Sentry: capturar erros de frontend e backend
- [ ] Alertas: Slack quando error rate > 1% ou API latência > 500ms
- [ ] Dashboard de métricas: usuários ativos, bolsas visualizadas, candidaturas criadas

---

## Banco de Dados — Schema Supabase

### Tabelas principais

```sql
-- Usuários e perfis
users           (id, email, nome_completo, avatar_url, created_at)
user_profiles   (id, user_id, nota_enem, renda_familiar, tipo_escola, 
                 cidade, estado, cotas, score_riasec, cursos_interesse)

-- Bolsas e universidades
universities    (id, codigo_mec, nome, sigla, tipo, estados, ranking_mec)
scholarships    (id, university_id, curso_nome, programa, percentual,
                 valor_mensalidade, nota_corte, vagas_total, vagas_disponíveis,
                 renda_maxima, cotas, prazo_inscricao, ativo, last_sync)
cut_score_history (id, scholarship_id, ano, nota_min, nota_max, nota_media)

-- Candidaturas e documentos
applications    (id, user_id, scholarship_id, status, created_at, updated_at)
documents       (id, application_id, tipo, status, file_url, uploaded_at)

-- Notificações e alertas
notifications   (id, user_id, tipo, titulo, corpo, read_at, created_at)
alerts          (id, user_id, criterios, canal, ativo, ultima_notificacao)

-- Prazos e eventos
deadlines       (id, programa, descricao, data_limite, source_url)
events          (id, titulo, universidade_id, data, vagas, cidade, estado)
event_registrations (id, event_id, user_id, created_at)

-- Comunidade
community_posts (id, user_id, tipo, titulo, corpo, aprovado, likes, created_at)
community_answers (id, post_id, user_id, corpo, votos, created_at)

-- Gamificação
achievements    (id, user_id, tipo, desbloqueado_em)
activity_log    (id, user_id, tipo, dados, created_at)

-- Vocacional
vocational_results (id, user_id, score_riasec, areas_recomendadas, created_at)
quiz_sessions   (id, user_id, tipo, respostas, score, created_at)
```

---

## APIs e Integrações Externas

| Integração | Dados | Frequência | Status |
|-----------|-------|-----------|--------|
| MEC ProUni | Bolsas ativas, notas de corte | Diário 02h | - [ ] A implementar |
| INEP SISU | Vagas em públicas | Diário (período) | - [ ] A implementar |
| FNDE FIES | Taxa de juros, elegibilidade | Semanal | - [ ] A implementar |
| INEP ENEM | Histórico de notas por curso | Semanal | - [ ] A implementar |
| Claude API | Chat do mentor IA | On-demand | - [ ] A implementar |
| Firebase FCM | Push notifications | On-demand | - [ ] A implementar |
| SendGrid | Emails transacionais | On-demand | - [ ] A implementar |
| Google Maps | Mapa de universidades | On-demand | - [ ] Fase 3 |

---

## LGPD e Segurança

### Checklist de Compliance

- [ ] Política de privacidade exibida no onboarding (aceite explícito)
- [ ] Consentimento separado para: emails marketing, push notifications, dados de renda
- [ ] CPF armazenado criptografado (AES-256, chave no Vault)
- [ ] Comprovantes de renda: criptografados no Supabase Storage
- [ ] Direito ao esquecimento: `DELETE /user/account` → soft delete + agendar purge em 30 dias
- [ ] Portabilidade: `GET /user/export` → ZIP com todos os dados do usuário (JSON)
- [ ] Logs de acesso a PII (auditoria)
- [ ] Dados em servidores BR: Supabase região São Paulo (sa-east-1)
- [ ] DPO (Data Protection Officer) designado
- [ ] Processo de notificação de vazamento em 72h (LGPD Art. 48)

### Segurança Técnica

- [ ] Row Level Security (RLS) em TODAS as tabelas Supabase
- [ ] JWT expira em 1h (refresh token em 7 dias)
- [ ] Rate limiting: 100 req/min por usuário, 10 req/min em endpoints de auth
- [ ] CORS configurado apenas para domínios autorizados
- [ ] Headers de segurança: HSTS, X-Frame-Options, CSP
- [ ] Validação de input em todos os endpoints (Zod ou Joi)
- [ ] SQL injection: usar apenas prepared statements (Supabase client cuida disso)
- [ ] Upload de documentos: validar tipo MIME + scan de vírus (ClamAV ou similar)

---

## Definition of Done — Para ir ao ar (Go-Live)

Antes do lançamento público, todos estes itens precisam estar ✅:

### Funcional
- [ ] Usuário consegue criar conta com Google ou email
- [ ] Usuário consegue ver bolsas reais para o seu perfil
- [ ] Usuário consegue se candidatar a uma bolsa com upload de documentos
- [ ] Usuário recebe notificação quando status da candidatura muda
- [ ] Usuário recebe alerta quando nova bolsa corresponde ao perfil

### Técnico
- [ ] Testes E2E cobrindo o fluxo principal (onboarding → bolsa → candidatura)
- [ ] API latência p95 < 500ms
- [ ] Zero vulnerabilidades críticas (OWASP Top 10)
- [ ] Uptime alvo: 99.5%
- [ ] Backup automático diário funcionando
- [ ] Rollback testado (consegue reverter deploy em < 5 minutos)

### Legal
- [ ] LGPD: política de privacidade + consentimento implementados
- [ ] Termos de uso publicados
- [ ] CNPJ registrado (para processar dados sensíveis)

### Produto
- [ ] 10 usuários beta testaram o fluxo completo
- [ ] NPS do beta ≥ 7
- [ ] Suporte: canal Whatsapp ou email ativo para dúvidas

---

## Como contribuir com este Roadmap

1. Marque um item como concluído: mude `- [ ]` para `- [x]`
2. Adicione novas tarefas descobertas durante o desenvolvimento
3. Mova itens entre fases se a prioridade mudar
4. Adicione um link para a PR ou issue relacionada ao lado do item: `- [x] Deploy Supabase (#42)`

---

*Última atualização: 2026-06-29 · Versão: 1.0*
