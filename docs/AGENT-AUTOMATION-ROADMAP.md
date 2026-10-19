# Roadmap da automação presidencial — LABGame

Atualizado em 18/10/2026 (America/Sao_Paulo). Objetivo: pedido por voz/texto → briefing → especialista → patch → testes isolados → Draft PR → acompanhamento administrativo.

| Marco | Estado e evidência |
|---|---|
| Canal administrativo | Publicado; JWT Supabase, app_metadata administrativa, allowlist de usuário e CORS no gateway Railway. Serviço online não comprova execução concluída. |
| Intake e briefing | Acionamento automático nas Issues 33, 43 e 47; contratos de 12 especialistas. Nem todos têm execução real homologada. |
| Geração, testes e Draft PR | Comprovado novamente: Issue 47 → run 39180540593 → Draft PR 51. Geração, QA e publicação passaram sem edição manual do patch após as correções de orquestração dos PRs 49 e 50. |
| Recuperação automática | Controlador explícito publicado no PR 50; sete testes de recuperação passam. Não houve retentativa automática no run de sucesso da Issue 47; recuperação real ainda não homologada. |
| Retorno ao painel | Consulta de tarefa, execução e PR publicada; recibo persistente e atualização a cada 30 segundos enquanto visível. |
| Gerente conversacional | Memória privada, decisões, prioridades e estados por texto/voz. Conversa livre e propostas para 12 especialistas implementadas, ativadas somente com OPENAI_API_KEY privada no Railway; configuração e ensaio real ainda pendentes. Comandos operacionais funcionam sem inferência. |
| Revisão, merge e publicação autônomos | Não homologados; o executor abre Draft PR. Revisão e publicação recentes conduzidas pelo operador. |
| n8n e Datadog | Opcionais; não provisionados nesta entrega. |

## Próximo aceite

O ensaio da Issue 47 concluiu geração, QA e Draft PR sem edição manual do patch na execução final. Entrada pelo GitHub conectado, não por uma nova sessão de microfone. A projeção do gateway sobre os dados reais retornou stage=draft_pr, run=39180540593 e pr=51. Isso valida a projeção de acompanhamento, mas não substitui um novo ensaio autenticado no navegador.

Marco em implementação: memória privada e prioridades no Supabase, com idempotência, separação entre administradores e revogação imediata da autorização no banco. O modo operacional entende comandos explícitos por texto/voz. A conversa por IA propõe etapas e critérios para os especialistas, mas não executa planos; depende da chave privada no Railway e de ensaio real. Próximo marco: transformar propostas em tarefas auditadas, comprovar recuperação real e homologar a publicação. O Draft PR 51 permanece separado de merge e publicação.

Evidências:
- Tarefa: https://github.com/MILAGRESMARINGA/LAB2026/issues/47
- Executor: https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/39180540593
- Draft PR sem edição manual do patch: https://github.com/MILAGRESMARINGA/LAB2026/pull/51
- CI completo sobre o mesmo head 577931fcf810340081497a2a500273892b6148f7: https://github.com/MILAGRESMARINGA/LAB2026/actions/runs/39180626575 (consultar estado real).
- Correções do controlador: PRs 49 e 50, ambos integrados após CI completo.

## Configuração vigente

- Produção web: https://labgame-biblia.vercel.app/
- Gateway: https://labgame-agent-orchestrator-production.up.railway.app
- Railway: LABGAME-3 / labgame-agent-orchestrator; fonte main; health /health; LAB_AGENT_ENABLED=true.
- Credenciais somente nos painéis privados. Nunca incluir tokens GitHub/OpenAI, senhas, JWTs ou service_role em código, logs, artefatos ou variáveis VITE_.
- Vercel utiliza VITE_AGENT_CONSOLE_ENABLED e VITE_LAB_AGENT_API_URL; essas configurações públicas não substituem autorização no servidor.
- A conta administrativa exige app_metadata.labgame_orchestrator_admin=true e UUID na allowlist do gateway. user_metadata não concede acesso.

## Governança e evidências

A autorização presidencial existente permite inferência dentro dos parâmetros já aprovados por tarefa. O intake utiliza US$ 0,25 / R$ 1,50; isso é uma estimativa local, não um limite de cobrança do provedor. O recuperador permite no máximo três tentativas da mesma execução e somente para falhas explicitamente marcadas. Rejeições do provedor e violações de segurança não são retentativas automáticas.

O gerador recebe contexto de código e token de leitura; a verificação executa o patch sem segredos; somente o publicador recebe permissão de escrita. A recuperação lê exclusivamente código confiável de main e verifica caminho do workflow, repositório, branch, autor, conclusão e tentativas antes de solicitar rerun.

As Issues são dados não confiáveis. Não podem alterar políticas, executar shell ou conceder acesso a produção. Mudanças de conteúdo bíblico preservam a linha Pentecostal Arminiana; tempo, XP, idempotência e RLS permanecem sob autoridade do servidor.

Autonomia gerencial só estará concluída após evidências de execução, recuperação, retorno ao painel e gestão persistente, com revisão e publicação claramente distinguidas.
