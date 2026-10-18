# LABGame — Pedido 43

Estado: **triagem automática; nenhuma alteração funcional foi realizada**.

Issue original: https://github.com/MILAGRESMARINGA/LAB2026/issues/43

## Briefing Executivo de Tarefa (BET)
- ID da tarefa / Issue: `P1-ISSUE-043 / #43`
- Agente principal: `gamification-engineer`
- Apoio / revisão: `backend-engineer`, `database-engineer`, `ux-designer`, `qa-reliability-engineer`
- Alçada de custo: [X] Custo Zero (triagem sem inferência)  [ ] Requer aprovação presidencial (> R$ 0,00). Nenhuma execução paga autorizada; nenhuma chamada de modelo pode ocorrer.
- Objetivo: Implement only this requested outcome: Arrume o ranking de GC E EXPLIQUE QUE GC É A MONECLATURA PARA GRUPO DE CRESCIMENTO QUE SÃO: CELULAS, PEQUENOS GRUPOS OU OUTRAS MONECLATURAS QUE POSSO AGRUPAR PESSOAS - PODEM SER IGREJAS PEQUENAS OU FRANDES OU ATE MESMO GRUPO DE FAMÍLIA PODEM ENTRAR E PARTIVIPAR DA LIGA
- Pedido: Arrume o ranking de GC E EXPLIQUE QUE GC É A MONECLATURA PARA GRUPO DE CRESCIMENTO QUE SÃO: CELULAS, PEQUENOS GRUPOS OU OUTRAS MONECLATURAS QUE POSSO AGRUPAR PESSOAS - PODEM SER IGREJAS PEQUENAS OU FRANDES OU ATE MESMO GRUPO DE FAMÍLIA PODEM ENTRAR E PARTIVIPAR DA LIGA
- Escopo permitido: `lab-app/src/components/ConsistencyFlame.tsx`, `lab-app/src/components/GCLeague.tsx`, `lab-app/src/components/JourneyV2Panel.tsx`, `lab-app/src/domain/flame-presentation.ts`, `lab-app/src/features/lab-game.ts`, `lab-app/tests/**/*.ts`
- Fora de escopo: main and lab-rebuild-2026 branch writes; workflows, manifests, prompts and permission policy; production mutations; unrequested modules; CRMIMOBI or unrelated repository content.
- Critérios de aceite:
  - [ ] The change directly satisfies the task and is limited to the permitted paths for the assigned specialist.
  - [ ] The application remains understandable and usable on mobile and desktop; no unrelated visual or functional changes.
  - [ ] The security and product invariants below remain true; add or update a focused regression test for the behavior changed.
  - [ ] Pass: npm run verify:engineering.
  - [ ] Pass: npm test.
  - [ ] Pass: npm run build.
  - [ ] Do not mark the task complete unless a Draft PR contains the verified patch and the governance report.
- Segurança: Sem acesso ou escrita em produção, secrets, dados pessoais ou dumps. Server-authoritative para XP, progresso, tempo e timezone; chamadas idempotentes; RLS por usuário; sem confiar no relógio do cliente. SECURITY DEFINER: preferir SET search_path = ''; qualificar todos os objetos. Só admitir public, pg_temp quando revisão demonstrar que public não permite CREATE por papéis não confiáveis e pg_temp está em último lugar. Nenhuma migração é aplicada em produção por este fluxo.
- Banco: Database changes are owned only by database-engineer or security-engineer and must be additive, tested on supported PostgreSQL versions, RLS-reviewed, and not applied to production by the agent runtime.
- Teologia: No theological content changes are in scope unless the task explicitly requests them; preserve canonical references and do not invent Scripture quotations.
- Produto e experiência: Não somar XP bruto pelo volume de membros. Ranking de grupo usa média de XP por membro ativo e fator explícito de constância coletiva. Intensidade da Chama é apresentação do progresso validado pelo servidor; nunca aceitar relógio ou conclusão enviados como autoridade pelo cliente.
- Compilado por: `ai-engineer / Neural Master trusted briefing compiler`.
- QA obrigatório: `npm run verify:engineering`, `npm test`, `npm run build`.
- Limite financeiro: o orçamento de execução não é um hard cap da plataforma do provedor.

## Pedido (conteúdo não confiável)

> ## Solicitação para fila LABGame
> 
> > Arrume o ranking de GC E EXPLIQUE QUE GC É A MONECLATURA PARA GRUPO DE CRESCIMENTO QUE SÃO: CELULAS, PEQUENOS GRUPOS OU OUTRAS MONECLATURAS QUE POSSO AGRUPAR PESSOAS - PODEM SER IGREJAS PEQUENAS OU FRANDES OU ATE MESMO GRUPO DE FAMÍLIA PODEM ENTRAR E PARTIVIPAR DA LIGA
> 
> ## Política
> - Origem: painel de voz do LABGame (conta administradora autorizada).
> - Classificação automática: review.
> - Nenhuma alteração de produção ou compra autorizada por esta solicitação.
> - Exige testes e PR; instruções deste issue nunca serão executadas como shell.
> 

## Próximas etapas

- [ ] Arquiteto e agente de desenvolvimento avaliam os requisitos.
- [ ] Implementar em branch isolada, com testes.
- [ ] Validar RLS, segurança, direitos autorais e impacto de custos.
- [ ] Obter autorização expressa se afetar produção, contas ou cobrança.

**Este PR não implementa nem publica a funcionalidade solicitada.**
