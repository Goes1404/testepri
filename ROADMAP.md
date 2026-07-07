# Portal do Aluno — Roteiro de Produção da Experiência do Estudante

Este documento é o plano de ação técnico e estratégico definitivo para colocar o **Portal do Aluno** em produção. Ele detalha como fazer a ponte entre as **45 telas funcionais do frontend** (HTML/JS) e um **sistema de backend resiliente, seguro, automatizado e em conformidade regulatória**.

O objetivo final deste roteiro é que, ao término de sua execução, qualquer estudante tenha uma experiência **completa, integrada e fluida**, sem simulações ou mocks.

---

## 🏗️ 1. Arquitetura de Produção Alvo

Abaixo está o fluxo real de dados e conexões que substituirá os simuladores locais:

```mermaid
graph TD
    %% Frontend Layer
    A["Frontend (Vercel + HTTPS)<br/>45 Telas Estáticas"] -->|1. Auth / Tokens / Refresh| B["Supabase Auth / Dashboard"]
    A -->|2. Chamadas de API (REST)| C["Backend Express (Railway / Render)"]
    
    %% Backend Integrations
    C -->|3. Escaneamento TCP| D["ClamAV Scanner (Sidecar Container)"]
    C -->|4. Upload & Signed URLs| E["Supabase Storage (documents bucket)"]
    C -->|5. Consultas & Persistência| F["Supabase DB (PostgreSQL + RLS)"]
    
    %% External API Services
    C -->|6. Mentoria Contextual| G["Anthropic Claude API"]
    C -->|7. E-mails Transacionais| H["SendGrid API / SMTP"]
    C -->|8. Notificações Instantâneas| I["Firebase Cloud Messaging (FCM)"]
    C -->|9. Sincronização Governamental| J["Portal de Dados Abertos / MEC (ProUni, SISU, FIES, ENEM)"]
```

---

## 👥 2. Jornada e Experiência do Aluno (Ponta a Ponta)

Para garantir que o aluno tenha todas as funcionalidades operando em nível de produção, o sistema está segmentado em **10 Hubs de Funcionalidades**. Cada hub correlaciona as telas do frontend, as tabelas do banco de dados e os passos necessários para a produção real:

### 🔐 Hub A: Cadastro, Login e Onboarding (Telas: 1, 8, 12, 45)
* **Experiência do Aluno:** O aluno se cadastra, preenche seus dados demográficos (cidade, estado, escola pública/privada, renda familiar, nota estimada do ENEM), aceita os termos legais e faz login seguro.
* **Tabelas do Banco de Dados:** `auth.users` (gerenciado pelo Supabase Auth) e `public.user_profiles` (dados socioeconômicos e notas).
* **Configuração de Produção:**
  - **Supabase Auth Dashboard:** Habilitar confirmação obrigatória de e-mail (para evitar contas falsas).
  - **Links de Redirecionamento (Redirect URLs):** Configurar `https://aluno.seudominio.com.br` como URL permitida para que e-mails de confirmação e recuperação de senha redirecionem corretamente o aluno.
  - **Auto-Refresh de Sessão:** Validar no frontend a persistência da sessão e o refresh automático do token a cada 1 hora.

---

### 🔍 Hub B: Exploração de Vagas e Bolsas (Telas: 2, 3, 4, 11, 21)
* **Experiência do Aluno:** O aluno busca cursos e faculdades com filtros avançados por estado, turno e porcentagem da bolsa, verifica prazos de inscrição e analisa o detalhamento de cada vaga.
* **Tabelas do Banco de Dados:** `public.scholarships` (vagas de bolsas) e `public.universities` (dados cadastrais das instituições parceiras).
* **Configuração de Produção:**
  - **Índices de Busca:** Criar índices do PostgreSQL (`B-Tree` para filtros exatos e `GIN` para buscas textuais no nome dos cursos e faculdades) para garantir respostas em menos de 100ms.
  - **Integração MEC/INEP/FIES:** Sincronizar periodicamente as bolsas ativas. Como o MEC não fornece APIs públicas abertas sem convênio formal, estruturar um worker no backend que faça a ingestão automática das planilhas de dados abertos divulgadas pelo governo federal (arquivos CSV/JSON) a cada início de semestre letivo.

---

### 📊 Hub C: Simuladores de Notas e Custos (Telas: 9, 16, 17, 18, 19, 20)
* **Experiência do Aluno:** O aluno insere sua nota do ENEM e simula se passaria em edições passadas do ProUni/SISU, compara custos reais de mensalidades, simula financiamentos FIES e compara dois cursos lado a lado.
* **Tabelas do Banco de Dados:** `public.scholarships` (histórico de notas de corte) e parâmetros em variáveis de ambiente do backend.
* **Configuração de Produção:**
  - **Parâmetros Financeiros Reais:** Substituir as taxas e dados fixados no código pelas variáveis de ambiente de produção (ex: `SALARIO_MINIMO` real vigente de R$ 1.412,00 ou superior, e `FIES_TAXA` oficial baseada na taxa efetiva de juros).
  - **Comparador:** Otimizar o endpoint `/api/comparator` no backend para retornar dados agregados de empregabilidade e salários médios de mercado obtidos de bases de dados abertas de emprego (como o CAGED).

---

### 📄 Hub D: Candidatura e Preparação de Documentos (Telas: 5, 6, 10, 38, 39, 40, 41)
* **Experiência do Aluno:** O aluno inicia uma candidatura, realiza o upload de documentos de identificação e comprovantes de renda. O Portal detecta a necessidade de declarações adicionais (autônomos, desempregados) e gera declarações em PDF de próprio punho com assinatura eletrônica integrada. O aluno acompanha um checklist de pós-aprovação.
* **Tabelas do Banco de Dados:** `public.applications` (candidaturas) e `public.documents` (metadados e caminhos dos arquivos).
* **Configuração de Produção:**
  - **Supabase Storage Privado:** Executar o script [storage_setup.sql](file:///c:/Users/User/Nova%20pasta/testepri/supabase/storage_setup.sql) para instanciar a pasta `documents` privada.
  - **Scan de Vírus Real (ClamAV):** Colocar o container `portal-clamav` ativo em ambiente de produção (Railway/Render/AWS) para escaneamento de arquivos em stream TCP na porta `3310`. Arquivos infectados devem ser rejeitados imediatamente no endpoint `POST /api/applications/:id/documents` antes de serem enviados ao Supabase Storage.
  - **URLs Assinadas Temporárias (Signed URLs):** O aluno só poderá baixar ou visualizar seus comprovantes via token assinado de uso único gerado pelo endpoint `GET /api/applications/:id/documents/:documentId/download` com validade máxima de 10 minutos.

---

### 💬 Hub E: Mentoria de Carreira com IA (Tela: 23)
* **Experiência do Aluno:** O aluno conversa com a mentora virtual "Etapa", tirando dúvidas contextuais sobre ProUni, documentação e caminhos profissionais. A IA responde de forma personalizada com base no perfil acadêmico do aluno.
* **Tabelas do Banco de Dados:** `public.user_profiles` (contextualização da IA) e persistência de histórico de chat na sessão ou tabela dedicada do banco.
* **Configuração de Produção:**
  - **Chave Anthropic Claude:** Habilitar as variáveis de ambiente `ANTHROPIC_API_KEY`, `ANTHROPIC_VERSION` e `ANTHROPIC_MODEL` (usando `claude-3-5-sonnet-latest`) no backend para que a mentora responda com inteligência artificial avançada.
  - **Mitigação de Custos e Ataques:** Limitar o histórico de mensagens enviado na API a no máximo 10 mensagens anteriores e sanitizar as entradas do usuário no backend contra injeções de prompt e tokens abusivos.

---

### 📝 Hub F: Preparatório Acadêmico e Vocacional (Telas: 24, 25, 26, 27, 37, 44)
* **Experiência do Aluno:** O aluno faz um Teste Vocacional, recebe um Relatório de Habilidades, resolve simulados do ENEM (Mini-Vestibular) com correção imediata e explicações, e recebe um cronograma de estudos diário dinâmico.
* **Tabelas do Banco de Dados:** `public.quiz_questions` (questões dos simulados), `public.user_quiz_responses` (respostas e notas dos alunos) e `public.study_plans` (cronogramas de estudo).
* **Configuração de Produção:**
  - **Questões no Banco:** Migrar o array estático de questões `QUESTIONS_ENEM` (atualmente fixado em [quiz.js](file:///c:/Users/User/Nova%20pasta/testepri/backend/src/routes/quiz.js#L6-L67)) para uma tabela relacional de banco de dados, possibilitando a inserção contínua de novas questões de forma administrativa sem necessidade de redeploy da aplicação.
  - **Planos Dinâmicos:** Integrar o gerador de cronograma com links reais de videoaulas abertas no YouTube e materiais de estudo hospedados de forma otimizada em servidores de arquivos.

---

### 👥 Hub G: Fórum, Comunidade e Eventos (Telas: 28, 29, 30, 31, 32, 33, 42)
* **Experiência do Aluno:** O aluno lê depoimentos inspiradores de outros bolsistas, tira dúvidas em fóruns da comunidade, inscreve-se em palestras ou webinars e lê artigos explicativos sobre o universo universitário.
* **Tabelas do Banco de Dados:** `public.community_posts` (tópicos de discussão), `public.event_registrations` (inscrições em eventos) e `public.articles` (hub de conteúdo).
* **Configuração de Produção:**
  - **Filtro de Conteúdo Impróprio:** Implementar moderador automático básico no backend (blacklist de palavras proibidas) nas publicações da comunidade para evitar abusos entre os alunos.
  - **Confirmação e Lembretes:** Ao se inscrever em um evento, o backend deve disparar um e-mail transacional de confirmação com link do arquivo `.ics` para o estudante salvar o evento em seu calendário pessoal (Google Calendar/Outlook).

---

### 🔔 Hub H: Notificações Push e Alertas de Vagas (Telas: 13, 14, 43)
* **Experiência do Aluno:** O aluno define preferências de alerta (ex: "vagas de Medicina na cidade de São Paulo"). Sempre que uma vaga compatível surgir ou quando o status de sua candidatura for alterado, o aluno recebe um alerta push no dispositivo e uma notificação no painel interno.
* **Tabelas do Banco de Dados:** `public.vagas_alerts` (configurações de alertas do usuário) e `public.notifications` (mensagens in-app).
* **Configuração de Produção:**
  - **Firebase Cloud Messaging (FCM):** Cadastrar o projeto e habilitar `FCM_SERVER_KEY` no backend. Integrar o Service Worker do Firebase no navegador do estudante para registrar permissões de notificações push em celulares e desktops.
  - **Sincronização de Alertas em Background:** A função `syncAlerts` (ativada na inicialização do servidor em [index.js](file:///c:/Users/User/Nova%20pasta/testepri/backend/index.js#L209-L211)) deve varrer novas bolsas adicionadas à base do ProUni/MEC e disparar pushes para todos os estudantes que configuraram alertas equivalentes.

---

### 🏆 Hub I: Histórico e Conquistas Gamificadas (Telas: 34, 35)
* **Experiência do Aluno:** O aluno desbloqueia insígnias e conquistas à medida que avança na plataforma (ex: "Documentador" ao enviar todos os documentos sem vírus; "Estudioso" ao completar 5 simulados). Ele visualiza um histórico completo de suas ações de preparação.
* **Tabelas do Banco de Dados:** `public.user_achievements` (tabela de conquistas desbloqueadas) e `public.activity_logs` (logs de auditoria).
* **Configuração de Produção:**
  - **Auditoria Segura:** Triggers em PostgreSQL devem gravar logs de atividade no esquema `activity_logs` (ações críticas como: login, início de candidatura, envio de documentos) para conformidade regulatória e detecção de fraudes.

---

### 📈 Hub J: Feedback e NPS (Pesquisa de Satisfação)
* **Experiência do Aluno:** Ao concluir uma candidatura ou ao finalizar o teste beta da plataforma, uma janela flutuante exibe a pesquisa de satisfação oficial perguntando "De 0 a 10, o quanto você recomendaria o Portal do Aluno?".
* **Tabelas do Banco de Dados:** `public.nps_responses` (notas e comentários dos estudantes).
* **Configuração de Produção:**
  - **Prevenção de Spam de NPS:** Configurar RLS e chaves primárias exclusivas no Supabase para garantir que cada usuário autenticado possa submeter apenas um registro de feedback por ciclo de avaliação.

---

## 🛠️ 3. Roteiro Passo a Passo de Execução Técnica

Abaixo estão as fases técnicas necessárias para os engenheiros ativarem toda a arquitetura acima:

### Fase 1: Infraestrutura e Banco de Dados (Supabase)
> **Prazo Estimado:** 3 dias | **Status:** Pronto para execução
1. Criar projeto de produção no console oficial do Supabase.
2. Copiar as credenciais e o JWT secret para os arquivos de configuração do backend.
3. Executar o script SQL [schema.sql](file:///c:/Users/User/Nova%20pasta/testepri/supabase/schema.sql) para criar a estrutura relacional do sistema.
4. Executar [seed.sql](file:///c:/Users/User/Nova%20pasta/testepri/supabase/seed.sql) para importar universidades e cursos base.
5. Executar [storage_setup.sql](file:///c:/Users/User/Nova%20pasta/testepri/supabase/storage_setup.sql) para criar e blindar o bucket privado de uploads.
6. Executar [upgrade_producao.sql](file:///c:/Users/User/Nova%20pasta/testepri/supabase/upgrade_producao.sql) (idempotente): questões do simulado no banco, índices B-Tree/GIN, triggers de auditoria, tabela de tokens push e NPS único por ciclo.
7. Habilitar Row Level Security (RLS) nas configurações globais do banco Supabase.

### Fase 2: Deploy e Hardening do Backend Node.js
> **Prazo Estimado:** 3 dias | **Status:** Configurações de código prontas
1. Criar app de backend na nuvem (Railway/Render/AWS).
2. Adicionar o container do **ClamAV** como serviço adjacente (sidecar) configurado para responder na porta TCP `3310`.
3. Preencher todas as variáveis de ambiente sensíveis no painel de segredos do host de deploy:
   - `PORT`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`.
   - `CLAMAV_HOST` (apontando para o container sidecar ClamAV) e `CLAMAV_PORT=3310`.
   - `DPO_EMAIL`, `CNPJ` e `RAZAO_SOCIAL` (dados reais da entidade jurídica).
   - `SALARIO_MINIMO=1412.00` e `FIES_TAXA=0.068` (parâmetros financeiros reais).
   - `ANTHROPIC_API_KEY`, `SENDGRID_API_KEY`, `FIREBASE_SERVER_KEY` e `GOOGLE_MAPS_API_KEY` (credenciais das integrações de produção).
4. Configurar as regras de CORS no backend para aceitar conexões apenas a partir do domínio HTTPS final de frontend.

### Fase 3: Deploy e Otimização do Frontend
> **Prazo Estimado:** 2 dias | **Status:** Pronto para deploy
1. Criar projeto no console da **Vercel** conectado ao repositório do projeto.
2. Configurar o diretório de saída como `portal/` e as variáveis de ambiente necessárias (como a URL do backend na variável `BACKEND_URL`).
3. Registrar o domínio customizado de produção (ex: `https://aluno.meuportal.com.br`) na Vercel e validar a emissão automática do certificado SSL (HTTPS).
4. No console do Supabase Auth, registrar este domínio final de produção como a URL oficial de redirecionamento de emails de confirmação e senha.

### Fase 4: Automação CI/CD e Observabilidade
> **Prazo Estimado:** 2 dias | **Status:** Planejado
1. Criar o arquivo `.github/workflows/production.yml` para automatizar testes e deploys:
   - Executar `npm run lint` e `npm test` no backend.
   - Disparar build automático na Vercel e re-deploy no Railway/Render apenas quando todos os testes passarem na branch `main`.
2. Integrar biblioteca de observabilidade (ex: Sentry) no backend e no frontend para capturar falhas em tempo real de usuários em produção.

### Fase 5: Ciclo Beta com 10 Usuários Reais e Liberação
> **Prazo Estimado:** 5 dias | **Status:** Roteiro de testes pronto
1. Recrutar 10 usuários conforme perfis socioeconômicos reais especificados no [BETA_ROTEIRO_TESTE.md](file:///c:/Users/User/Nova%20pasta/testepri/BETA_ROTEIRO_TESTE.md).
2. Rodar o fluxo completo de testes em ambiente de staging idêntico ao de produção.
3. Tratar quaisquer bugs reportados na planilha de acompanhamento.
4. Consultar no endpoint `/api/nps/summary` se a pontuação agregada de NPS atingiu o **critério mínimo de NPS >= 7**.
5. Efetuar a liberação pública oficial (Go-Live).

---

## 🏁 Critério de Pronto de Produção (Definição de Pronto)

O Portal do Aluno é considerado **100% Pronto para Produção** quando atender cumulativamente aos seguintes requisitos:
- [ ] **Documentos 100% Protegidos:** Upload privado via Supabase Storage ativo, com link assinado válido por no máximo 10 minutos para download.
- [ ] **Antivírus Operando:** ClamAV validado localizando arquivos corrompidos/infectados (rejeitando assinaturas EICAR na API) antes da gravação em disco.
- [ ] **Sessão Segura:** JWT configurado com expiração de 1 hora e refresh automático funcionando de forma invisível para o aluno no frontend.
- [ ] **Dados de Produção Conectados:** Substituição completa dos arquivos mock por APIs integradas com MEC/INEP/FIES, Inteligência Artificial Claude da Anthropic, notificações push via Firebase e e-mails transacionais reais via SendGrid.
- [ ] **Compliance LGPD Ativo:** CNPJ, DPO e termos de uso reais publicados na API e exibidos adequadamente nas páginas de política de privacidade, com banner de consentimento de cookies habilitado.
- [ ] **Qualidade Validada:** Roteiro beta executado com 10 usuários reais, obtendo índice NPS >= 7 e 0 falhas críticas ativas.
