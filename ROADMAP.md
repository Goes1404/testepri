# Portal do Aluno — Roadmap

> Repositório: `goes1404/testepri` · Branch ativa: `claude/repo-setup-dev-server-r3mk1b`
> Supabase project: `cryeesunxnfgkshvafbo`
> Última atualização: 2026-07-01

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

---

## Fase 3 — Frontend Wiring ✅/🔄

| # | Tela | Wiring | Status |
|---|------|--------|--------|
| 3.1 | Dashboard (Home) | `GET /api/home/dashboard` | ✅ |
| 3.2 | Bolsas (listagem + filtros) | `GET /api/bolsas` | ✅ |
| 3.3 | Detalhe da Bolsa | state local | ✅ |
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
| 3.18 | Plano de Estudos (streak live) | `GET/POST /api/plano/*` | ✅ |
| 3.19 | Elegibilidade | cálculo local por perfil | ✅ |
| 3.20 | Comparador de Bolsas | local | ✅ |
| 3.21 | Calculadora Custo Real | local | ✅ |
| 3.22 | Renovação de Bolsa | `GET /api/applications/:id/renewals` | ✅ |
| 3.23 | Mapa de Universidades | ⬜ |
| 3.24 | Candidatar-se (botão em BolsaDetalhe) | `POST /api/applications` | ⬜ |

---

## Fase 4 — Melhorias e Polish ⬜

| # | Item | Prioridade |
|---|------|-----------|
| 4.1 | **Conectar botão "Candidatar-se"** em BolsaDetalhe ao `POST /api/applications` | 🔴 Alta |
| 4.2 | **Mapa de Universidades** (tela 36) com dados reais do DB | 🟡 Média |
| 4.3 | **Push notifications** via Supabase Realtime para novas bolsas | 🟡 Média |
| 4.4 | **Upload real de documentos** (Supabase Storage) | ✅ |
| 4.5 | **Chat IA** (`/api/chat`) — resposta contextual por perfil | 🟡 Média |
| 4.6 | **Plano de estudos avançado** — sessões de 25/45/60min, histórico de minutos | 🟢 Baixa |
| 4.7 | **Comparador de Bolsas** — busca por curso/uni real do DB | 🟢 Baixa |
| 4.8 | **Renovação** — POST para submeter dados do semestre | ✅ |
| 4.9 | **Onboarding** — salvar `obStep` e perfil no banco ao concluir | 🟢 Baixa |
| 4.10 | **Comunidade** — POST de posts/respostas, likes reais | ✅ |

---

## Backend `.env` Pendente

O arquivo `backend/.env` tem placeholders que o usuário precisa preencher manualmente:

```
SUPABASE_SERVICE_ROLE_KEY=<pegar em Supabase Dashboard → Settings → API>
JWT_SECRET=<mesmo valor do Supabase Dashboard → Settings → API → JWT Secret>
```

Sem o `SERVICE_ROLE_KEY`, o backend usa a `ANON_KEY` que pode ser bloqueada pelo RLS em algumas operações admin.

---

## Pendência do Usuário

Para o backend funcionar em produção, preencher no `backend/.env`:
- **Service Role Key**: https://supabase.com/dashboard/project/cryeesunxnfgkshvafbo/settings/api
- **JWT Secret**: mesmo link acima, seção "JWT Settings"

## Próximos Passos Imediatos

1. **4.2** — Mapa de Universidades com pins reais (dados do DB)
2. **4.5** — Chat IA contextual com perfil do usuário (ANTHROPIC_API_KEY no backend)
3. **4.9** — Onboarding: salvar perfil completo no banco ao concluir
