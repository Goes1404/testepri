# Runbook de Produção — Portal do Aluno

Procedimentos operacionais para colocar e manter o portal em produção. Público-alvo: engenharia/operações. Referências: [GUIA_TECNICO.md](GUIA_TECNICO.md), [ROADMAP.md](ROADMAP.md), [SECURITY_INCIDENT_RESPONSE.md](SECURITY_INCIDENT_RESPONSE.md), [BETA_ROTEIRO_TESTE.md](BETA_ROTEIRO_TESTE.md).

---

## 1. Provisionamento Inicial (Go-Live do zero)

### 1.1 Supabase (≈ meio dia)
1. Criar projeto de produção em https://supabase.com/dashboard (região `sa-east-1`).
2. SQL Editor → executar **nesta ordem**: `supabase/schema.sql` → `supabase/seed.sql` → `supabase/storage_setup.sql` → `supabase/upgrade_producao.sql`.
3. Auth → Providers → Email: **habilitar "Confirm email"**.
4. Auth → URL Configuration: Site URL e Redirect URLs = `https://aluno.SEUDOMINIO.com.br`.
5. Anotar: `SUPABASE_URL`, `anon key`, `service_role key`, `JWT secret`, connection string (para backup).

### 1.2 Backend (Railway/Render) (≈ meio dia)
1. Criar serviço a partir do repositório, diretório `backend/`, comando `npm start`.
2. Adicionar serviço sidecar ClamAV: imagem `clamav/clamav:stable`, porta interna `3310` (sem exposição pública).
3. Preencher **todas** as variáveis da seção 4 do GUIA_TECNICO (núcleo + integrações + compliance + observabilidade). Mínimo para subir: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `CORS_ORIGINS`, `CLAMAV_HOST`, `CLAMAV_PORT`.
4. Validar: `curl https://API/api/health` → `{"status":"ok"}` e `curl https://API/api/integrations/status` → conferir cada integração `true`.

### 1.3 Frontend (Vercel) (≈ 2 horas)
1. Importar repositório na Vercel; `vercel.json` da raiz já roteia `portal/` como estático.
2. Definir domínio `aluno.SEUDOMINIO.com.br`; aguardar SSL automático.
3. Injetar envs públicas (`ENV_API_URL`, `ENV_SUPABASE_URL`, `ENV_SUPABASE_ANON_KEY`, `ENV_FIREBASE_CONFIG` com `vapidKey`).
4. Registrar o domínio final no Supabase Auth (passo 1.1.4).

### 1.4 CI/CD e Backups
1. GitHub → Settings → Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN`, `SUPABASE_DB_URL`.
2. Push na `main` → `deploy.yml` roda testes e faz deploy dos dois lados.
3. `backup.yml` gera dump diário às 05:00 UTC (retenção 14 dias). Conferir primeiro artefato no dia seguinte.

### 1.5 Checklist de validação pós-provisionamento
- [ ] Cadastro + e-mail de confirmação chegando e redirecionando ao domínio correto.
- [ ] Login → sessão persiste após 1h (refresh silencioso).
- [ ] Upload de arquivo EICAR (`X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*`) → **rejeitado** com erro de vírus.
- [ ] Upload de PDF legítimo → aceito; download só via signed URL; URL expira em 10 min.
- [ ] Chat da mentora responde com IA (não fallback) — exige `ANTHROPIC_API_KEY`.
- [ ] Inscrição em evento → e-mail com anexo `.ics` chega.
- [ ] Post na comunidade com palavrão → `422`.
- [ ] `POST /api/nps` duas vezes → segunda retorna `409`.
- [ ] Banner de cookies aparece na primeira visita e não reaparece após escolha.
- [ ] `GET /api/metrics` respondendo; erro 5xx forçado aparece no Slack/Sentry.

## 2. Deploy de Rotina

1. Merge na `main` (via PR com CI verde).
2. Pipeline faz deploy automático. Acompanhar em GitHub Actions.
3. Pós-deploy: `curl /api/health` e `curl /api/metrics` (errorRate < 1%).
4. Smoke manual de 2 min: login, listagem de bolsas, chat IA.

## 3. Rollback

**Backend (Railway):** painel → Deployments → "Redeploy" na versão anterior. Depois `npm run smoke:rollback` localmente apontando para produção ou conferir `/api/health`.

**Frontend (Vercel):** painel → Deployments → "Promote to Production" no deploy anterior (instantâneo).

**Banco:** restaurar dump do artefato do `backup.yml`:
```bash
pg_restore --clean --no-owner -d "$SUPABASE_DB_URL" portal-YYYYMMDD-HHMMSS.dump
```
⚠️ Restauração é destrutiva — seguir antes o processo de aprovação de incidente (S1/S2).

## 4. Monitoramento e Alertas

| Sinal | Onde | Limiar de ação |
|---|---|---|
| `errorRate` | `GET /api/metrics` | > 2% em 15 min → investigar |
| Latência p95 | `GET /api/metrics` | > 800ms sustentado → investigar índices/N+1 |
| 5xx em tempo real | Slack (`SLACK_WEBHOOK_URL`) | Qualquer pico → triagem |
| Exceções backend | Sentry (se `SENTRY_DSN`) | Novo issue → triagem em 24h |
| Erros frontend | `GET /api/telemetry/summary` + PostHog | Crescimento anômalo → triagem |
| Backup diário | GitHub Actions artifacts | Falha → corrigir no mesmo dia |
| ClamAV | healthcheck do container | Unhealthy → reiniciar sidecar (uploads ficam bloqueados, não inseguros) |

## 5. Tarefas Recorrentes

| Frequência | Tarefa |
|---|---|
| Diária | Conferir Slack/Sentry; conferir sucesso do backup |
| Semanal | `npm run audit:critical`; revisar `GET /api/telemetry/summary`; revisar posts bloqueados pela moderação (falsos positivos) |
| Por semestre | Ingerir dados abertos MEC/INEP: `POST /api/integrations/sync/:source` para cada fonte configurada; atualizar `SALARIO_MINIMO`/`FIES_TAXA`; abrir novo ciclo NPS (`NPS_CICLO`) |
| Contínua | `syncAlerts` roda a cada 5 min no backend (automático) — conferir logs se alertas pararem de chegar |

## 6. Incidentes de Segurança

Seguir [SECURITY_INCIDENT_RESPONSE.md](SECURITY_INCIDENT_RESPONSE.md) (janela LGPD de 72h). Ações imediatas de contenção comuns:
- Rotacionar `SUPABASE_SERVICE_ROLE_KEY` e `JWT_SECRET` (Supabase → Settings → API).
- Revogar sessões: Supabase Auth → Users → sign out em massa.
- Suspender uploads: derrubar o backend ou remover env `SUPABASE_SERVICE_ROLE_KEY` (fail-safe).

## 7. Ciclo Beta e Go-Live (Fase 5 do Roadmap)

1. Ambiente de staging = réplica das seções 1.1–1.3 com subdomínio próprio.
2. Executar [BETA_ROTEIRO_TESTE.md](BETA_ROTEIRO_TESTE.md) com 10 usuários reais.
3. Acompanhar `GET /api/nps/summary` — critério de liberação: **NPS ≥ 7 (média) e 0 falhas críticas abertas**.
4. Go-Live: apontar DNS definitivo, rodar checklist 1.5 completo em produção, anunciar.

## 8. Contatos e Ownership

| Papel | Onde configurar |
|---|---|
| Suporte | `SUPPORT_EMAIL` |
| DPO / responsável legal | `DPO_EMAIL` |
| Operações | Canal do `SLACK_WEBHOOK_URL` |
| Entidade jurídica | `CNPJ` / `RAZAO_SOCIAL` (exibidos em `/api/config`) |
