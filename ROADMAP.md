# Portal do Aluno — Roadmap

> Repositório: `goes1404/testepri` · Branch ativa: `claude/repo-setup-dev-server-r3mk1b`
> Supabase project: `cryeesunxnfgkshvafbo`
> Última atualização: 2026-07-03 (Fase 5 adicionada)

---

## Legenda
- ✅ Concluído e commitado
- 🔄 Em progresso
- ⬜ Pendente

---

## Fase 1 — Infraestrutura Base ✅

| # | Item | Status |
|---|------|--------|
| 1.1 | Setup Node.js/Express backend com estrutura de rotas | ✅ |
| 1.2 | Integração Supabase (Auth + DB) | ✅ |
| 1.3 | Middleware `requireAuth` + JWT validation | ✅ |
| 1.4 | Schema SQL completo (19 tabelas + RLS + trigger) | ✅ |
| 1.5 | Seed de dados reais (10 unis, 15 bolsas, 12 deadlines, 8 eventos) | ✅ |
| 1.6 | CORS + Morgan + error handler | ✅ |
| 1.7 | `.gitignore` para `.env` | ✅ |

---

## Fase 2 — Rotas Backend ✅

| # | Rota | Arquivo | Status |
|---|------|---------|--------|
| 2.1 | `GET /api/home/dashboard` | `home.js` | ✅ |
| 2.2 | `GET/PUT /api/user/profile` | `user.js` | ✅ |
| 2.3 | `GET /api/bolsas` (filtros, match %) | `bolsas.js` | ✅ |
| 2.4 | `GET/POST /api/applications` | `applications.js` | ✅ |
| 2.5 | `GET /api/applications/:id/documents` | `applications.js` | ✅ |
| 2.6 | `PATCH /api/applications/:id/documents/:docId` | `applications.js` | ✅ |
| 2.7 | `GET /api/applications/:id/renewals` | `applications.js` | ✅ |
| 2.8 | `GET /api/deadlines` | `deadlines.js` | ✅ |
| 2.9 | `GET /api/eventos` + registro | `eventos.js` | ✅ |
| 2.10 | `GET/POST /api/alerts` | `alerts.js` | ✅ |
| 2.11 | `GET /api/notifications` + mark read | `notifications.js` | ✅ |
| 2.12 | `GET /api/comunidade` (posts, answers) | `comunidade.js` | ✅ |
| 2.13 | `POST /api/user/quiz` (salvar sessão) | `user.js` | ✅ |
| 2.14 | `GET /api/user/quiz-history` | `user.js` | ✅ |
| 2.15 | `GET/POST /api/user/achievements` | `user.js` | ✅ |
| 2.16 | `GET /api/conteudo` (Hub de Conteúdo) | `conteudo.js` | ✅ |
| 2.17 | `GET /api/plano/streak` (streak + 7-day) | `plano.js` | ✅ |
| 2.18 | `POST /api/plano/log` (registrar sessão) | `plano.js` | ✅ |
| 2.19 | `POST /api/user/vocacional` | `user.js` | ✅ |
| 2.20 | `GET /api/config` (salário mínimo, FIES etc.) | `config.js` | ✅ |
| 2.21 | `GET /api/bolsas/:id` (detalhe + match personalizado) | `bolsas.js` | ✅ |
| 2.22 | `GET /api/bolsas/:id/cut-score-history` | `bolsas.js` | ✅ |
| 2.23 | `POST /api/bolsas/simulate` (simulação de chance) | `bolsas.js` | ✅ |
| 2.24 | `POST /api/bolsas/cotas/calculate` (cálculo de cotas) | `bolsas.js` | ✅ |
| 2.25 | `GET /api/universidades` (mapa, filtro por estado) | `universidades.js` | ✅ |
| 2.26 | `POST /api/applications/:id/renewals` | `applications.js` | ✅ |
| 2.27 | `DELETE /api/applications/:id` (cancelar candidatura) | `applications.js` | ✅ |
| 2.28 | `unread` count em `GET /api/notifications` | `notifications.js` | ✅ |

---

## Fase 3 — Frontend Wiring ✅

| # | Tela | Wiring | Status |
|---|------|--------|--------|
| 3.1 | Dashboard (Home) | `GET /api/home/dashboard` | ✅ |
| 3.2 | Bolsas (listagem + filtros) | `GET /api/bolsas` | ✅ |
| 3.3 | Detalhe da Bolsa | `GET /api/bolsas/:id` + cut-score-history | ✅ |
| 3.4 | Candidatura / Documentos | `GET/PATCH /api/applications` | ✅ |
| 3.5 | Acompanhamento | `GET /api/applications` | ✅ |
| 3.6 | Prazos | `GET /api/deadlines` | ✅ |
| 3.7 | Eventos | `GET /api/eventos` | ✅ |
| 3.8 | Alertas de Vagas | `GET/POST /api/alerts` | ✅ |
| 3.9 | Notificações | `GET /api/notifications` | ✅ |
| 3.10 | Perfil / Configurações | `GET/PUT /api/user/profile` | ✅ |
| 3.11 | Comunidade | `GET /api/comunidade` | ✅ |
| 3.12 | Simulador ENEM | local + save quiz | ✅ |
| 3.13 | Resultado do Simulador (delta, histórico) | `GET /api/user/quiz-history` | ✅ |
| 3.14 | Vocacional | `POST /api/user/vocacional` | ✅ |
| 3.15 | Relatório Vocacional | RIASEC dinâmico | ✅ |
| 3.16 | Hub de Conteúdo | `GET /api/conteudo` | ✅ |
| 3.17 | Conquistas | `GET/POST /api/user/achievements` | ✅ |
| 3.18 | Plano de Estudos (streak live + timer 25/45/60min) | `GET/POST /api/plano/*` | ✅ |
| 3.19 | Elegibilidade | cálculo local por perfil | ✅ |
| 3.20 | Comparador de Bolsas (busca real) | `GET /api/bolsas` | ✅ |
| 3.21 | Calculadora Custo Real | local | ✅ |
| 3.22 | Renovação de Bolsa | `GET/POST /api/applications/:id/renewals` | ✅ |
| 3.23 | Mapa de Universidades | `GET /api/universidades` | ✅ |
| 3.24 | Candidatar-se (BolsaDetalhe → Confirmar) | `POST /api/applications` | ✅ |

---

## Fase 4 — Melhorias e Polish ✅

| # | Item | Status |
|---|------|--------|
| 4.1 | Conectar botão "Candidatar-se" ao `POST /api/applications` | ✅ |
| 4.2 | Mapa de Universidades com dados reais do DB | ✅ |
| 4.3 | Push notifications via Supabase Realtime (novas bolsas) | ✅ |
| 4.4 | Upload real de documentos (Supabase Storage) | ✅ |
| 4.5 | Chat IA contextual por perfil (`/api/chat`) | ✅ |
| 4.6 | Plano de estudos avançado — timer 25/45/60min | ✅ |
| 4.7 | Comparador de Bolsas — busca por curso/uni real do DB | ✅ |
| 4.8 | Renovação — POST para submeter dados do semestre | ✅ |
| 4.9 | Onboarding — salvar cidade/estado/cotas no banco ao concluir | ✅ |
| 4.10 | Comunidade — POST de posts/respostas, likes reais | ✅ |

---

## Fase 5 — Segurança, UX e Produção

| # | Item | Prioridade | Status |
|---|------|-----------|--------|
| 5.1 | **BolsaDetalhe enriquecido** — usa `selBolsaDetails` do DB (eligibilityReason, vagas, nota corte real) | 🔴 Alta | ✅ |
| 5.2 | **Cancelar candidatura** — `DELETE /api/applications/:id` + botão na tela Acompanhamento | 🔴 Alta | ✅ |
| 5.3 | **Badge de notificações não lidas** no navbar (ponto vermelho dinâmico) | 🟡 Média | ✅ |
| 5.4 | **Histórico de nota de corte** — mini gráfico no BolsaDetalhe (`ncTrend`) | 🟡 Média | ⬜ |
| 5.5 | **Rate limiting** — `express-rate-limit` no backend (200 req/15min global, 10 req/min `/api/chat`) | 🔴 Alta | ✅ |
| 5.6 | **Helmet.js** — headers de segurança HTTP no backend | 🔴 Alta | ✅ |
| 5.7 | **Input sanitization** — rejeitar caracteres maliciosos em campos de texto livre | 🟡 Média | ⬜ |
| 5.8 | **PWA básico** — `manifest.json` + meta theme-color + ícone na homescreen | 🟡 Média | ✅ |
| 5.9 | **Deploy backend** — `render.yaml` configurado para Render.com | 🟢 Baixa | ✅ |
| 5.10 | **Deploy frontend** — `vercel.json` atualizado para servir `portal/index.html` | 🟢 Baixa | ✅ |
| 5.11 | **Simulação de cotas real** — chamar `POST /api/bolsas/cotas/calculate` na tela Cotas | 🟡 Média | ⬜ |
| 5.12 | **Comparador de Cursos** — ligar tela a dados reais do DB | 🟢 Baixa | ⬜ |
| 5.13 | **Deletar alerta de vaga** — botão de remover alerta na tela Alertas | 🟡 Média | ✅ |

---

## Backend `.env` Pendente

O arquivo `backend/.env` tem placeholders que o usuário precisa preencher manualmente:

```
SUPABASE_SERVICE_ROLE_KEY=<pegar em Supabase Dashboard → Settings → API>
JWT_SECRET=<mesmo valor do Supabase Dashboard → Settings → API → JWT Secret>
ANTHROPIC_API_KEY=<pegar em console.anthropic.com>
```

- **Service Role Key + JWT Secret**: https://supabase.com/dashboard/project/cryeesunxnfgkshvafbo/settings/api
- **Anthropic API Key**: https://console.anthropic.com/settings/api-keys

Sem o `SERVICE_ROLE_KEY`, o backend usa a `ANON_KEY` que pode ser bloqueada pelo RLS em algumas operações admin.
Sem o `ANTHROPIC_API_KEY`, o chat usa respostas de fallback estáticas.

---

## Próximos Passos Imediatos

1. **5.4** — Mini gráfico de histórico de nota de corte no BolsaDetalhe
2. **5.7** — Input sanitization nos campos de texto livre
3. **5.11** — Simulação de cotas via API real
4. **5.12** — Comparador de Cursos com dados do DB
