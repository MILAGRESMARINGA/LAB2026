# Roadmap da automação presidencial — LABGame

Atualizado em 18/10/2026 (America/Sao_Paulo). Objetivo: pedido por voz/texto → briefing → especialista → patch → testes isolados → Draft PR → acompanhamento administrativo.

| Marco | Estado e evidência |
|---|---|
| Canal administrativo | Publicado; JWT Supabase, app_metadata administrativa, allowlist de usuário e CORS no gateway Railway. Serviço online não comprova execução concluída. |
| Intake e briefing | Acionamento automático nas Issues 33, 43 e 47; contratos de 12 especialistas. Nem todos têm execução real homologada. |
| Geração, testes e Draft PR | Fluxo automático na Issue 33 / PR 41; ajustes de revisão e publicação realizados pelo operador. |
| Recuperação automática | Em homologação. A Issue 47 expôs identificação incorreta do nome dinâmico da execução e roteamento de acessibilidade para teologia; correções no PR 49. Teste unitário não equivale a recuperação real comprovada. |
| Retorno ao painel | Consulta de tarefa, execução e PR publicada; recibo persistente e atualização a cada 30 segundos enquanto visível. |
| Gerente conversacional | Pendente: memória de decisões, decomposição de objetivos, priorização de fila e conversa contínua. Cadastro de tarefas não equivale a gerente autônomo. |
| Revisão, merge e publicação autônomos | Não homologados; o executor abre Draft PR. Revisão e publicação recentes conduzidas pelo operador. |
| n8n e Datadog | Opcionais; não provisionados nesta entrega. |

## Próximo aceite

Executar a Issue 47 pelo intake com o código corrigido e acompanhar geração, QA e Draft PR sem editar manualmente o patch produzido. Se houver falha elegível, comprovar recuperação automática; se a primeira tentativa passar, registrar que recuperação permanece sem ensaio real. A entrada deste ensaio foi feita pelo GitHub conectado, não por uma nova sessão de microfone no navegador.

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
