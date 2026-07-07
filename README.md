# Portal do Aluno

Plataforma que conecta estudantes a bolsas de estudo (ProUni, SISU, FIES): busca de vagas, simuladores, candidatura com upload seguro de documentos, mentoria com IA, comunidade, eventos e alertas push.

## Documentação

| Documento | Conteúdo |
|---|---|
| [ROADMAP.md](ROADMAP.md) | Plano estratégico de produção (10 hubs de funcionalidades, 5 fases) |
| [GUIA_TECNICO.md](GUIA_TECNICO.md) | Arquitetura, setup local, variáveis de ambiente, API, segurança |
| [RUNBOOK_PRODUCAO.md](RUNBOOK_PRODUCAO.md) | Provisionamento, deploy, rollback, monitoramento, go-live |
| [SECURITY_INCIDENT_RESPONSE.md](SECURITY_INCIDENT_RESPONSE.md) | Resposta a incidentes (LGPD, janela de 72h) |
| [BETA_ROTEIRO_TESTE.md](BETA_ROTEIRO_TESTE.md) | Roteiro do ciclo beta com 10 usuários reais |

## Início rápido

```bash
cd backend && npm install && npm run dev   # API na porta 5000
npx serve portal                           # Frontend estático
docker compose up -d clamav                # Antivírus (opcional em dev)
```

Scripts SQL (Supabase, nesta ordem): `schema.sql` → `seed.sql` → `storage_setup.sql` → `upgrade_producao.sql`.
