# Processo de Resposta a Incidentes

## Objetivo

Garantir triagem, contenção, comunicação e registro de incidentes de segurança envolvendo dados pessoais do Portal do Aluno, incluindo a janela de notificação de até 72 horas prevista pela LGPD.

## Severidade

- `S1`: vazamento confirmado de dados pessoais sensíveis, credenciais, documentos ou renda.
- `S2`: acesso indevido provável, exposição parcial, falha explorável em produção.
- `S3`: tentativa bloqueada, erro sem exposição confirmada, alerta preventivo.

## Linha do Tempo

- `0-1h`: registrar incidente, congelar evidências e nomear responsável.
- `1-4h`: conter o vetor, rotacionar chaves/tokens afetados e preservar logs.
- `4-24h`: estimar usuários afetados, classes de dados, origem e impacto.
- `24-48h`: preparar comunicação ao DPO/responsável legal, usuários e ANPD, quando aplicável.
- `48-72h`: enviar notificações obrigatórias e publicar orientação de mitigação aos usuários afetados.
- `Após 72h`: revisar causa raiz, criar plano corretivo e registrar lições aprendidas.

## Checklist Operacional

- Confirmar escopo: tabelas, buckets, endpoints e período afetado.
- Exportar logs de auditoria e métricas relacionadas.
- Revogar credenciais suspeitas e rotacionar secrets.
- Validar que o vetor foi encerrado antes de reabrir o serviço.
- Registrar evidências em local restrito.
- Comunicar suporte para respostas consistentes.
- Abrir tarefas corretivas com dono e prazo.

## Contatos

- Suporte: `SUPPORT_EMAIL`
- DPO/responsável legal: `DPO_EMAIL`
- Operações: canal interno configurado em `SLACK_WEBHOOK_URL`

## Critério de Encerramento

O incidente só é encerrado quando contenção, comunicação, correção e registro pós-incidente estiverem completos.
