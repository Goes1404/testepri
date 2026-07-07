# Roteiro de Teste - Beta com 10 Usuarios

> Suporte ao Roadmap Final, Fase 4, item 6. Este roteiro e o formulario de bugs sao o que pode ser preparado sem usuarios reais; a execucao em si depende de recrutar as 10 pessoas.

## Perfil dos 10 usuarios

- 6 concluintes do ensino medio (publico-alvo principal ProUni).
- 2 cursando ultimo ano do EM.
- 2 que ja tentaram FIES/SISU antes (comparar expectativa).

## Fluxo a testar (nesta ordem)

1. **Onboarding**: cadastro, aceite de termos/privacidade, perfil inicial.
2. **Busca de bolsa**: usar filtros (curso, cidade, nota) e comparador.
3. **Detalhe da bolsa**: ler custo real, elegibilidade, prazos.
4. **Candidatura**: iniciar candidatura de uma bolsa.
5. **Documentos**: enviar RG/CPF/comprovante de renda pelo upload real (arquivo de verdade, nao just clicar).
6. **Notificacao**: verificar se recebe notificacao de status/prazo.
7. **NPS final**: responder a pesquisa (`POST /api/nps`) ao fim do fluxo.

## Registro de bugs/friccoes

Para cada usuario, registrar:

| Campo | Descricao |
|---|---|
| Etapa | Qual das 7 acima |
| O que aconteceu | Comportamento observado |
| Esperado | O que o usuario esperava |
| Severidade | Bloqueante / Alto / Medio / Baixo |
| Print/video | Link se houver |

Bloqueantes (impedem concluir o fluxo) devem ser corrigidos antes de calcular o NPS final.

## Pesquisa NPS

Pergunta padrao: "De 0 a 10, o quanto voce recomendaria o Portal do Aluno para um amigo no mesmo processo de bolsa?"
Seguida de campo aberto: "O que mais te incomodou ou te ajudou?"

Enviar via `POST /api/nps` com `{ score, comentario }` (usuario autenticado). Consultar resultado agregado em `GET /api/nps/summary` (retorna `nps`, `average`, `promoters`, `passives`, `detractors`).

## Criterio de pronto (do roadmap)

- 10 usuarios completaram ou tentaram completar o fluxo.
- Feedback registrado (tabela acima).
- Bugs criticos triados.
- Pelo menos 10 respostas de NPS coletadas, `nps >= 7` (numa escala de 0-10, ou recalculado conforme criterio interno da empresa).
