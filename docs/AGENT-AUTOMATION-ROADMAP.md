# Roadmap da automação presidencial — LABGame

Atualizado em 18/10/2026. Objetivo: ordem por voz/texto → briefing → especialista → código e testes em sandbox → Draft PR → retorno ao presidente. Os 12 especialistas são acionados conforme a tarefa.

| Etapa | Entrega e aceite | Estado |
|---|---|---|
| 1 | Executor isolado, orçamento e circuit breaker; PR real | Comprovado: Issue 21 / PR 29 |
| 2 | Consulta administrativa de execução e PR por tarefa; atualização em 30 s | Código nesta branch; validar CI e publicar |
| 3 | Canal presidencial com dupla autorização e origem restrita | Código existente; configuração privada pendente |
| 4 | BET com escopo, especialista, aceite e histórico versionado | Existe no intake; ensaio pelo console pendente |
| 5 | Gerente conversacional decompõe objetivos e guarda decisões aprovadas | Pendente; cadastro de tarefas não equivale a gerente |
| 6 | Dispatch com orçamento aprovado, deduplicação durável e retorno | Parcial; orçamento automático continua zero |
| 7 | Ensaio completo com administrador real, áudio e PR | Pendente das etapas 3, 5 e 6 |
| 8 | n8n e Datadog com eventos saneados e limites de custo | Opcionais; não provisionados |

## Ativação privada do canal

Railway LABGAME-3 / labgame-agent-orchestrator: inspeção 18/10 constatou deploy SUCCESS, sem domínio e somente LAB_AGENT_ENABLED e NODE_ENV definidos. Fonte main. Não promover main apenas para ativar este serviço.

Configurar no painel Variables, nunca compartilhar valores no chat:

- LAB_AGENT_SUPABASE_ANON_KEY: chave publicável LABGame, nunca service_role.
- LAB_AGENT_GITHUB_TOKEN: token fine-grained da conta MILAGRESMARINGA limitado a LAB2026: Issues read/write, Actions read, Pull requests read. O intake atual exige Issue da conta proprietária; um bot não equivale à identidade do presidente.
- LAB_AGENT_ADMIN_USER_IDS: UUID administrativo autorizado.
- LAB_AGENT_ALLOWED_ORIGINS: origem HTTPS exata do preview.
- LAB_AGENT_ENABLED=false até homologação.

A conta precisa também de app_metadata.labgame_orchestrator_admin=true, concedido no servidor; user_metadata não concede acesso. Preparar domínio HTTPS, CSP/CORS e VITE_LAB_AGENT_API_URL / VITE_AGENT_CONSOLE_ENABLED no preview. Nunca usar VITE_ para tokens GitHub/OpenAI.

## Governança, memória e FinOps

GitHub mantém briefings, commits e evidências duráveis iniciais. A memória conversacional futura distinguirá decisão aprovada, sugestão e dado não confiável, com fonte e revisão. Não armazenar senhas, dumps ou dados de leitores. Issues não podem alterar regras superiores do gerente.

Endpoint de acompanhamento é somente leitura: estados e links, sem logs brutos/prompts. Janela de 100 runs/100 PRs com sinalização de histórico parcial. PR aberto não comprova CI aprovado. Classificação textual de risco não substitui sandbox e validação de caminhos.

Esta entrega não contrata infraestrutura, não executa novas gerações pagas nem altera produção. O orçamento da Issue 21 não autoriza inferência recorrente. Definir orçamento por tarefa e teto global antes de liberar dispatch pago pelo console.

## Aceite final

1. Usuário comum/origem inválida bloqueados; administrador validado por JWT + metadata + allowlist.
2. Pedido confirmado gera tarefa única, inclusive diante de repetição e falha de rede.
3. Especialista respeita escopo, orçamento e tentativas; testes sem segredos.
4. Painel acompanha execução real e PR correto; retorno ao presidente inclui falha e bloqueio.
5. Voz e teclado testados no preview, sem áudio armazenado.
6. CI completo verde, revisão de segurança e aprovação separada para produção.

Autonomia gerencial só estará concluída quando todos esses critérios tiverem evidência.
