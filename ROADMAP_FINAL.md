# Roadmap Final - Itens Restantes

> Status em 2026-07-06: todas as 45 telas estao funcionais. Este roadmap cobre apenas os itens finais que dependem de infraestrutura real, configuracao externa, compliance ou validacao com usuarios.

## Resumo

- Telas do produto: 45/45 concluidas
- Roadmap completo atual: 297/304 tarefas concluidas
- Restante estimado: 7 tarefas
- Percentual restante: 2,3%
- Atualizacao 2026-07-07: codigo de suporte para os itens 1, 2, 3, 4, 5 e 7 ja implementado (upload real + signed URL, scan de virus, docker-compose do ClamAV validado com EICAR real, renovacao de sessao no frontend, teste de token expirado no backend, campos DPO/CNPJ no endpoint legal, tabela/rota de NPS, roteiro de teste do beta). Os itens que dependem de acesso externo seguem bloqueados no "criterio de pronto" ate alguem com acesso ao painel Supabase, decisao juridica ou usuarios reais executar o passo que falta — ver "Tarefas restantes" em cada item.
- Nao fabricamos CNPJ/DPO nem resultados de beta/NPS: sao dados juridicos e humanos reais, preencher fake quebraria compliance e mascararia a validacao. So a infraestrutura de codigo foi adiantada.

---

## Fase Final 1 - Infraestrutura Sensivel

### 1. Supabase Storage para comprovantes de renda

**Status: codigo pronto, falta aplicar no ambiente real.**

**Objetivo:** substituir URLs/mock storage por upload real em bucket privado.

**Feito:**
- `backend/src/services/storage.js` faz upload real (`supabase.storage.from('documents').upload`) e gera signed URL (10min).
- `POST /api/applications/:id/documents` agora recebe `file_base64` (ate 10MB), grava no bucket privado, salva o path (nao mais URL fake) em `documents.file_url`.
- `GET /api/applications/:id/documents/:documentId/download` gera signed URL sob demanda, validando ownership da candidatura.
- `supabase/storage_setup.sql` cria o bucket `documents` (privado) e as RLS policies de `storage.objects` (escopo por `auth.uid()` no primeiro segmento do path).

**Tarefas restantes:**
- Rodar `supabase/storage_setup.sql` no SQL editor do projeto Supabase real (nao pode ser feito por aqui, requer acesso ao painel).
- ~~Trocar o botao "Simular Upload de Arquivo" do frontend por input real.~~ Feito: `portal/index.html` agora usa `<input type="file">` real (accept pdf/jpg/png, limite 10MB), le o arquivo como base64 (`readFileAsBase64`) e envia via `file_base64` para `POST /api/applications/:id/documents`.

**Dependencias:**
- Acesso ao painel Supabase.
- Service role/anon keys corretas em ambiente de producao.

**Criterio de pronto:**
- Um usuario autenticado envia comprovante de renda real.
- Outro usuario nao consegue acessar o arquivo.
- Documento aparece na candidatura e pode ser baixado com URL assinada.

---

### 2. Scan de virus em uploads

**Status: codigo pronto e validado localmente, falta ClamAV real em producao.**

**Objetivo:** impedir armazenamento de arquivos maliciosos.

**Feito:**
- `backend/src/services/virusScan.js`: se `CLAMAV_HOST` estiver configurado, escaneia via `clamd` por stream TCP; sem isso, cai para deteccao de assinatura EICAR (suficiente para o criterio de teste automatizado, mas nao substitui um AV real em producao).
- `POST /api/applications/:id/documents` roda o scan antes do upload; arquivo infectado vira `status: 'rejected'` (HTTP 422) e nunca chega ao Storage; resultado do scan (`engine`, `clean`, `virusName`) fica em `documents.metadata.scan`.
- Teste automatizado: `backend/test/virusScan.test.js` (PDF limpo aceito, EICAR rejeitado).
- Teste real local em 2026-07-07: `docker compose up -d clamav` deixou `portal-clamav` em `running healthy`; EICAR foi detectado como `Eicar-Test-Signature` via `clamdscan` e via `scanBuffer` com `engine: 'clamav'`.

**Tarefas restantes:**
- Aplicar a mesma configuracao no ambiente de producao/staging: `docker compose up -d clamav` ou servico equivalente + `CLAMAV_HOST`/`CLAMAV_PORT` no `.env`.

**Dependencias:**
- Ambiente com ClamAV/worker ou provedor de malware scanning.

**Criterio de pronto:**
- PDF limpo e aceito.
- Arquivo de teste EICAR rejeitado.
- Resultado do scan auditavel no metadata.

---

## Fase Final 2 - Configuracao de Seguranca

### 3. JWT do Supabase com expiracao de 1h

**Status: codigo/teste pronto, falta aplicar a expiracao no painel Supabase real.**

**Objetivo:** configurar sessao de autenticacao conforme politica tecnica.

**Feito:**
- Backend valida todo Bearer token com `supabase.auth.getUser(token)` em `backend/src/middleware/auth.js`; token invalido ou expirado retorna `401`.
- Teste automatizado: `backend/test/auth.test.js` cobre header ausente, token expirado/invalido e token valido.
- Frontend inicializa Supabase Auth com `persistSession: true`, `autoRefreshToken: true` e `detectSessionInUrl: true`; chamadas API passam a buscar a sessao por helper central antes de enviar o Bearer token.

**Tarefas restantes:**
- Ajustar expiracao do access token para 3600s no painel Supabase Auth.
- Validar em staging/producao que o refresh token renova a sessao apos 1h.
- Testar manualmente com token expirado real emitido pelo Supabase.

**Dependencias:**
- Acesso admin ao projeto Supabase.

**Criterio de pronto:**
- Access token expira em 1h.
- Usuario permanece logado via refresh token.
- API rejeita token expirado com `401`.

---

## Fase Final 3 - Compliance Legal

### 4. DPO designado

**Status: endpoint/env/teste prontos, falta a decisao/nome real.**

**Objetivo:** definir responsavel por protecao de dados.

**Tarefas:**
- Nomear DPO/responsavel legal.
- ~~Configurar `DPO_EMAIL` no ambiente.~~ Ja lido de `process.env.DPO_EMAIL` em `/api/config/legal` (`backend/src/routes/config.js`) — falta so setar o valor real no `.env` de producao.
- Publicar contato na politica de privacidade.
- ~~Atualizar `/api/config/legal` com contato real.~~ Endpoint ja expoe `dataProtection.dpoEmail`.
- `backend/.env.example` documenta as variaveis legais sem valores ficticios de DPO/CNPJ.
- Teste automatizado: `backend/test/configLegal.test.js` garante que `/api/config/legal` publica DPO, suporte, URLs legais e entidade a partir do ambiente.

**Dependencias:**
- Decisao juridica/organizacional.

**Criterio de pronto:**
- Email do DPO aparece no endpoint legal.
- Politica de privacidade contem contato oficial.

---

### 5. CNPJ registrado

**Status: endpoint/env/teste prontos, falta o dado juridico real.**

**Objetivo:** formalizar entidade responsavel pelo tratamento de dados sensiveis.

**Tarefas:**
- Registrar ou associar CNPJ responsavel.
- Atualizar termos de uso e politica de privacidade.
- ~~Inserir razao social/CNPJ nos canais legais.~~ `/api/config/legal` ja expoe `entity.cnpj` e `entity.razaoSocial` (via env `CNPJ`/`RAZAO_SOCIAL`) — falta preencher com o CNPJ real.
- `backend/.env.example` deixa `CNPJ` e `RAZAO_SOCIAL` vazios para evitar publicar dados fake por acidente.
- Teste automatizado: `backend/test/configLegal.test.js` cobre a publicacao de `entity.cnpj` e `entity.razaoSocial` quando os valores reais forem configurados.

**Dependencias:**
- Processo contabil/juridico externo.

**Criterio de pronto:**
- CNPJ publicado nos termos.
- Entidade responsavel identificada em documentos legais.

---

## Fase Final 4 - Beta Real

### 6. Beta com 10 usuarios

**Status: roteiro pronto, falta recrutar e rodar com pessoas reais.**

**Objetivo:** validar fluxo completo com usuarios reais.

**Tarefas:**
- Selecionar 10 usuarios beta.
- ~~Criar roteiro de teste~~ Feito: `BETA_ROTEIRO_TESTE.md` (fluxo passo a passo + tabela de registro de bugs).
- Registrar bugs, friccoes e duvidas.
- Corrigir problemas bloqueantes.

**Dependencias:**
- Usuarios reais.
- Ambiente de staging/producao configurado.

**Criterio de pronto:**
- 10 usuarios completaram ou tentaram completar o fluxo.
- Feedback registrado.
- Bugs criticos triados.

---

### 7. NPS beta >= 7

**Status: infraestrutura de coleta pronta, falta o beta real acontecer.**

**Objetivo:** medir satisfacao minima para seguir para lancamento.

**Feito:**
- Tabela `public.nps_responses` (`supabase/schema.sql`) + RLS (usuario so ve/insere a propria resposta).
- `POST /api/nps` registra nota (0-10) e comentario aberto do usuario autenticado.
- `GET /api/nps/summary` calcula NPS (%promotores - %detratores), media, e contagem de promotores/neutros/detratores.
- `BETA_ROTEIRO_TESTE.md` documenta a pergunta padrao e o fluxo de envio.

**Tarefas restantes:**
- Enviar a pesquisa para os 10 usuarios reais apos o fluxo beta (item 6) e aguardar respostas de verdade.
- Priorizar melhorias se `GET /api/nps/summary` ficar abaixo de 7.

**Dependencias:**
- Conclusao do beta com usuarios reais.

**Criterio de pronto:**
- Pelo menos 10 respostas coletadas ou justificativa documentada.
- NPS/nota >= 7.
- Plano de acao registrado para feedbacks recorrentes.

---

## Ordem Recomendada

1. Configurar Supabase Storage privado.
2. Integrar scan de virus nos uploads.
3. Ajustar JWT no painel Supabase.
4. Publicar DPO e dados legais.
5. Registrar/publicar CNPJ.
6. Rodar beta com 10 usuarios.
7. Medir NPS e decidir lancamento.

## Marco de Conclusao

O projeto pode ser considerado 100% concluido quando:

- Upload sensivel estiver privado, escaneado e auditavel.
- Configuracoes legais e de autenticacao estiverem aplicadas no ambiente real.
- Beta com usuarios reais validar o fluxo principal.
- NPS beta for maior ou igual a 7.
