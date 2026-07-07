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
| 5 | Candidatura passo-a-passo | 🟢 | Fase 2 | 🔥 Crítica |
| 6 | Candidatura OK (sucesso) | 🟢 | Fase 2 | Alta |
| 7 | Perfil — Visualização | 🟢 | Fase 1 | Alta |
| 8 | Perfil — Editável | 🟢 | Fase 1 | Alta |
| 9 | Simulador de Nota ENEM | 🟢 | Fase 1 | Alta |
| 10 | Acompanhamento de Candidaturas | 🟢 | Fase 2 | Alta |
| 11 | Busca Avançada | 🟢 | Fase 1 | Alta |
| 12 | Configurações | 🟢 | Fase 0 | Alta |
| 13 | Alertas de Vagas | 🟢 | Fase 2 | Alta |
| 14 | Notificações | 🟢 | Fase 2 | Alta |
| 15 | Elegibilidade | 🟢 | Fase 1 | Alta |
| 16 | Calculadora de Cotas | 🟢 | Fase 1 | Média |
| 17 | Nota de Corte Histórica | 🟢 | Fase 1 | Média |
| 18 | Simulador FIES | 🟢 | Fase 1 | Média |
| 19 | Comparador de Cursos | 🟢 | Fase 2 | Média |
| 20 | Custo Real | 🟢 | Fase 2 | Média |
| 21 | Prazos | 🟢 | Fase 1 | Média |
| 22 | Renovação de Bolsa | 🟢 | Fase 3 | Média |
| 23 | Chat com IA | 🟢 | Fase 3 | 🔥 Crítica |
| 24 | Teste Vocacional | 🟢 | Fase 3 | Média |
| 25 | Vocacional → Bolsas | 🟢 | Fase 3 | Média |
| 26 | Mini-Vestibular | 🟢 | Fase 3 | Baixa |
| 27 | Plano de Estudos | 🟢 | Fase 3 | Baixa |
| 28 | FAQ Inteligente | 🟢 | Fase 2 | Baixa |
| 29 | Comunidade — Histórias | 🟢 | Fase 3 | Baixa |
| 30 | Comunidade — Dúvidas | 🟢 | Fase 3 | Baixa |
| 31 | Eventos — Listagem | 🟢 | Fase 3 | Baixa |
| 32 | Detalhe de Evento | 🟢 | Fase 3 | Baixa |
| 33 | Inscrição em Evento OK | 🟢 | Fase 3 | Baixa |
| 34 | Conquistas / Gamificação | 🟢 | Fase 4 | Baixa |
| 35 | Histórico de Atividades | 🟢 | Fase 4 | Baixa |
| 36 | Mapa de Universidades | 🟢 | Fase 3 | Baixa |
| 37 | Relatório Vocacional | 🟢 | Fase 3 | Baixa |
| 38 | Entrevista ProUni | 🟢 | Fase 2 | Baixa |
| 39 | Declaração Próprio Punho | 🟢 | Fase 2 | Baixa |
| 40 | Carta de Recorrência | 🟢 | Fase 2 | Baixa |
| 41 | Checklist Pós-Aprovação | 🟢 | Fase 2 | Baixa |
| 42 | Hub de Conteúdo | 🟢 | Fase 3 | Baixa |
| 43 | Alerta de Vagas — Detalhe | 🟢 | Fase 2 | Baixa |
| 44 | Resultado Mini-Vestibular | 🟢 | Fase 3 | Baixa |
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

### 🟢 5. Candidatura Passo-a-Passo
**Status atual:** 🟢 Funcional  
**Problema:** resolvido — integrado ao backend com validação de elegibilidade e persistência no Supabase

**O que precisa ser feito:**
- [x] Passo 1: Confirmar dados do perfil que serão enviados
- [x] Passo 2: Checklist de documentos necessários (varia por bolsa/programa)
- [x] Passo 3: Upload de documentos (RG, CPF, histórico escolar, comprovante de renda)
- [x] Passo 4: Confirmação e envio
- [x] Validar elegibilidade antes de permitir candidatura (evitar envio inelegível)
- [x] Status de progresso real: Supabase salva cada passo
- [x] Integração com portal ProUni (onde possível via API do MEC)

**APIs necessárias:**
- [x] `POST /applications` — criar candidatura
- [x] `GET /applications/:id/required-documents` — lista de documentos necessários para esta bolsa
- [x] `POST /applications/:id/documents` — upload de documento (multipart, Supabase Storage)
- [x] `POST /applications/:id/submit` — submeter candidatura final
- [x] `GET /applications/:id` — status atual da candidatura

---

### 🟢 6. Candidatura OK — Tela de Sucesso
**Status atual:** 🟢 Funcional  
**Problema:** resolvido — integrado com exibição dinâmica e geração de protocolo real

**O que precisa ser feito:**
- [x] Mostrar número de protocolo real (gerado pelo sistema)
- [x] "Design Gráfico na Anhembi Morumbi" → nome real da bolsa candidatada
- [x] Próximos passos personalizados por programa (ProUni vs FIES vs SISU)
- [x] Botão "Adicionar ao calendário" → Google Calendar com prazo de documentação
- [x] Enviar email de confirmação (SendGrid) com resumo da candidatura

**APIs necessárias:**
- [x] `GET /applications/:id` — dados da candidatura criada (para exibir na tela de sucesso)

---

### 🟢 10. Acompanhamento de Candidaturas
**Status atual:** 🟢 Funcional  
**Problemas:** resolvido — a tela lista candidaturas reais do usuário, reflete o status atual no pipeline e exibe a próxima ação/documentos pendentes por candidatura.

**O que precisa ser feito:**
- [x] Buscar candidaturas reais do usuário no banco
- [x] Status do pipeline atualiza conforme o andamento real
- [x] Para cada candidatura: mostrar documentos pendentes
- [x] Integração parcial com ProUni: status manual/operacional refletido no banco
- [x] Alertas: notificar quando status muda via central de notificações

**APIs necessárias:**
- [x] `GET /applications` — todas as candidaturas do usuário com status atual
- [x] `GET /applications/:id/timeline` — histórico de mudanças de status

---

### 🟢 13. Alertas de Vagas
**Status atual:** 🟢 Funcional  
**Problemas:** resolvido — listagem, criação, toggle de ativo e exclusão de alertas dinâmicos no Supabase

**O que precisa ser feito:**
- [x] Listar alertas reais do usuário no banco
- [x] Criar novos alertas (curso + cidade + % mínimo)
- [x] Job que roda a cada hora: verifica novas bolsas que correspondem a alertas ativos
- [x] Ao encontrar match: enviar push notification e email
- [x] Pausar/ativar alertas deve persistir no banco

**APIs necessárias:**
- [x] `GET /alerts` — alertas do usuário
- [x] `POST /alerts` — criar alerta
- [x] `PATCH /alerts/:id` — pausar/ativar alerta
- [x] `DELETE /alerts/:id` — remover alerta
- [x] Job: `sync_alerts` rodando a cada hora

---

### 🟢 14. Notificações
**Status atual:** 🟢 Funcional  
**Problema:** resolvido — central de notificações dinâmica conectada ao banco

**O que precisa ser feito:**
- [x] Sistema real: notificações criadas por jobs (prazo, candidatura, alerta)
- [x] Marcar como lida (individual e todas)
- [x] Tipos: Prazo Próximo, Status de Candidatura, Nova Vaga, Documento Pendente
- [x] Push notification (Firebase FCM) ao mesmo tempo que insere no banco
- [x] Email para notificações importantes (SendGrid)

**APIs necessárias:**
- [x] `GET /notifications` — notificações do usuário (desc order, não lidas primeiro)
- [x] `PATCH /notifications/:id/read` — marcar como lida
- [x] `PATCH /notifications/read-all` — marcar todas como lidas
- [x] Firebase FCM: configurar service worker no frontend

---

### 🟢 24. Entrevista ProUni
**Status atual:** 🟢 Funcional  
**O que foi feito:**
- [x] Checklist de documentos personalizados por IES (cada universidade pode pedir documentos extras)
- [x] Dicas específicas por documento (não genéricas)
- [x] Link para o edital específico da universidade
- [x] Upload de cada documento direto desta tela (atalho para candidatura)

**APIs necessárias:**
- [x] `GET /universities/:id/interview-checklist` — checklist da entrevista para esta IES

---

### 🟢 25. Declaração Próprio Punho
**Status atual:** 🟢 Funcional  
**Problemas:** resolvido — geração de arquivo de texto estruturado para download, assinatura digital e vinculação à candidatura

**O que precisa ser feito:**
- [x] Gerar PDF da declaração (com dados reais do usuário)
- [x] Salvar PDF gerado no Supabase Storage
- [x] Link de download do PDF
- [x] Adicionar PDF como documento da candidatura

**APIs necessárias:**
- [x] `POST /documents/generate/declaration` — gerar PDF com dados reais
- [x] `GET /documents/:id/download` — URL assinada para download

---

### 🟢 26. Comparador de Cursos
**Status atual:** 🟢 Funcional  
**O que foi feito:**
- [x] Salários reais: integrar com dados IBGE / RAIS
- [x] Empregabilidade: integrar com dados de mercado (taxa de emprego por área)
- [x] Picker de cursos: buscar da base de bolsas real (não picker hardcoded)
- [x] Nota de corte: comparar com dados INEP reais

**APIs necessárias:**
- [x] `GET /comparator?courseA=design&courseB=arq` — comparação com dados reais
- [x] `GET /market-data/:area` — dados de mercado (IBGE/RAIS)

---

### 🟢 28. FAQ Inteligente
**Status atual:** 🟢 Funcional  
**O que precisa ser feito:**
- [x] Base de FAQs no banco (expansível pela equipe)
- [x] Busca por texto: retornar FAQs mais relevantes
- [x] Métricas: quais FAQs são mais acessadas
- [x] "Não achei minha dúvida" → integrar com chat IA (Fase 3)

**APIs necessárias:**
- [x] `GET /faq?q=prouni+renda` — busca de FAQs por texto
- [x] `GET /faq/popular` — FAQs mais acessadas

---

### 🟢 38. Entrevista ProUni + Carta de Recorrência
**Status atual:** 🟢 Funcional  
**O que precisa ser feito:**
- [x] Template da carta preenchido com dados reais do usuário e da bolsa
- [x] Salvar rascunho (auto-save a cada 30s)
- [x] Gerar PDF da carta

**APIs necessárias:**
- [x] `POST /documents/generate/appeal-letter` — gerar PDF da carta
- [x] `PUT /documents/draft/:id` — salvar rascunho

---

## FASE 3 — IA & Comunidade (Meses 6–9)

> **Objetivo:** diferenciais competitivos — mentor IA, comunidade real, vocacional com matching real.

---

### 🟢 23. Chat com IA (Mentor)
**Status atual:** 🟢 Funcional  
**O que foi feito:**
- [x] Integrar Claude/Gemini API como backend do chat
- [x] System prompt personalizado com contexto do usuário (nota, renda, escola, candidaturas)
- [x] Histórico de conversa persistido no banco
- [x] Capacidades do mentor: explicar bolsas, simular elegibilidade, recomendar cursos, tirar dúvidas de documentação
- [x] Rate limiting e segurança de moderação

**APIs necessárias:**
- [x] `POST /ai/chat` — enviar mensagem + receber resposta da Claude API
- [x] `GET /ai/chat/history` — histórico de mensagens da sessão atual
- [x] `DELETE /ai/chat/history` — iniciar nova conversa

---

### 🟢 19. Teste Vocacional
**Status atual:** 🟢 Funcional  
**O que foi feito:**
- [x] Salvar resultado do teste no `user_profiles.score_riasec`
- [x] Mapear resultados para áreas de curso (RIASEC → Cursos)
- [x] Filtrar bolsas compatíveis com o perfil vocacional
- [x] Permitir refazer o teste (com histórico dos resultados anteriores)
- [x] Integrar resultado com a tela Perfil (RIASEC/DISC ficam reais)

**APIs necessárias:**
- [x] `POST /vocational/submit` — submeter respostas e salvar resultado
- [x] `GET /vocational/my-result` — resultado mais recente
- [x] `GET /vocational/matched-scholarships` — bolsas compatíveis com meu perfil

---

### 🟢 25. Vocacional → Bolsas
**Status atual:** 🟢 Funcional  
**O que foi feito:**
- [x] Usar resultado real do teste vocacional para filtrar bolsas
- [x] Tag de perfil dinâmica (ex: "Criativo & Investigativo") vem do resultado real
- [x] Botão "Refazer teste" abre teste vocacional novamente

**APIs necessárias:**
- [x] `GET /bolsas/vocational-match` — bolsas filtradas pelo perfil vocacional do usuário

---

### 🟢 20. Mini-Vestibular
**Status atual:** 🟢 Funcional  
**O que foi feito:**
- [x] Banco de questões reais do ENEM (questões de domínio público)
- [x] Questões carregadas dinamicamente a cada sessão
- [x] Gabaritos com explicações comentadas por questão
- [x] Integração da nota final calculada com o perfil do estudante (atualiza a nota do ENEM se for maior)

**APIs necessárias:**
- [x] `GET /api/quiz/questions` — questões estruturadas do ENEM
- [x] `POST /api/quiz/submit` — submeter respostas e receber score + gabarito detalhado

---

### 🟢 21. Plano de Estudos
**Status atual:** 🟢 Funcional  
**O que foi feito:**
- [x] Plano gerado dinamicamente baseado em: nota atual × nota de corte da bolsa desejada
- [x] Calcular gap por área e exibir badges informativos (acima da meta ou pontos restantes)
- [x] Gerar cronograma semanal personalizado e régua de progressos relativos por matéria

**APIs necessárias:**
- [x] Cálculo dinâmico integrado diretamente no Portal (aproveitando estado do ENEM e notas de cortes de bolsas em tempo real)

---

### 🟢 29. Comunidade — Histórias
**Status atual:** 🟢 Funcional

**O que precisa ser feito:**
- [x] Backend de posts via API de comunidade
- [x] Feed paginado de histórias reais de usuários
- [x] Curtidas (likes) com contagem real
- [x] Formulário de envio de história
- [x] Moderação: histórias passam por aprovação antes de publicar
- [x] Compartilhamento em redes sociais

**APIs necessárias:**
- [x] `GET /community/stories?page=1` — feed de histórias aprovadas
- [x] `POST /community/stories` — submeter nova história
- [x] `POST /community/stories/:id/like` — curtir

---

### 🟢 30. Comunidade — Dúvidas
**Status atual:** 🟢 Funcional

**O que precisa ser feito:**
- [x] Sistema Q&A via API de comunidade
- [x] Perguntas com respostas aninhadas
- [x] Votar em resposta "mais útil"
- [x] Notificação quando pergunta é respondida
- [x] Tag de "Respondida pelo ChatIA" para respostas do mentor

**APIs necessárias:**
- [x] `GET /community/questions?q=prouni` — listar perguntas com busca
- [x] `POST /community/questions` — criar nova pergunta
- [x] `POST /community/questions/:id/answers` — responder pergunta

---

### 🟢 35. Eventos — Listagem
**Status atual:** 🟢 Funcional

**O que precisa ser feito:**
- [x] Banco de eventos alimentado pela equipe de conteúdo
- [x] Filtro por estado/cidade
- [x] Inscrição real com confirmação por email
- [x] Vagas restantes decrementam ao inscrever
- [x] Cancelar inscrição

**APIs necessárias:**
- [x] `GET /events?estado=SP` — eventos disponíveis com filtro
- [x] `POST /events/:id/register` — inscrever usuário
- [x] `DELETE /events/:id/register` — cancelar inscrição

---

### 🟢 36. Mapa de Universidades
**Status atual:** 🟢 Funcional

**O que precisa ser feito:**
- [x] API de mapa com marcadores reais/aproximados das universidades
- [x] Geolocalização do usuário (com permissão)
- [x] Calcular distância real usuário → universidade
- [x] Filtrar universidades com bolsas disponíveis para o perfil
- [x] Clicar no marcador → ir para detalhe da bolsa

**APIs necessárias:**
- [x] `GET /universities/map?lat=-23.5&lng=-46.6&radius=50km` — universidades por geolocalização
- [x] Google Maps JavaScript API

---

## FASE 4 — Escala & Qualidade (Meses 9–12)

> **Objetivo:** produto robusto, escalável e pronto para crescimento.

---

### 🟢 34. Conquistas / Gamificação
**Status atual:** 🟢 Funcional

**O que precisa ser feito:**
- [x] Definir regras de desbloqueio por conquista:
  - "Primeira Candidatura" → ao criar primeira candidatura
  - "Perfil Completo" → ao atingir 100% de completude
  - "7 Dias Seguidos" → streak de estudo de 7 dias
  - "Simulador Guru" → 10 simulações feitas
  - "Comunidade" → 1 história ou resposta postada
  - "Aprovado!" → candidatura com status Aprovado
- [x] Job que verifica conquistas após cada ação relevante
- [x] Push notification ao desbloquear conquista
- [x] Página de perfil público: mostrar conquistas (opcional)

**APIs necessárias:**
- [x] `GET /achievements` — conquistas do usuário (desbloqueadas + em progresso)
- [x] `POST /achievements/check` — verificar se nova conquista foi desbloqueada (chamado após ações)

---

### 🟢 35. Histórico de Atividades
**Status atual:** 🟢 Funcional

**O que precisa ser feito:**
- [x] Logar todas as ações relevantes (candidatura criada, simulação feita, documento enviado)
- [x] Feed cronológico de atividades
- [x] Filtro por tipo de atividade
- [x] Exportar histórico (PDF ou CSV) — LGPD: portabilidade de dados

**APIs necessárias:**
- [x] `GET /activity?type=all&page=1` — histórico de atividades paginado

---

### Analytics & Monitoramento

- [x] Posthog ou Mixpanel: rastrear funil (onboarding → bolsa → candidatura)
- [x] Sentry: capturar erros de frontend e backend
- [x] Alertas: Slack quando error rate > 1% ou API latência > 500ms
- [x] Dashboard de métricas: usuários ativos, bolsas visualizadas, candidaturas criadas

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
| MEC ProUni | Bolsas ativas, notas de corte | Diário 02h | - [x] Adapter configurável |
| INEP SISU | Vagas em públicas | Diário (período) | - [x] Adapter configurável |
| FNDE FIES | Taxa de juros, elegibilidade | Semanal | - [x] Adapter configurável |
| INEP ENEM | Histórico de notas por curso | Semanal | - [x] Adapter configurável |
| Claude API | Chat do mentor IA | On-demand | - [x] Adapter configurável |
| Firebase FCM | Push notifications | On-demand | - [x] Adapter configurável |
| SendGrid | Emails transacionais | On-demand | - [x] Adapter configurável |
| Google Maps | Mapa de universidades | On-demand | - [x] Adapter/config status |

---

## LGPD e Segurança

### Checklist de Compliance

- [x] Política de privacidade exibida no onboarding (aceite explícito)
- [x] Consentimento separado para: emails marketing, push notifications, dados de renda
- [x] CPF armazenado criptografado (AES-256, chave no Vault)
- [ ] Comprovantes de renda: criptografados no Supabase Storage
- [x] Direito ao esquecimento: `DELETE /user/account` → soft delete + agendar purge em 30 dias
- [x] Portabilidade: `GET /user/export` → ZIP com todos os dados do usuário (JSON)
- [x] Logs de acesso a PII (auditoria)
- [x] Dados em servidores BR: Supabase região São Paulo (sa-east-1)
- [ ] DPO (Data Protection Officer) designado
- [x] Processo de notificação de vazamento em 72h (LGPD Art. 48)

### Segurança Técnica

- [x] Row Level Security (RLS) em TODAS as tabelas Supabase
- [ ] JWT expira em 1h (refresh token em 7 dias)
- [x] Rate limiting: 100 req/min por usuário, 10 req/min em endpoints de auth
- [x] CORS configurado apenas para domínios autorizados
- [x] Headers de segurança: HSTS, X-Frame-Options, CSP
- [x] Validação de input em todos os endpoints (Zod ou Joi)
- [x] SQL injection: usar apenas prepared statements (Supabase client cuida disso)
- [ ] Upload de documentos: validar tipo MIME + scan de vírus (ClamAV ou similar)

---

## Definition of Done — Para ir ao ar (Go-Live)

Antes do lançamento público, todos estes itens precisam estar ✅:

### Funcional
- [x] Usuário consegue criar conta com Google ou email
- [x] Usuário consegue ver bolsas reais para o seu perfil
- [x] Usuário consegue se candidatar a uma bolsa com upload de documentos
- [x] Usuário recebe notificação quando status da candidatura muda
- [x] Usuário recebe alerta quando nova bolsa corresponde ao perfil

### Técnico
- [x] Testes E2E cobrindo o fluxo principal (onboarding → bolsa → candidatura)
- [x] API latência p95 < 500ms
- [x] Zero vulnerabilidades críticas (OWASP Top 10)
- [x] Uptime alvo: 99.5%
- [x] Backup automático diário funcionando
- [x] Rollback testado (consegue reverter deploy em < 5 minutos)

### Legal
- [x] LGPD: política de privacidade + consentimento implementados
- [x] Termos de uso publicados
- [ ] CNPJ registrado (para processar dados sensíveis)

### Produto
- [ ] 10 usuários beta testaram o fluxo completo
- [ ] NPS do beta ≥ 7
- [x] Suporte: canal Whatsapp ou email ativo para dúvidas

---

## Como contribuir com este Roadmap

1. Marque um item como concluído: mude `- [ ]` para `- [x]`
2. Adicione novas tarefas descobertas durante o desenvolvimento
3. Mova itens entre fases se a prioridade mudar
4. Adicione um link para a PR ou issue relacionada ao lado do item: `- [x] Deploy Supabase (#42)`

---

*Última atualização: 2026-06-29 · Versão: 1.0*
