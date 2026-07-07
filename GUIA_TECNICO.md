# Guia Técnico — Portal do Aluno

Documento de referência de engenharia. Complementa o [ROADMAP.md](ROADMAP.md) (plano estratégico) e o [RUNBOOK_PRODUCAO.md](RUNBOOK_PRODUCAO.md) (operação do dia a dia).

---

## 1. Visão Geral da Arquitetura

| Camada | Tecnologia | Hospedagem |
|---|---|---|
| Frontend | HTML/JS estático (45 telas em `portal/`) | Vercel (HTTPS automático) |
| Backend | Node.js + Express (`backend/`) | Railway / Render / AWS |
| Banco | PostgreSQL + RLS | Supabase |
| Auth | Supabase Auth (JWT, refresh 1h) | Supabase |
| Storage | Bucket privado `documents` + signed URLs (10 min) | Supabase Storage |
| Antivírus | ClamAV via TCP `3310` (sidecar) | Container junto do backend |
| IA | Anthropic Claude (`claude-3-5-sonnet-latest`) | API externa |
| E-mail | SendGrid | API externa |
| Push | Firebase Cloud Messaging | API externa |
| Observabilidade | Sentry (backend, opcional), telemetria própria + PostHog (frontend), Slack webhook (5xx) | APIs externas |

Fluxo detalhado: ver diagrama Mermaid no [ROADMAP.md](ROADMAP.md#-1-arquitetura-de-produção-alvo).

## 2. Estrutura do Repositório

```
portal/                     # Frontend estático (deploy Vercel)
  index.html                # SPA com as 45 telas
  app1.js / app2.js         # Lógica auxiliar
  firebase-messaging-sw.js  # Service worker FCM (config via query string)
backend/
  index.js                  # Bootstrap Express: CORS, rate limit, headers, métricas, Sentry
  src/routes/               # 23 routers REST (/api/*)
  src/services/
    integrations.js         # Claude, SendGrid (com anexos), FCM
    moderation.js           # Blacklist da comunidade (extensível via MODERATION_BLACKLIST)
    monitoring.js           # Sentry opcional (SENTRY_DSN)
    storage.js              # Signed URLs (TTL 600s)
    virusScan.js            # ClamAV stream TCP
  test/                     # node --test (auth, legal, smoke, virus scan, moderação, ics)
  scripts/
    check-db.js             # Diagnóstico somente-leitura do banco (tabelas/contagens/buckets)
    fetch-supabase-ca.js    # Extrai e fixa o CA TLS do pooler Supabase (cert pinning)
    apply-delta.js          # Aplica supabase/delta_producao.sql via Postgres (TLS estrito)
supabase/
  schema.sql                # Estrutura relacional + RLS (instalação nova)
  seed.sql                  # Universidades e cursos base
  storage_setup.sql         # Bucket privado documents
  upgrade_producao.sql      # Idempotente: quiz_questions, índices, triggers, push_tokens, NPS por ciclo
  producao_completo.sql     # Arquivo único (schema+seed+storage+upgrade) p/ banco vazio
  delta_producao.sql        # Delta idempotente p/ banco com schema base antigo
.github/workflows/
  deploy.yml                # CI/CD: testes → deploy Vercel + Railway (branch main)
  backup.yml                # pg_dump diário 05:00 UTC, retenção 14 dias
docker-compose.yml          # ClamAV local (porta 3310)
```

## 3. Setup Local

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # se não existir, criar com as variáveis da seção 4
npm run dev            # nodemon na porta 5000

# 2. ClamAV (opcional em dev; upload usa fallback se ausente)
docker compose up -d clamav

# 3. Frontend
# Servir portal/ com qualquer servidor estático, ex.:
npx serve portal
# Configurar no navegador (console):
localStorage.setItem('api-url', 'http://localhost:5000')
localStorage.setItem('supabase-url', 'https://SEU-PROJETO.supabase.co')
localStorage.setItem('supabase-anon-key', 'SUA_ANON_KEY')
```

Ordem de aplicação dos scripts SQL (SQL Editor do Supabase):
1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/storage_setup.sql`
4. `supabase/upgrade_producao.sql` ← **novo, obrigatório** (índices, quiz no banco, triggers de auditoria, push_tokens, NPS por ciclo)

## 4. Variáveis de Ambiente (Backend)

### Núcleo
| Variável | Obrigatória | Descrição |
|---|---|---|
| `PORT` | não (5000) | Porta HTTP |
| `SUPABASE_URL` | sim | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | sim | Chave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | sim (produção) | Chave de serviço (NUNCA no frontend) |
| `JWT_SECRET` | sim | Segredo JWT do Supabase |
| `CORS_ORIGINS` | sim (produção) | Lista separada por vírgula; ex. `https://aluno.seudominio.com.br` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | não (60000/100) | Rate limit por IP+rota |

### Integrações
| Variável | Descrição |
|---|---|
| `CLAMAV_HOST` / `CLAMAV_PORT` | Sidecar ClamAV (porta 3310) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_VERSION` | Mentora IA "Etapa" (Hub E) |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | E-mails transacionais + convites .ics |
| `FIREBASE_SERVER_KEY` (ou `FCM_SERVER_KEY`) | Push notifications (Hub H) |
| `GOOGLE_MAPS_API_KEY` | Mapas |
| `MEC_PROUNI_API_URL`, `INEP_SISU_API_URL`, `FNDE_FIES_API_URL`, `INEP_ENEM_API_URL` | Fontes de dados abertos (Hub B) |

### Compliance e parâmetros de negócio
| Variável | Descrição |
|---|---|
| `DPO_EMAIL`, `CNPJ`, `RAZAO_SOCIAL`, `SUPPORT_EMAIL` | Dados legais LGPD servidos por `/api/config` |
| `SALARIO_MINIMO` (ex. `1412.00`) | Base dos simuladores (Hub C) |
| `FIES_TAXA` (ex. `0.068`) | Taxa efetiva FIES |
| `NPS_CICLO` (padrão `beta-2026`) | Ciclo de avaliação NPS — 1 resposta por usuário por ciclo |
| `MODERATION_BLACKLIST` | Termos extras de moderação, separados por vírgula |

### Observabilidade
| Variável | Descrição |
|---|---|
| `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE` | Sentry backend (opcional) |
| `SLACK_WEBHOOK_URL` | Alertas 5xx em tempo real |
| `POSTHOG_API_KEY`, `POSTHOG_HOST` | Telemetria de produto/erros frontend |

### Frontend (Vercel)
| Variável | Descrição |
|---|---|
| `window.ENV_API_URL` | URL pública do backend |
| `window.ENV_SUPABASE_URL` / `ENV_SUPABASE_ANON_KEY` | Credenciais públicas Supabase |
| `window.ENV_FIREBASE_CONFIG` | Objeto do app web Firebase **incluindo `vapidKey`** — habilita `initPushNotifications()` |

## 5. Segurança

- **Auth:** JWT do Supabase validado em `src/middleware/auth.js` via `supabase.auth.getUser(token)`; expiração 1h com auto-refresh no frontend (`autoRefreshToken: true`).
- **RLS:** todas as tabelas com Row Level Security; usuário só lê/escreve as próprias linhas; catálogos (bolsas, universidades, eventos) são públicos somente-leitura.
- **Uploads:** `POST /api/applications/:id/documents` → scan ClamAV via TCP **antes** do envio ao bucket privado; download só por signed URL de 10 minutos.
- **Headers:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; em produção HSTS + CSP.
- **Rate limit:** por IP+rota (padrão 100 req/min).
- **IA:** entrada sanitizada (caracteres de controle, pseudo-tags, 2000 chars) e histórico limitado a 10 mensagens por chamada (custo + injeção de prompt).
- **Comunidade:** moderador automático por blacklist (`src/services/moderation.js`), normaliza acentos/leetspeak; retorna `422` para conteúdo bloqueado.
- **Auditoria:** triggers PostgreSQL (`upgrade_producao.sql`) gravam em `activity_log` a criação de candidaturas, envio de documentos e NPS; backend grava logs adicionais em `audit_logs`.
- **LGPD:** banner de consentimento de cookies no frontend (`lgpd-cookie-consent` no localStorage); consentimentos por usuário em `user_profiles.consents`; dados legais reais via `/api/config`; processo de incidentes em [SECURITY_INCIDENT_RESPONSE.md](SECURITY_INCIDENT_RESPONSE.md).

## 6. Superfície de API (resumo)

Prefixo `/api`. Autenticação Bearer JWT salvo indicado.

| Grupo | Rotas-chave |
|---|---|
| Saúde/Métricas | `GET /health`, `GET /metrics` (p50/p95/p99, erros por rota) — públicos |
| Usuário | `/user/*` perfil, consents, exportação/exclusão de dados |
| Bolsas | `GET /bolsas` (filtros estado/turno/%), `GET /universities` |
| Candidaturas | `/applications` CRUD, `POST /applications/:id/documents` (upload+scan), `GET .../download` (signed URL) |
| Simuladores | `/comparator`, `/deadlines`, parâmetros via `/config` |
| IA | `GET/POST/DELETE /ai/chat*` |
| Preparatório | `GET /quiz/questions` (tabela `quiz_questions`), `POST /quiz/submit` (grava `quiz_sessions`), `/vocational`, `/renewal` |
| Comunidade | `/community/posts|stories|questions` (+moderação), likes, comments |
| Eventos | `/events`, `POST /events/:id/register` (e-mail + .ics) |
| Alertas/Push | `/alerts` CRUD, `POST /alerts/sync`, `POST /notifications/push-token` |
| Gamificação | `/achievements`, `/activity` |
| NPS | `POST /nps` (409 se repetido no ciclo), `GET /nps/summary` |
| Telemetria | `POST /telemetry/event|error`, `GET /telemetry/summary` |
| Integrações | `GET /integrations/status`, `POST /integrations/sync/:source` |

## 7. Testes e Qualidade

```bash
cd backend
npm test                # node --test (auth, config legal, smoke, virus scan)
npm run audit:critical  # npm audit nível crítico
npm run smoke:rollback  # validação pós-rollback
```

CI (`.github/workflows/deploy.yml`): roda em todo push/PR para `main` — valida estrutura do frontend, `node --check`, testes, audit; deploy para Vercel + Railway só quando tudo passa na `main`.

## 8. Decisões de Arquitetura Relevantes

- **Fallback resiliente:** rotas que dependem do Supabase degradam para dados em memória quando o banco não está configurado (dev local sem credenciais). Em produção, com envs preenchidas, os dados reais prevalecem.
- **Questões do simulado no banco:** `quiz_questions` permite inserir questões via SQL/painel sem redeploy; o array estático permanece apenas como fallback de dev.
- **Push multi-dispositivo:** tokens FCM em `push_tokens` (1 usuário → N dispositivos); `syncAlerts` envia para todos.
- **Sentry opcional:** só inicializa com `SENTRY_DSN`; sem a env não há custo nem dependência ativa.
- **MEC/INEP sem API pública:** ingestão via URLs configuráveis (`/api/integrations/sync/:source`) que aceitam os arquivos de dados abertos publicados por semestre — acionável manualmente ou por cron externo.
