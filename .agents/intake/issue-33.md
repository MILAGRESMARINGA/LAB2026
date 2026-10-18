# LABGame — Pedido 33

Estado: **triagem automática; nenhuma alteração funcional foi realizada**.

Issue original: https://github.com/MILAGRESMARINGA/LAB2026/issues/33

## Briefing Executivo de Tarefa (BET)
- ID da tarefa / Issue: `P1-ISSUE-033 / #33`
- Agente principal: `biblical-canon-engineer`
- Apoio / revisão: `backend-engineer`, `security-engineer`, `qa-reliability-engineer`
- Alçada de custo: [X] Custo Zero (triagem sem inferência)  [ ] Requer aprovação presidencial (> R$ 0,00). Nenhuma execução paga autorizada; nenhuma chamada de modelo pode ocorrer.
- Objetivo: Implement only this requested outcome: Auditar os estudos bíblicos do LABGame e tornar cada estudo clicável, com navegação clara para abrir o conteúdo e as referências bíblicas. Criar somente um Draft PR em branch de agente. Não alterar produção, banco, migrations ou dados reais. Executar testes antes de abrir o PR.
- Pedido: Auditar os estudos bíblicos do LABGame e tornar cada estudo clicável, com navegação clara para abrir o conteúdo e as referências bíblicas. Criar somente um Draft PR em branch de agente. Não alterar produção, banco, migrations ou dados reais. Executar testes antes de abrir o PR.
- Escopo permitido: `lab-app/supabase/functions/study-generate/**/*.ts`, `lab-app/supabase/functions/study-generate/**/*.mjs`, `lab-app/tests/study-*.test.ts`
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
- Teologia: Quando a tarefa tocar em conteúdo bíblico: exegese contextual; linha evangélica Pentecostal Arminiana (graça preveniente, responsabilidade e livre-arbítrio, santificação prática, atualidade dos dons e escatologia pré-milenista); não ensinar determinismo/calvinismo como posição do produto; não atribuir ao texto ideias que ele não afirma nem fabricar citações. Registrar leituras conectadas somente quando houver vínculo textual/teológico direto; manter leituras sem vínculo em estudos separados.
- Produto e experiência: Interface sem poluição visual, legível para leitura prolongada, acessível por teclado/leitor de tela quando aplicável, com alvos de toque adequados e validação em viewport móvel e desktop.
- Compilado por: `ai-engineer / Neural Master trusted briefing compiler`.
- QA obrigatório: `npm run verify:engineering`, `npm test`, `npm run build`.
- Limite financeiro: o orçamento de execução não é um hard cap da plataforma do provedor.

## Pedido (conteúdo não confiável)

> ## Solicitação para fila LABGame
> 
> > Auditar os estudos bíblicos do LABGame e tornar cada estudo clicável, com navegação clara para abrir o conteúdo e as referências bíblicas. Criar somente um Draft PR em branch de agente. Não alterar produção, banco, migrations ou dados reais. Executar testes antes de abrir o PR.
> 
> ## Política
> - Origem: painel de voz do LABGame (conta administradora autorizada).
> - Classificação automática: approval_required.
> - Nenhuma alteração de produção ou compra autorizada por esta solicitação.
> - Exige testes e PR; instruções deste issue nunca serão executadas como shell.
> 

## Próximas etapas

- [ ] Arquiteto e agente de desenvolvimento avaliam os requisitos.
- [ ] Implementar em branch isolada, com testes.
- [ ] Validar RLS, segurança, direitos autorais e impacto de custos.
- [ ] Obter autorização expressa se afetar produção, contas ou cobrança.

**Este PR não implementa nem publica a funcionalidade solicitada.**
